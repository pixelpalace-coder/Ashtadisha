/**
 * AshtaBookingPackage — unified shape for AI plans and predefined packages.
 * Used by checkout, planner, booking page, and dashboard (stripMeta / parseMeta).
 */
(function () {
  'use strict';

  var META_START = '<!--ASHTA_META:';
  var META_END = '-->';

  function uid(prefix) {
    var p = prefix || 'pkg';
    return p + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
  }

  function estimateAIPrice(days, budgetKey) {
    var d = Math.max(3, Math.min(30, Number(days) || 7));
    var budgetMap = { Budget: 2500, 'Mid-Range': 8500, Luxury: 30000 };
    var rate = budgetMap[budgetKey] || budgetMap['Mid-Range'];
    return Math.round(rate * d);
  }

  /**
   * Normalize any checkout payload to a single internal shape.
   * Accepts legacy fields: name, itineraryText, price.
   */
  function normalize(raw) {
    if (raw == null || typeof raw !== 'object') return null;

    var source = raw.source === 'AI' ? 'AI' : 'PREDEFINED';
    var id = raw.id || raw.packageId || uid(source === 'AI' ? 'ai' : 'pkg');
    var title = raw.title || raw.name || 'Northeast Journey';
    var pricePerPerson = Number(raw.pricePerPerson != null ? raw.pricePerPerson : (raw.price != null ? raw.price : 0));
    if (!Number.isFinite(pricePerPerson) || pricePerPerson < 0) pricePerPerson = 0;

    var duration = raw.duration || '7 Days';
    var destination = raw.destination || 'Northeast India';
    var image = raw.image || '';

    var itineraryText = '';
    if (typeof raw.itineraryText === 'string') itineraryText = raw.itineraryText;
    else if (typeof raw.itinerary === 'string') itineraryText = raw.itinerary;

    return {
      id: id,
      title: title,
      name: title,
      pricePerPerson: pricePerPerson,
      duration: duration,
      destination: destination,
      image: image,
      source: source,
      itineraryText: itineraryText,
      packageId: raw.packageId || raw.id || null,
      travelers: raw.travelers != null ? Math.max(1, Number(raw.travelers)) : undefined,
      travelDate: raw.travelDate || ''
    };
  }

  function buildStoredItinerary(meta, html) {
    var comment = META_START + JSON.stringify(meta) + META_END;
    var body = (html || '').trim();
    return body ? comment + '\n' + body : comment;
  }

  function parseMeta(itineraryText) {
    if (!itineraryText || typeof itineraryText !== 'string') return {};
    var m = itineraryText.match(/^<!--ASHTA_META:([\s\S]*?)-->/);
    if (!m) return {};
    try {
      return JSON.parse(m[1]);
    } catch (e) {
      return {};
    }
  }

  function stripMeta(itineraryText) {
    if (!itineraryText || typeof itineraryText !== 'string') return '';
    return itineraryText.replace(/^<!--ASHTA_META:[\s\S]*?-->\s*/, '').trim();
  }

  function displaySource(booking) {
    if (!booking || typeof booking !== 'object') return 'PREDEFINED';
    var bs = booking.bookingSource;
    if (bs === 'AI') return 'AI';
    if (bs === 'PREDEFINED' || bs === 'Predefined') return 'PREDEFINED';
    var meta = parseMeta(booking.itineraryText || '');
    if (meta.source === 'AI') return 'AI';
    if (meta.source === 'PREDEFINED' || meta.source === 'Predefined') return 'PREDEFINED';
    return 'PREDEFINED';
  }

  window.AshtaBookingPackage = {
    uid: uid,
    estimateAIPrice: estimateAIPrice,
    normalize: normalize,
    buildStoredItinerary: buildStoredItinerary,
    parseMeta: parseMeta,
    stripMeta: stripMeta,
    displaySource: displaySource
  };
})();
