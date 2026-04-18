/* ============================================================
   ASHTADISHA — Python Backend API Integration
   js/firebase.js 

   (Previously handled Firebase, now routes exactly the same
   surface API to a local Python + MySQL backend).
   
   Auth: Handled by Firebase Client SDK
   Database: Handled by Python API Backend
   ============================================================ */

(function () {
  'use strict';

  // ── Environment ───────────────────────────────────────────
  const API_BASE_URL = 'http://localhost:5000/api';
  const MOCK_PACKAGES = {
    complete: { id: 'complete', name: 'The Complete 7 Sisters', destination: 'All 7 States', duration: '14 Days', pricePerPerson: 89000, image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=400&q=75', source: 'PREDEFINED' },
    assam_megh: { id: 'assam_megh', name: 'Assam + Meghalaya Escape', destination: 'Assam & Meghalaya', duration: '7 Days', pricePerPerson: 42500, image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=400&q=75', source: 'PREDEFINED' },
    arunachal: { id: 'arunachal', name: 'Arunachal Deep Dive', destination: 'Arunachal Pradesh', duration: '9 Days', pricePerPerson: 58500, image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=400&q=75', source: 'PREDEFINED' }
  };
  const MOCK_KEY = 'ashta_mock_bookings';
  
  // Keep Firebase Init for Auth (Google/Facebook Login purposes)
  // ⚠️  REPLACE with your real Firebase project config if Auth resets
  const FIREBASE_CONFIG = {
    apiKey:            "AIzaSyBLnnFOpRXH4N-EOmuFxpAajdku0CncG8k",
    authDomain:        "ashtadisha-2005.firebaseapp.com",
    projectId:         "ashtadisha-2005",
    storageBucket:     "ashtadisha-2005.firebasestorage.app",
    messagingSenderId: "633104850688",
    appId:             "1:633104850688:web:dd25c42fff6fd3d2d55de5"
  };

  let initialized = false;

  function init() {
    if (initialized) return;
    try {
      if (!window.firebase) {
        console.warn('[AshtaAPI] Firebase Client SDK for Auth not loaded.');
        return;
      }
      if (!firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }
      initialized = true;
      console.log('[AshtaAPI] Auth Initialized ✓ / DB routed to Python API ✓');
    } catch (e) {
      console.error('[AshtaAPI] Init error:', e);
    }
  }

  // ── Internal Fetch Helper ─────────────────────────────────
  async function apiPost(endpoint, payload) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error(`[AshtaAPI] Fetch Error on POST ${endpoint}:`, err);
      return null;
    }
  }

  async function apiGet(endpoint) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error(`[AshtaAPI] Fetch Error on GET ${endpoint}:`, err);
      return null;
    }
  }

  function getMockBookingsStore() {
    try {
      return JSON.parse(localStorage.getItem(MOCK_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function setMockBookingsStore(value) {
    localStorage.setItem(MOCK_KEY, JSON.stringify(value));
  }

  // ── Database Methods (Now routing to Python/MySQL) ────────

  /**
   * Upsert a user document in MySQL when they sign in.
   */
  async function saveUser(fbUser, customName = null) {
    if (!initialized) { init(); }
    const uid = fbUser.uid;
    const name = customName || fbUser.displayName || fbUser.email.split('@')[0] || 'Traveler';
    
    const payload = {
      uid: uid,
      name: name,
      email: fbUser.email || '',
      photoURL: fbUser.photoURL || ''
    };

    const res = await apiPost('/users', payload);
    if (res && res.success) {
      console.log(`[AshtaAPI] User ${res.action} in MySQL:`, uid);
      return payload;
    }
    return null;
  }

  /**
   * Save a contact/enquiry to MySQL.
   */
  async function saveEnquiry(data) {
    const res = await apiPost('/enquiries', data);
    if (res && res.success) {
      console.log('[AshtaAPI] Enquiry saved in MySQL:', res.id);
      return res.id;
    }
    return null;
  }

  /**
   * Create a booking document after payment.
   */
  async function createBooking(bookingData) {
    const res = await apiPost('/bookings', bookingData);
    if (res && res.success) {
      console.log('[AshtaAPI] Booking created in MySQL:', res.id);
      return res.id;
    }

    const store = getMockBookingsStore();
    const list = Array.isArray(store[bookingData.userId]) ? store[bookingData.userId] : [];
    const localId = Date.now();
    list.unshift({
      id: localId,
      ...bookingData,
      createdAt: new Date().toISOString(),
      status: bookingData.status || 'confirmed'
    });
    store[bookingData.userId] = list;
    setMockBookingsStore(store);
    console.warn('[AshtaAPI] Backend unavailable, booking saved locally.');
    return localId;
  }

  /**
   * Fetch a single user profile from MySQL via Python API.
   */
  async function getUserProfile(uid) {
    const res = await apiGet(`/users/${uid}`);
    if (res) return res;
    return {
      uid,
      name: "Traveler",
      email: "",
      photoURL: "",
      city: "",
      totalBookings: 0
    };
  }

  /**
   * Fetch all bookings for a user from MySQL.
   */
  async function getUserBookings(uid) {
    const res = await apiGet(`/bookings/${uid}`);
    if (res && Array.isArray(res)) {
       return res;
    }
    const store = getMockBookingsStore();
    return Array.isArray(store[uid]) ? store[uid] : [];
  }

  /**
   * Partial profile update.
   */
  async function updateUserProfile(uid, data) {
    const payload = { uid: uid, ...data };
    const res = await apiPost('/users', payload);
    if (res && res.success) {
      console.log('[AshtaAPI] Profile updated in MySQL:', uid);
      // Also update Auth profile fallback
      if (data.name && window.firebase) {
        const user = firebase.auth().currentUser;
        if (user && user.uid === uid) {
          await user.updateProfile({ displayName: data.name });
        }
      }
    }
  }

  /**
   * Fetch all travel packages from MySQL.
   */
  async function getPackages() {
    const res = await apiGet('/packages');
    if (res && Object.keys(res).length) {
      const normalized = {};
      Object.entries(res).forEach(([key, pkg]) => {
        const id = pkg.id || key;
        normalized[id] = {
          id,
          name: pkg.name || pkg.title || 'Northeast Journey',
          destination: pkg.destination || 'Northeast India',
          duration: pkg.duration || '7 Days',
          pricePerPerson: Number(pkg.pricePerPerson ?? pkg.price ?? 0),
          image: pkg.image || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=400&q=75',
          source: 'PREDEFINED'
        };
      });
      return normalized;
    }
    return MOCK_PACKAGES;
  }

  /**
   * Fake upload logic as we removed Firebase cloud storage. 
   * A true backend implementation would POST a blob file here.
   */
  async function uploadReceiptBlob(blob, bookingId) {
    const url = "local_storage_receipt.html"; 
    console.log('[AshtaAPI] Receipt saved locally (Placeholder):', url);
    return url;
  }

  // ── Expose Public API ─────────────────────────────────────
  // Keeping the object name AshtaFirebase so we don't break
  // other JS files (booking-checkout.js, auth.js) that call it.
  window.AshtaFirebase = {
    init,
    saveUser,
    getUserProfile,
    saveEnquiry,
    createBooking,
    getUserBookings,
    updateUserProfile,
    uploadReceiptBlob,
    getPackages,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100);
  }

})();
