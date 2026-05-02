/* Firebase client gateway for Auth + Firestore + Functions. */
(function () {
  "use strict";

  let initialized = false;
  let db = null;
  let functions = null;
  const fallbackPackages = Array.isArray(window.AshtaPredefinedPackages) ? window.AshtaPredefinedPackages : [];

  function init() {
    if (initialized) return;
    if (!window.firebase || !window.AshtaConfig?.firebase?.apiKey) return;

    if (!firebase.apps.length) {
      firebase.initializeApp(window.AshtaConfig.firebase);
    }
    db = firebase.firestore();
    functions = firebase.app().functions(window.AshtaConfig.functionsRegion || "asia-south1");
    initialized = true;
  }

  async function saveUser(fbUser, customName) {
    init();
    if (!db || !fbUser) return null;
    const payload = {
      uid: fbUser.uid,
      name: customName || fbUser.displayName || "Traveler",
      email: fbUser.email || "",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
    await db.collection("users").doc(fbUser.uid).set(payload, { merge: true });
    return payload;
  }

  async function getUserProfile(uid) {
    init();
    const doc = await db.collection("users").doc(uid).get();
    return doc.exists ? doc.data() : null;
  }

  async function updateUserProfile(uid, data) {
    init();
    await db.collection("users").doc(uid).set(data, { merge: true });
  }

  async function getPackages() {
    init();
    const snap = await db.collection("packages").orderBy("createdAt", "desc").get();
    if (snap.empty) {
      return fallbackPackages.reduce((acc, p) => {
        acc[p.id] = {
          id: p.id,
          name: p.title,
          title: p.title,
          duration: p.duration,
          destination: p.destination || "Seven Sisters",
          image: p.image,
          pricePerPerson: Number(p.price),
          price: Number(p.price),
          description: p.description || "",
        };
        return acc;
      }, {});
    }
    const out = {};
    snap.forEach((d) => {
      const pkg = d.data();
      out[d.id] = {
        id: d.id,
        name: pkg.title || pkg.name,
        title: pkg.title || pkg.name,
        duration: pkg.duration,
        destination: Array.isArray(pkg.locations) ? pkg.locations.join(", ") : "Seven Sisters",
        image: pkg.image,
        description: pkg.description || "",
        pricePerPerson: Number(pkg.price || 0),
        price: Number(pkg.price || 0),
      };
    });
    return out;
  }

  async function getUserBookings(uid) {
    init();
    const snap = await db.collection("bookings").where("userId", "==", uid).orderBy("createdAt", "desc").get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async function getUserAIPlans(uid) {
    init();
    const snap = await db.collection("aiPlans").where("userId", "==", uid).orderBy("createdAt", "desc").get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async function saveEnquiry() {
    return null;
  }

  async function createBooking(input) {
    const user = window.firebase?.auth()?.currentUser;
    if (!user) throw new Error("Must be signed in to book.");
    
    // Map frontend fields to Python backend schema
    const payload = {
      userId: user.uid,
      packageName: input.packageId || "AI Custom Plan",
      travelers: input.travelers,
      travelDate: input.travelDate,
      totalAmount: input.totalPrice,
      status: "PAID",
      bookingSource: "mock_gateway"
    };

    try {
      const response = await fetch("http://localhost:5000/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Booking save failed on server.");
      }
      const data = await response.json();
      return { bookingId: data.id };
    } catch (e) {
      console.error("[AshtaFirebase] createBooking error:", e);
      throw e;
    }
  }

  async function createStripeSession(input) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ sessionId: "mock-session-" + Date.now() });
      }, 500);
    });
  }

  async function generateAIPlan(input) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const dest = input.destination || "Northeast India";
        const cost = input.budget || 25000;
        const duration = input.duration || 3;
        
        const itinerary = [];
        for (let i = 1; i <= duration; i++) {
          itinerary.push({
            day: i,
            title: i === 1 ? "Arrival & Exploration" : i === duration ? "Departure" : "Sightseeing & Adventure",
            estimatedCost: Math.round(cost / duration),
            description: `Day ${i} in ${dest}. Experience the local beauty and vibrant culture.`,
            morning: "Breakfast and local tour",
            afternoon: "Visit famous viewpoints",
            evening: "Relaxation and local dinner"
          });
        }

        resolve({
          planId: "mock-plan-" + Date.now(),
          plan: {
            title: `Custom Adventure to ${dest}`,
            estimatedTotalCost: cost,
            highlights: ["Experience local culture", "Breathtaking landscapes", "Authentic cuisine"],
            suggestedPlaces: [dest + " Central", dest + " Highlights", "Hidden Gems"],
            travelTips: ["Carry warm clothes", "Keep IDs handy for permits"],
            itinerary: itinerary
          }
        });
      }, 1500);
    });
  }

  window.AshtaFirebase = {
    init,
    saveUser,
    getUserProfile,
    updateUserProfile,
    getPackages,
    getUserBookings,
    getUserAIPlans,
    saveEnquiry,
    createBooking,
    createStripeSession,
    generateAIPlan,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
