/* ============================================================
   ASHTADISHA — Razorpay Payment Integration
   js/payment.js

   Uses Razorpay JS SDK loaded via CDN (window.Razorpay).
   Exposes window.AshtaPayment for use by booking-checkout.js.

   NOTE: Pure frontend integration (no server-side order creation).
   For production, generate order_id via a Firebase Cloud Function.

   ⚠️  REPLACE rzp_test_XXXXXXXXXXXXXXXX with your real key from:
   https://dashboard.razorpay.com
   ============================================================ */

(function () {
  'use strict';

  // ── Config ────────────────────────────────────────────────
  const RZP_KEY_ID    = 'rzp_test_SbecdaC1uytdyN';
  const BRAND_COLOR   = '#1A3C2E';
  const COMPANY_NAME  = 'Ashtadisha';
  const COMPANY_DESC  = 'Northeast India Travel';
  const COMPANY_LOGO  = ''; // optional: URL to your logo image

  // ── Helpers ───────────────────────────────────────────────
  /**
   * Convert INR (₹) amount to paise (Razorpay works in smallest currency unit)
   * @param {number} amountINR
   * @returns {number}
   */
  function getAmountPaise(amountINR) {
    return Math.round(amountINR * 100);
  }

  /**
   * Format INR number for display
   * @param {number} amount
   * @returns {string}
   */
  function formatINR(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // ── openRazorpay ──────────────────────────────────────────
  /**
   * Open the Razorpay payment modal.
   *
   * @param {Object} options
   * @param {number}   options.amount          - Amount in INR (e.g. 42000)
   * @param {string}   options.bookingRef      - Internal booking reference (shown in description)
   * @param {string}   options.packageName     - Package name for description
   * @param {string}   [options.prefillName]   - Pre-fill name from Clerk
   * @param {string}   [options.prefillEmail]  - Pre-fill email from Clerk
   * @param {string}   [options.prefillPhone]  - Pre-fill phone (optional)
   * @param {Function} options.onSuccess       - Called with Razorpay response on payment success
   * @param {Function} [options.onDismiss]     - Called if user closes modal without paying
   */
  function openRazorpay(options) {
    if (!window.Razorpay) {
      console.error('[AshtaPayment] Razorpay SDK not loaded.');
      alert('Payment service is loading. Please try again in a moment.');
      return;
    }

    const {
      amount,
      bookingRef    = 'ASHTA-' + Date.now(),
      packageName   = 'Travel Package',
      prefillName   = '',
      prefillEmail  = '',
      prefillPhone  = '',
      onSuccess,
      onDismiss,
    } = options;

    const rzpOptions = {
      key:         RZP_KEY_ID,
      amount:      getAmountPaise(amount),
      currency:    'INR',
      name:        COMPANY_NAME,
      description: `${packageName} — ${bookingRef}`,
      image:       COMPANY_LOGO,

      // NOTE: order_id should come from a server call in production.
      // Omitting it here for client-only test mode.

      prefill: {
        name:    prefillName,
        email:   prefillEmail,
        contact: prefillPhone,
      },

      notes: {
        booking_ref:  bookingRef,
        package_name: packageName,
        platform:     'Ashtadisha Web',
      },

      theme: {
        color: BRAND_COLOR,
      },

      modal: {
        confirm_close: true,
        ondismiss: function () {
          console.log('[AshtaPayment] Modal dismissed by user.');
          if (typeof onDismiss === 'function') onDismiss();
        },
      },

      // Payment method config — accept all common Indian methods
      config: {
        display: {
          blocks: {
            utib: { name: 'UPI & Wallets', instruments: [
              { method: 'upi' },
              { method: 'wallet' },
            ]},
            other: { name: 'Cards & Net Banking', instruments: [
              { method: 'card' },
              { method: 'netbanking' },
              { method: 'emi' },
            ]},
          },
          sequence: ['block.utib', 'block.other'],
          preferences: { show_default_blocks: false },
        },
      },

      handler: function (response) {
        // Payment successful
        console.log('[AshtaPayment] Payment success:', response);
        const paymentData = {
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id:   response.razorpay_order_id || null,
          razorpay_signature:  response.razorpay_signature || null,
        };
        if (typeof onSuccess === 'function') {
          onSuccess(paymentData);
        }
      },
    };

    const rzp = new window.Razorpay(rzpOptions);

    // Handle payment failed event
    rzp.on('payment.failed', function (resp) {
      console.error('[AshtaPayment] Payment failed:', resp.error);
      // Show a user-friendly error (could be enhanced with a toast)
      alert(`Payment failed: ${resp.error.description || 'Please try again.'}`);
      if (typeof onDismiss === 'function') onDismiss();
    });

    rzp.open();
  }

  // ── Expose Public API ─────────────────────────────────────
  window.AshtaPayment = {
    openRazorpay,
    getAmountPaise,
    formatINR,
  };

})();
