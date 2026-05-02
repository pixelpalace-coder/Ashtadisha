/* Global runtime configuration.
 * Replace placeholder values before production deploy.
 */
(function () {
  "use strict";

  window.AshtaConfig = {
    firebase: {
      apiKey: "AIzaSyBLnnFOpRXH4N-EOmuFxpAajdku0CncG8k",
      authDomain: "ashtadisha-2005.firebaseapp.com",
      projectId: "ashtadisha-2005",
      storageBucket: "ashtadisha-2005.firebasestorage.app",
      messagingSenderId: "633104850688",
      appId: "1:633104850688:web:dd25c42fff6fd3d2d55de5",
    },
    functionsRegion: "asia-south1",
    stripePublishableKey:
      "pk_test_51TSU9u7Ov4Fa2AZs12lRrZzsUF2hkPd2caMpfv02cAz6Bus3s3od1cTSnb4qDGvKye3mbe5V0YCi37veM0iy1gs400VzAXhlzg",
    appUrl: window.location.origin,
  };
})();
