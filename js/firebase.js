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
   * Upsert a user document in Firestore when they sign in via Clerk.
   * @param {Object} clerkUser - The Clerk user object
   */
  async function saveUser(clerkUser) {
    if (!initialized) { init(); if (!initialized) return; }
    try {
      const uid = clerkUser.id;
      const userRef = db.collection('users').doc(uid);
      const snap = await userRef.get();

      const data = {
        uid,
        name:      clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
        email:     clerkUser.primaryEmailAddress?.emailAddress || '',
        photoURL:  clerkUser.imageUrl || '',
        updatedAt: now(),
      };

      if (!snap.exists) {
        // New user — create full document
        data.createdAt     = now();
        data.totalBookings = 0;
        await userRef.set(data);
        console.log('[AshtaFirebase] New user created:', uid);
      } else {
        // Existing user — update mutable fields only
        await userRef.update({
          name:      data.name,
          email:     data.email,
          photoURL:  data.photoURL,
          updatedAt: data.updatedAt,
        });
        console.log('[AshtaFirebase] User updated:', uid);
      }
    } catch (e) {
      console.error('[AshtaFirebase] saveUser error:', e);
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
   * @param {string} uid
   * @param {Object} data - Fields to update (name, phone, travelStyle, preferredStates, etc.)
   */
  async function updateUserProfile(uid, data) {
    if (!initialized) { init(); if (!initialized) return; }
    try {
      await db.collection('users').doc(uid).update({
        ...data,
        updatedAt: now(),
      });
      console.log('[AshtaFirebase] Profile updated for:', uid);
    } catch (e) {
      console.error('[AshtaFirebase] updateUserProfile error:', e);
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
  };

  // Auto-init when DOM is ready (Firebase CDN may still be loading)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Small delay to ensure Firebase CDN scripts have executed
    setTimeout(init, 100);
  }

})();
