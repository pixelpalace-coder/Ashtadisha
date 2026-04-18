(function () {
  'use strict';

  var GST_RATE = 0.05;
  var PACKAGES = {};

  function mergePredefinedCatalog() {
    if (!window.AshtaPredefinedPackages || !Array.isArray(window.AshtaPredefinedPackages)) return;
    window.AshtaPredefinedPackages.forEach(function (p) {
      if (!p || !p.id) return;
      PACKAGES[p.id] = {
        id: p.id,
        name: p.title,
        title: p.title,
        destination: p.destination || 'Northeast India',
        duration: p.duration,
        pricePerPerson: Number(p.price) || 0,
        image: p.image,
        description: p.description || '',
        source: 'PREDEFINED'
      };
    });
  }

  async function initPackages() {
    try {
      if (window.AshtaFirebase && typeof window.AshtaFirebase.getPackages === 'function') {
        var fetched = await window.AshtaFirebase.getPackages();
        if (fetched && Object.keys(fetched).length > 0) {
          PACKAGES = fetched;
          mergePredefinedCatalog();
          return;
        }
      }
    } catch (e) {
      console.warn('[AshtaCheckout] Fetch failed, using fallbacks.', e);
    }

    PACKAGES = {
      complete: { id: 'complete', name: 'The Complete 7 Sisters', destination: 'All 7 States', duration: '14 Days', pricePerPerson: 85000, image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=400&q=75', source: 'PREDEFINED' },
      assam_megh: { id: 'assam_megh', name: 'Assam + Meghalaya', destination: 'Assam & Meghalaya', duration: '7 Days', pricePerPerson: 42000, image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=400&q=75', source: 'PREDEFINED' }
    };
    mergePredefinedCatalog();
  }

  var currentPkg = null;
  var travelers = 2;
  var travelMonth = '';
  var travelDate = '';
  var specialReqs = '';
  var guestName = '';
  var guestEmail = '';
  var guestPhone = '';
  var currentStep = 1;
  var subtotalAmount = 0;
  var gstAmount = 0;
  var totalWithGst = 0;
  var eventsBound = false;

  var el = function (id) { return document.getElementById(id); };
  var qAll = function (sel) { return document.querySelectorAll(sel); };

  function normalizePkg(raw) {
    if (window.AshtaBookingPackage && typeof window.AshtaBookingPackage.normalize === 'function') {
      return window.AshtaBookingPackage.normalize(raw);
    }
    return null;
  }

  function buildStoredItinerary() {
    if (!window.AshtaBookingPackage || !window.AshtaBookingPackage.buildStoredItinerary) {
      return (currentPkg && currentPkg.itineraryText) || '';
    }
    var meta = {
      v: 1,
      source: currentPkg.source === 'AI' ? 'AI' : 'PREDEFINED',
      guestName: guestName,
      guestEmail: guestEmail,
      guestPhone: guestPhone,
      status: 'CONFIRMED',
      travelers: travelers,
      travelWindow: currentPkg.source === 'AI' ? travelDate : travelMonth,
      specialReqs: specialReqs
    };
    var html = (currentPkg.itineraryText || '').trim();
    return window.AshtaBookingPackage.buildStoredItinerary(meta, html);
  }

  function isAI() {
    return currentPkg && currentPkg.source === 'AI';
  }

  async function open(data) {
    await initPackages();

    if (!window.AshtaBookingPackage || typeof window.AshtaBookingPackage.normalize !== 'function') {
      alert('Booking module failed to load. Please refresh the page.');
      return;
    }

    if (!el('checkoutOverlay')) {
      bindEvents();
    }
    if (!el('checkoutOverlay')) {
      alert('Checkout is still loading. Please try again in a moment.');
      return;
    }

    var isSignedIn = window.AshtaAuth
      ? window.AshtaAuth.isSignedIn()
      : !!(window.firebase && firebase.auth && firebase.auth().currentUser);

    if (!isSignedIn) {
      window._pendingCheckoutData = data;
      window.AshtaAuth && window.AshtaAuth.openAuthModal('signin');
      if (!window.AshtaAuth) {
        alert('Please sign in from the home page to continue booking.');
      }
      return;
    }

    var raw = data;
    if (typeof data === 'string') {
      var fromStore = PACKAGES[data];
      raw = fromStore
        ? Object.assign({}, fromStore, { source: 'PREDEFINED', packageId: data })
        : { name: 'Northeast Journey', destination: 'Northeast India', duration: '7 Days', pricePerPerson: 25000, source: 'PREDEFINED', packageId: data };
    }

    currentPkg = normalizePkg(raw);
    if (!currentPkg) {
      alert('Could not load this package. Ensure booking-package.js is loaded.');
      return;
    }

    if (currentPkg.travelers != null) {
      travelers = Math.max(1, Number(currentPkg.travelers));
    } else {
      travelers = 2;
    }

    travelMonth = '';
    travelDate = currentPkg.travelDate || '';
    specialReqs = '';
    guestName = '';
    guestEmail = '';
    guestPhone = '';

    var user = firebase.auth && firebase.auth().currentUser;
    if (user) {
      guestEmail = user.email || '';
      guestName = user.displayName || '';
    }

    if (!isAI() && travelDate) {
      var parsed = new Date(travelDate);
      if (!Number.isNaN(parsed.getTime())) {
        travelMonth = parsed.toLocaleString('en-US', { month: 'long' });
      }
    }

    el('coModalTitle').textContent = isAI() ? 'Book your AI itinerary' : 'Book your journey';
    el('coMonthGroup').classList.toggle('hidden', isAI());
    el('coDateGroup').classList.toggle('hidden', !isAI());

    var pill = el('coSourcePill');
    if (pill) {
      pill.textContent = isAI() ? 'AI plan' : 'PREDEFINED';
      pill.classList.toggle('hidden', false);
    }

    if (el('coTravelMonth')) el('coTravelMonth').value = '';
    if (el('coTravelDate')) el('coTravelDate').value = travelDate || '';
    if (el('coGuestName')) el('coGuestName').value = guestName;
    if (el('coGuestEmail')) el('coGuestEmail').value = guestEmail;
    if (el('coGuestPhone')) el('coGuestPhone').value = guestPhone;

    populateStep1();
    goToStep(1);
    el('checkoutOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    el('checkoutOverlay') && el('checkoutOverlay').classList.remove('active');
    document.body.style.overflow = '';
  }

  function computeTotals() {
    var base = (currentPkg.pricePerPerson || 0) * travelers;
    var gst = Math.round(base * GST_RATE);
    var total = base + gst;
    subtotalAmount = base;
    gstAmount = gst;
    totalWithGst = total;
  }

  function populateStep1() {
    computeTotals();
    el('coPkgName').textContent = currentPkg.name;
    el('coPkgDuration').textContent = currentPkg.duration + ' · ' + (currentPkg.destination || 'Northeast');
    el('coPkgPrice').textContent = formatINR(currentPkg.pricePerPerson);
    el('coPkgImg').src = currentPkg.image || '';
    el('coTravelerCount').textContent = String(travelers);

    el('coBreakPerPerson').textContent = formatINR(currentPkg.pricePerPerson);
    el('coBreakTravelers').textContent = '× ' + travelers;
    el('coBreakSubtotal').textContent = formatINR(subtotalAmount);
    el('coBreakGst').textContent = formatINR(gstAmount);
    el('coTotalAmount').textContent = formatINR(totalWithGst);
  }

  function updateTotal() {
    populateStep1();
  }

  function goToStep(n) {
    currentStep = n;
    qAll('.co-panel').forEach(function (p) {
      p.classList.toggle('active', parseInt(p.dataset.step, 10) === n);
    });
    qAll('.co-step').forEach(function (s) {
      var sNum = parseInt(s.dataset.step, 10);
      s.classList.toggle('active', sNum === n);
      s.classList.toggle('completed', sNum < n);
    });
    if (n === 2) populateStep2();
  }

  function readGuestFromForm() {
    guestName = (el('coGuestName') && el('coGuestName').value) ? el('coGuestName').value.trim() : '';
    guestEmail = (el('coGuestEmail') && el('coGuestEmail').value) ? el('coGuestEmail').value.trim() : '';
    guestPhone = (el('coGuestPhone') && el('coGuestPhone').value) ? el('coGuestPhone').value.trim() : '';
  }

  function populateStep2() {
    readGuestFromForm();
    computeTotals();
    el('coRecapSource').textContent = currentPkg.source === 'AI' ? 'AI-generated plan' : 'PREDEFINED package';
    el('coRecapPkg').textContent = currentPkg.name;
    el('coRecapDest').textContent = currentPkg.destination || 'Northeast';
    el('coRecapGuest').textContent = guestName + ' · ' + guestEmail;
    el('coRecapTravelers').textContent = String(travelers);
    el('coRecapMonth').textContent = isAI() ? (travelDate || '—') : (travelMonth || 'TBD');
    el('coRecapSub').textContent = formatINR(subtotalAmount);
    el('coRecapGst').textContent = formatINR(gstAmount);
    el('coRecapTotal').textContent = formatINR(totalWithGst);
    el('coPayBtn').textContent = 'Proceed to payment (demo) — ' + formatINR(totalWithGst);
  }

  function downloadConfirmation() {
    var pkgName = el('coPkgName') && el('coPkgName').textContent ? el('coPkgName').textContent : 'Ashtadisha Journey';
    var ref = el('coBookingId') && el('coBookingId').textContent ? el('coBookingId').textContent : 'Booking ref';
    var when = el('coRecapMonth') && el('coRecapMonth').textContent ? el('coRecapMonth').textContent : 'TBD';
    var total = el('coRecapTotal') && el('coRecapTotal').textContent ? el('coRecapTotal').textContent : 'N/A';
    var text = [
      'ASHTADISHA BOOKING CONFIRMATION',
      '--------------------------------',
      ref,
      'Source: ' + (currentPkg.source === 'AI' ? 'AI' : 'PREDEFINED'),
      'Guest: ' + guestName + ' | ' + guestEmail + ' | ' + guestPhone,
      'Package: ' + pkgName,
      'Travel: ' + when,
      'Total (incl. GST): ' + total,
      'Status: CONFIRMED',
      '',
      'Thank you for booking with Ashtadisha.'
    ].join('\n');

    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'Ashtadisha_Booking_Confirmation.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  function populateCheckmark() {
    var container = el('coCheckAnimContainer');
    if (container) {
      container.innerHTML =
        '<svg class="co-check-circle" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
        '<circle class="check-circle-bg" cx="50" cy="50" r="44"/>' +
        '<circle class="check-circle-ring" cx="50" cy="50" r="44" transform="rotate(-90 50 50)"/>' +
        '<polyline class="check-mark" points="28,52 42,65 72,36"/>' +
        '</svg>';
    }
  }

  function formatINR(amt) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);
  }

  function finalizeBooking(paymentId) {
    computeTotals();
    var itineraryPayload = buildStoredItinerary();

    var fbUser = firebase.auth && firebase.auth().currentUser;
    var bookingData = {
      userId: fbUser && fbUser.uid,
      packageName: currentPkg.name,
      destination: currentPkg.destination,
      travelers: travelers,
      travelDate: isAI() ? travelDate : travelMonth,
      totalAmount: totalWithGst,
      paymentId: paymentId,
      itineraryText: itineraryPayload,
      status: 'CONFIRMED',
      bookingSource: currentPkg.source === 'AI' ? 'AI' : 'PREDEFINED'
    };

    return window.AshtaFirebase && window.AshtaFirebase.createBooking
      ? window.AshtaFirebase.createBooking(bookingData)
      : Promise.resolve(null);
  }

  async function handlePayment() {
    var btn = el('coPayBtn');
    var originalText = btn.textContent;
    var fbUser = firebase.auth && firebase.auth().currentUser;
    if (!fbUser || !fbUser.uid) {
      alert('Please sign in again to complete your booking.');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Processing…';

    await new Promise(function (resolve) {
      setTimeout(resolve, 800);
    });

    var paymentId = 'MOCK-' + Date.now().toString(36).toUpperCase();

    try {
      var dbId = await finalizeBooking(paymentId);
      var suffix = dbId != null ? String(dbId).slice(-6) : Date.now().toString().slice(-6);
      el('coBookingId').textContent = 'Booking ref: ASHTA-' + suffix;
      if (el('coConfirmStatus')) el('coConfirmStatus').textContent = 'CONFIRMED';
      goToStep(3);
      populateCheckmark();
    } catch (err) {
      console.error('[AshtaCheckout]', err);
      alert('Could not save your booking. Please try again.');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }

  function bindEvents() {
    if (eventsBound || !el('checkoutOverlay')) return;
    eventsBound = true;

    el('checkoutClose') && el('checkoutClose').addEventListener('click', close);
    el('checkoutOverlay') && el('checkoutOverlay').addEventListener('click', function (e) {
      if (e.target === el('checkoutOverlay')) close();
    });

    el('coTravelerMinus') && el('coTravelerMinus').addEventListener('click', function () {
      if (travelers > 1) {
        travelers--;
        populateStep1();
      }
    });
    el('coTravelerPlus') && el('coTravelerPlus').addEventListener('click', function () {
      if (travelers < 20) {
        travelers++;
        populateStep1();
      }
    });

    el('coTravelMonth') && el('coTravelMonth').addEventListener('change', function (e) {
      travelMonth = e.target.value;
    });
    el('coTravelDate') && el('coTravelDate').addEventListener('change', function (e) {
      travelDate = e.target.value;
    });
    el('coSpecialReqs') && el('coSpecialReqs').addEventListener('input', function (e) {
      specialReqs = e.target.value;
    });

    el('coNext1') && el('coNext1').addEventListener('click', function () {
      readGuestFromForm();
      if (isAI() && !travelDate) {
        alert('Please select a travel date before continuing.');
        return;
      }
      if (!isAI() && !travelMonth) {
        alert('Please select your preferred travel month.');
        return;
      }
      if (!guestName || !guestEmail || !guestPhone) {
        alert('Please enter your name, email, and phone number.');
        return;
      }
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail);
      if (!emailOk) {
        alert('Please enter a valid email address.');
        return;
      }
      goToStep(2);
    });

    el('coBack2') && el('coBack2').addEventListener('click', function () {
      goToStep(1);
    });
    el('coPayBtn') && el('coPayBtn').addEventListener('click', handlePayment);

    el('coViewTripsBtn') && el('coViewTripsBtn').addEventListener('click', function () {
      close();
      window.location.href = '/dashboard.html';
    });
    el('coDownloadBtn') && el('coDownloadBtn').addEventListener('click', downloadConfirmation);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && el('checkoutOverlay') && el('checkoutOverlay').classList.contains('active')) {
        close();
      }
    });

    document.querySelectorAll('[data-checkout-pkg]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        open(btn.dataset.checkoutPkg);
      });
    });
  }

  window.AshtaCheckout = { open: open, close: close };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindEvents);
  } else {
    bindEvents();
  }
})();
