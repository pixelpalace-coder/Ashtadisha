/* Copy to app-config.js and fill in values. Do not commit real secrets to public repos. */
(function () {
  "use strict";

  window.AshtaConfig = {
    firebase: {
      apiKey: "YOUR_FIREBASE_API_KEY",
      authDomain: "YOUR_PROJECT.firebaseapp.com",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_PROJECT.appspot.com",
      messagingSenderId: "YOUR_SENDER_ID",
      appId: "YOUR_APP_ID",
    },
    functionsRegion: "asia-south1",
    stripePublishableKey: "pk_test_YOUR_STRIPE_PUBLISHABLE_KEY",
    appUrl: window.location.origin,
  };
})();
