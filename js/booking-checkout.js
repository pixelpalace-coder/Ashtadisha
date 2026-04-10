/* ============================================================
   ASHTADISHA — Booking Checkout Modal Logic
   js/booking-checkout.js

   Manages the 3-step checkout modal:
   Step 1 → Trip summary + travelers + month
   Step 2 → Order recap + Razorpay trigger
   Step 3 → Confirmation + receipt download
   ============================================================ */

(function () {
  'use strict';

  // ── Package Data ─────────────────────────────────────────
  const PACKAGES = {
    complete: {
      name:        'The Complete 7 Sisters',
      destination: 'All 7 Northeast States',
      duration:    '14 Days · 13 Nights',
      pricePerPerson: 85000,
      image:       'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=80&q=70',
    },
    assam_megh: {
      name:        'Assam + Meghalaya',
      destination: 'Assam & Meghalaya',
      duration:    '7 Days · 6 Nights',
      pricePerPerson: 42000,
      image:       'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=80&q=70',
    },
    arunachal: {
      name:        'Arunachal Monastery Trek',
      destination: 'Arunachal Pradesh',
      duration:    '9 Days · 8 Nights',
      pricePerPerson: 55000,
      image:       'https://images.unsplash.com/photo-1543158181-e6f9f6712055?auto=format&fit=crop&w=80&q=70',
    },
    hornbill: {
      name:        'Hornbill Festival Special',
      destination: 'Nagaland',
      duration:    '5 Days · 4 Nights',
      pricePerPerson: 38000,
      image:       'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=80&q=70',
    },
    wildlife: {
      name:        'Wildlife & Safari Circuit',
      destination: 'Assam, Arunachal Pradesh',
      duration:    '10 Days · 9 Nights',
      pricePerPerson: 62000,
      image:       'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=80&q=70',
    },
  };

  // ── State ─────────────────────────────────────────────────
  let currentPkg   = null;
  let travelers    = 2;
  let travelMonth  = '';
  let specialReqs  = '';
  let currentStep  = 1;
  let lastBookingId = null;
  let lastPaymentId = null;

  // ── DOM ───────────────────────────────────────────────────
  const overlay      = () => document.getElementById('checkoutOverlay');
  const modal        = () => document.getElementById('checkoutModal');
  const stepPanels   = () => document.querySelectorAll('.co-panel');
  const stepDots     = () => document.querySelectorAll('.co-step');

  // ── Open Modal ────────────────────────────────────────────
  function open(packageKeyOrData) {
    // Auth gate — require sign-in
    if (!window.AshtaAuth?.isSignedIn()) {
      window._pendingCheckoutData = packageKeyOrData;
      window.AshtaAuth?.openAuthModal('signin');
      return;
    }

    // Resolve package data
    if (typeof packageKeyOrData === 'string') {
      currentPkg = PACKAGES[packageKeyOrData] || PACKAGES.complete;
    } else if (typeof packageKeyOrData === 'object') {
      currentPkg = packageKeyOrData;
    } else {
      currentPkg = PACKAGES.complete;
    }

    // Reset state
    travelers   = 2;
    travelMonth = '';
    specialReqs = '';

    populateStep1();
    goToStep(1);

    overlay()?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  // ── Close Modal ───────────────────────────────────────────
  function close() {
    overlay()?.classList.remove('active');
    document.body.style.overflow = '';
  }

  // ── Populate Step 1 ───────────────────────────────────────
  function populateStep1() {
    const pkg = currentPkg;

    // Package summary card
    setEl('coPkgName',     pkg.name);
    setEl('coPkgDuration', pkg.duration + ' · ' + pkg.destination);
    setEl('coPkgPrice',    formatINR(pkg.pricePerPerson));

    const imgEl = document.getElementById('coPkgImg');
    if (imgEl) {
      imgEl.src = pkg.image;
      imgEl.alt = pkg.name;
    }

    // Stepper value
    updateStepperDisplay();

    // Calculate total
    updateTotal();
  }

  // ── Stepper ───────────────────────────────────────────────
  function updateStepperDisplay() {
    setEl('coTravelerCount', travelers);
    updateTotal();
  }

  function updateTotal() {
    const total = (currentPkg?.pricePerPerson || 0) * travelers;
    setEl('coTotalAmount',   formatINR(total));
    setEl('coTotalAmountS2', formatINR(total)); // Step 2 display
  }

  // ── Format INR ────────────────────────────────────────────
  function formatINR(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(amount);
  }

  // ── Step Navigation ───────────────────────────────────────
  function goToStep(n) {
    currentStep = n;

    stepPanels().forEach(panel => {
      const panelStep = parseInt(panel.dataset.step);
      panel.classList.toggle('active', panelStep === n);
    });

    stepDots().forEach(dot => {
      const dotStep = parseInt(dot.dataset.step);
      dot.classList.remove('active', 'completed');
      if (dotStep === n) dot.classList.add('active');
      else if (dotStep < n) dot.classList.add('completed');
    });

    if (n === 2) populateStep2();
  }

  // ── Populate Step 2 ───────────────────────────────────────
  function populateStep2() {
    const pkg   = currentPkg;
    const total = (pkg?.pricePerPerson || 0) * travelers;

    setEl('coRecapPkg',       pkg.name);
    setEl('coRecapDest',      pkg.destination);
    setEl('coRecapTravelers', `${travelers} traveler${travelers !== 1 ? 's' : ''}`);
    setEl('coRecapMonth',     travelMonth || 'Flexible');
    setEl('coRecapTotal',     formatINR(total));

    const payBtn = document.getElementById('coPayBtn');
    if (payBtn) payBtn.textContent = `Pay ${formatINR(total)}`;
  }

  // ── Trigger Razorpay ──────────────────────────────────────
  function triggerPayment() {
    const user  = window.AshtaAuth?.getUser();
    const pkg   = currentPkg;
    const total = (pkg?.pricePerPerson || 0) * travelers;
    const ref   = 'ASHTA-' + Date.now().toString(36).toUpperCase();

    if (!window.AshtaPayment) {
      console.error('[AshtaCheckout] AshtaPayment not loaded.');
      return;
    }

    window.AshtaPayment.openRazorpay({
      amount:       total,
      bookingRef:   ref,
      packageName:  pkg.name,
      prefillName:  user?.displayName || '',
      prefillEmail: user?.email || '',

      onSuccess: async (rzpResponse) => {
        lastPaymentId = rzpResponse.razorpay_payment_id;

        // Save booking to Firebase
        const bookingData = {
          userId:       user?.uid || 'anonymous',
          packageName:  pkg.name,
          destination:  pkg.destination,
          travelers,
          travelDate:   travelMonth || 'TBD',
          totalAmount:  total,
          paymentId:    lastPaymentId,
          bookingRef:   ref,
          specialReqs,
          status:       'confirmed',
        };

        const docId = await window.AshtaFirebase?.createBooking(bookingData);
        lastBookingId = ref; // use ref as display ID

        // Show confirmation step
        goToStep(3);
        populateStep3(ref);
      },

      onDismiss: () => {
        // User closed Razorpay — stay on step 2
        console.log('[AshtaCheckout] Payment dismissed, staying on step 2.');
      },
    });
  }

  // ── Populate Step 3 (Confirmation) ────────────────────────
  function populateStep3(bookingRef) {
    setEl('coBookingId', 'Booking Ref: ' + bookingRef);
    // Trigger CSS checkmark animation by re-inserting SVG
    const checkEl = document.getElementById('coCheckAnimContainer');
    if (checkEl) {
      checkEl.innerHTML = `
        <svg class="co-check-circle" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle class="check-circle-bg"  cx="50" cy="50" r="44"/>
          <circle class="check-circle-ring" cx="50" cy="50" r="44" transform="rotate(-90 50 50)"/>
          <polyline class="check-mark" points="28,52 42,65 72,36"/>
        </svg>`;
    }
  }

  // ── Download Receipt ──────────────────────────────────────
  function downloadReceipt() {
    if (!currentPkg || !lastBookingId) return;

    const user  = window.AshtaAuth?.getUser();
    const total = (currentPkg.pricePerPerson || 0) * travelers;
    const date  = new Date().toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Ashtadisha Booking Confirmation</title>
<style>
  body { font-family: Georgia, serif; max-width: 720px; margin: 40px auto; color: #1E1E1E; padding: 20px; }
  h1 { color: #1A3C2E; letter-spacing: 3px; font-size: 28px; }
  .accent { color: #C8842A; }
  table { width: 100%; border-collapse: collapse; margin: 24px 0; }
  td { padding: 10px 14px; border-bottom: 1px solid #EDE8E0; font-size: 14px; }
  td:first-child { color: #6B5F52; width: 40%; }
  .total-row td { font-weight: 700; font-size: 16px; color: #1A3C2E; border-top: 2px solid #1A3C2E; }
  .footer { margin-top: 40px; font-size: 12px; color: #6B5F52; border-top: 1px solid #EDE8E0; padding-top: 16px; }
  .ref { background: #F7F3EE; border: 1px solid #EDE8E0; padding: 12px 20px; font-size: 18px; font-style: italic; display: inline-block; margin: 12px 0; }
</style>
</head>
<body>
  <h1>ASHTADISHA</h1>
  <p style="color:#6B5F52;margin-top:-8px;">Gateway to the Seven Sisters</p>
  <h2 style="color:#1A3C2E;margin-top:24px;">Booking Confirmation</h2>
  <div class="ref">${lastBookingId}</div>
  <table>
    <tr><td>Guest Name</td><td>${user?.fullName || '—'}</td></tr>
    <tr><td>Email</td><td>${user?.primaryEmailAddress?.emailAddress || '—'}</td></tr>
    <tr><td>Package</td><td>${currentPkg.name}</td></tr>
    <tr><td>Destination</td><td>${currentPkg.destination}</td></tr>
    <tr><td>Duration</td><td>${currentPkg.duration}</td></tr>
    <tr><td>Travelers</td><td>${travelers}</td></tr>
    <tr><td>Travel Month</td><td>${travelMonth || 'Flexible / TBD'}</td></tr>
    <tr><td>Payment ID</td><td>${lastPaymentId || 'TEST-MODE'}</td></tr>
    <tr><td>Booking Date</td><td>${date}</td></tr>
    <tr class="total-row"><td>Amount Paid</td><td class="accent">${formatINR(total)}</td></tr>
  </table>
  <p>Our team will contact you within 24 hours to finalise your itinerary.</p>
  <div class="footer">
    Ashtadisha Tourism · contact@ashtadisha.in · +91-11-XXXX-XXXX<br>
    GSTIN: XXXXXXXXXXXXXXXXX · All bookings subject to terms and conditions.
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `Ashtadisha-Booking-${lastBookingId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);

    // Also upload to Firebase Storage (best-effort)
    if (window.AshtaFirebase?.uploadReceiptBlob && lastBookingId) {
      window.AshtaFirebase.uploadReceiptBlob(blob, lastBookingId);
    }
  }

  // ── Utility ───────────────────────────────────────────────
  function setEl(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  // ── Bind All Modal Events ─────────────────────────────────
  function bindEvents() {
    // Close
    document.getElementById('checkoutClose')?.addEventListener('click', close);
    overlay()?.addEventListener('click', (e) => {
      if (e.target === overlay()) close();
    });

    // Stepper
    document.getElementById('coTravelerMinus')?.addEventListener('click', () => {
      if (travelers > 1) { travelers--; updateStepperDisplay(); }
    });
    document.getElementById('coTravelerPlus')?.addEventListener('click', () => {
      if (travelers < 20) { travelers++; updateStepperDisplay(); }
    });

    // Month picker
    document.getElementById('coTravelMonth')?.addEventListener('change', (e) => {
      travelMonth = e.target.value;
    });

    // Special requests
    document.getElementById('coSpecialReqs')?.addEventListener('input', (e) => {
      specialReqs = e.target.value;
    });

    // Step navigation
    document.getElementById('coNext1')?.addEventListener('click', () => goToStep(2));
    document.getElementById('coBack2')?.addEventListener('click', () => goToStep(1));

    // Pay button
    document.getElementById('coPayBtn')?.addEventListener('click', triggerPayment);

    // Step 3 actions
    document.getElementById('coViewTripsBtn')?.addEventListener('click', () => {
      close();
      window.location.href = 'dashboard.html';
    });
    document.getElementById('coDownloadBtn')?.addEventListener('click', downloadReceipt);

    // Keyboard: Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay()?.classList.contains('active')) close();
    });

    // "Book Now" buttons on package cards in existing booking section
    document.querySelectorAll('[data-checkout-pkg]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.checkoutPkg;
        open(key);
      });
    });
  }

  // ── Expose Public API ─────────────────────────────────────
  window.AshtaCheckout = { open, close };

  // ── Init ─────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindEvents);
  } else {
    bindEvents();
  }

})();
