/* ============================================================
   ASHTADISHA — Firebase Integration
   js/firebase.js
   
   Uses Firebase v9 compat SDK (loaded via CDN in index.html).
   Exposes window.AshtaFirebase for use by other modules.
   
   PLACEHOLDER CONFIG — replace with real values from:
   https://console.firebase.google.com
   ============================================================ */

(function () {
  'use strict';

  // ── Firebase Config ────────────────────────────────────────
  // ⚠️  REPLACE with your real Firebase project config
  const FIREBASE_CONFIG = {
    apiKey:            "AIzaSyBLnnFOpRXH4N-EOmuFxpAajdku0CncG8k",
    authDomain:        "ashtadisha-2005.firebaseapp.com",
    projectId:         "ashtadisha-2005",
    storageBucket:     "ashtadisha-2005.firebasestorage.app",
    messagingSenderId: "633104850688",
    appId:             "1:633104850688:web:dd25c42fff6fd3d2d55de5"
  };

  // ── Init ──────────────────────────────────────────────────
  let db, storage, initialized = false;

  function init() {
    if (initialized) return;
    try {
      if (!window.firebase) {
        console.warn('[AshtaFirebase] Firebase SDK not loaded yet.');
        return;
      }
      // Only initialize if not already done
      if (!firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }
      db      = firebase.firestore();
      storage = firebase.storage();
      initialized = true;
      console.log('[AshtaFirebase] Initialized ✓');
    } catch (e) {
      console.error('[AshtaFirebase] Init error:', e);
    }
  }

  // ── Timestamp helper ─────────────────────────────────────
  function now() {
    return firebase.firestore.FieldValue.serverTimestamp();
  }

  // ── saveUser ─────────────────────────────────────────────
  /**
   * Upsert a user document in Firestore when they sign in.
   * Ensures the user's name is collected and stored correctly.
   */
  async function saveUser(fbUser) {
    if (!initialized) { init(); if (!initialized) return; }
    try {
      const uid = fbUser.uid;
      const userRef = db.collection('users').doc(uid);
      const snap = await userRef.get();

      // Priority: Firestore name > Auth displayName > email prefix
      let storedName = snap.exists ? snap.data().name : null;
      let name = storedName || fbUser.displayName || fbUser.email.split('@')[0] || 'Traveler';

      const data = {
        uid,
        name,
        email:     fbUser.email || '',
        photoURL:  fbUser.photoURL || '',
        updatedAt: now(),
      };

      if (!snap.exists) {
        data.createdAt     = now();
        data.totalBookings = 0;
        await userRef.set(data);
        console.log('[AshtaFirebase] New user created:', uid);
      } else {
        await userRef.update({
          email:     data.email,
          photoURL:  data.photoURL,
          updatedAt: data.updatedAt,
        });
        console.log('[AshtaFirebase] User synced:', uid);
      }
      return data;
    } catch (e) {
      console.error('[AshtaFirebase] saveUser error:', e);
      return null;
    }
  }

  // ── saveEnquiry ───────────────────────────────────────────
  /**
   * Save a contact/AI-planner enquiry to Firestore.
   * @param {Object} data - { name, email, phone, destination, travelMonth, message }
   * @returns {string|null} - The new document ID, or null on error
   */
  async function saveEnquiry(data) {
    if (!initialized) { init(); if (!initialized) return null; }
    try {
      const docRef = await db.collection('enquiries').add({
        ...data,
        status:    'new',
        createdAt: now(),
      });
      console.log('[AshtaFirebase] Enquiry saved:', docRef.id);
      return docRef.id;
    } catch (e) {
      console.error('[AshtaFirebase] saveEnquiry error:', e);
      return null;
    }
  }

  // ── createBooking ──────────────────────────────────────────
  /**
   * Create a booking document after successful Razorpay payment.
   * @param {Object} bookingData - { userId, packageName, destination, travelers,
   *                                 travelDate, totalAmount, paymentId, ... }
   * @returns {string|null} - The booking document ID (used as Booking Ref)
   */
  async function createBooking(bookingData) {
    if (!initialized) { init(); if (!initialized) return null; }
    try {
      const docRef = await db.collection('bookings').add({
        ...bookingData,
        status:    'confirmed',
        createdAt: now(),
      });

      // Increment user's totalBookings counter
      if (bookingData.userId) {
        const userRef = db.collection('users').doc(bookingData.userId);
        await userRef.update({
          totalBookings: firebase.firestore.FieldValue.increment(1),
        });
      }

      console.log('[AshtaFirebase] Booking created:', docRef.id);
      return docRef.id;
    } catch (e) {
      console.error('[AshtaFirebase] createBooking error:', e);
      return null;
    }
  }

  // ── getUserBookings ───────────────────────────────────────
  /**
   * Fetch all bookings for a given user UID, ordered newest first.
   * @param {string} uid
   * @returns {Array} - Array of booking objects with .id fields
   */
  async function getUserBookings(uid) {
    if (!initialized) { init(); if (!initialized) return []; }
    try {
      const snap = await db.collection('bookings')
        .where('userId', '==', uid)
        .orderBy('createdAt', 'desc')
        .get();

      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.error('[AshtaFirebase] getUserBookings error:', e);
      return [];
    }
  }

  // ── updateUserProfile ────────────────────────────────────
  /**
   * Merge-update a user's profile fields.
   */
  async function updateUserProfile(uid, data) {
    if (!initialized) { init(); if (!initialized) return; }
    try {
      await db.collection('users').doc(uid).set({
        ...data,
        updatedAt: now(),
      }, { merge: true });
      
      // Also update Firebase Auth profile if name changed
      if (data.name) {
        const user = firebase.auth().currentUser;
        if (user && user.uid === uid) {
          await user.updateProfile({ displayName: data.name });
        }
      }
      console.log('[AshtaFirebase] Profile updated:', uid);
    } catch (e) {
      console.error('[AshtaFirebase] updateUserProfile error:', e);
    }
  }

  // ── getPackages ───────────────────────────────────────────
  /**
   * Fetch all travel packages from Firestore.
   */
  async function getPackages() {
    if (!initialized) { init(); if (!initialized) return []; }
    try {
      const snap = await db.collection('packages').get();
      const packages = {};
      snap.forEach(doc => {
        packages[doc.id] = { id: doc.id, ...doc.data() };
      });
      return packages;
    } catch (e) {
      console.error('[AshtaFirebase] getPackages error:', e);
      return {};
    }
  }

  // ── uploadReceiptBlob ──────────────────────────────────────
  /**
   * Upload an HTML receipt Blob to Firebase Storage.
   * @param {Blob} blob
   * @param {string} bookingId
   * @returns {string|null} - Download URL, or null on error
   */
  async function uploadReceiptBlob(blob, bookingId) {
    if (!initialized) { init(); if (!initialized) return null; }
    try {
      const ref = storage.ref(`receipts/${bookingId}.html`);
      await ref.put(blob, { contentType: 'text/html' });
      const url = await ref.getDownloadURL();
      console.log('[AshtaFirebase] Receipt uploaded:', url);
      return url;
    } catch (e) {
      console.error('[AshtaFirebase] uploadReceiptBlob error:', e);
      return null;
    }
  }

  // ── Expose Public API ─────────────────────────────────────
  window.AshtaFirebase = {
    init,
    saveUser,
    saveEnquiry,
    createBooking,
    getUserBookings,
    updateUserProfile,
    uploadReceiptBlob,
    getPackages,
  };

  // Auto-init when DOM is ready (Firebase CDN may still be loading)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Small delay to ensure Firebase CDN scripts have executed
    setTimeout(init, 100);
  }

})();
