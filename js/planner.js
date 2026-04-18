/* =============================================================
   ASHTADISHA — AI Planner Engine
   Generates rich, dynamic, state-aware itineraries
   ============================================================= */

export function initPlanner() {
  /* ── Pill Selection Setup ─────────────────────────────── */
  const singleSelectGroups = ['#styleSelect', '#groupSelect', '#dietSelect', '#budgetSelect'];
  const multiSelectGroups  = ['#stateSelect', '#interestSelect'];

  singleSelectGroups.forEach(sel => {
    const wrap = document.querySelector(sel);
    if (!wrap) return;
    wrap.querySelectorAll('.pill').forEach(pill => {
      pill.addEventListener('click', () => {
        wrap.querySelectorAll('.pill').forEach(p => p.classList.remove('selected'));
        pill.classList.add('selected');
      });
    });
  });

  multiSelectGroups.forEach(sel => {
    const wrap = document.querySelector(sel);
    if (!wrap) return;
    wrap.querySelectorAll('.pill').forEach(pill => {
      pill.addEventListener('click', () => pill.classList.toggle('selected'));
    });
  });

  /* ── Slider ───────────────────────────────────────────── */
  const daysSlider = document.getElementById('daysSlider');
  const daysVal    = document.getElementById('daysVal');
  if (daysSlider && daysVal) {
    daysSlider.addEventListener('input', () => {
      daysVal.textContent = daysSlider.value;
      // Update fill gradient
      const pct = ((daysSlider.value - 3) / (30 - 3)) * 100;
      daysSlider.style.background =
        `linear-gradient(to right, var(--color-accent) ${pct}%, var(--color-border) ${pct}%)`;
    });
    // Init fill
    daysSlider.dispatchEvent(new Event('input'));
  }

  /* ── Buttons ─────────────────────────────────────────── */
  document.getElementById('generateBtn')?.addEventListener('click', generateItinerary);
  document.getElementById('regenBtn')?.addEventListener('click', generateItinerary);

  /* ── Helpers ─────────────────────────────────────────── */
  const getSelected = (sel) => {
    const wrap = document.querySelector(sel);
    if (!wrap) return [];
    return Array.from(wrap.querySelectorAll('.pill.selected')).map(p => p.dataset.val);
  };

  /* ── Authentic State Data ────────────────────────────── */
  const STATE_DATA = {
    'Assam': {
      hi: 'असम',
      emoji: '🌿',
      gateway: 'Guwahati (Lokpriya Gopinath Bordoloi Airport)',
      highlights: ['Kaziranga National Park', 'Kamakhya Temple', 'Brahmaputra River Cruise', 'Majuli (world\'s largest river island)'],
      stay: ['Wild Grass Resort, Kaziranga', 'Iora — The Retreat, Kaziranga', 'Vivanta Guwahati'],
      eat: ['Masor Tenga (sour fish curry)', 'Khar (alkaline dish)', 'Duck Curry with black sesame', 'Pitha (rice cakes)'],
      tips: 'Book Kaziranga jeep safaris 3 days in advance. Best zone: Eastern.',
      localWord: 'মই অসমৰ পৰা আহিছো — "I am from Assam"',
    },
    'Meghalaya': {
      hi: 'मेघालय',
      emoji: '🌧',
      gateway: 'Shillong (± 100km from Guwahati)',
      highlights: ['Living Root Bridge, Nongriat', 'Dawki (Umngot River)', 'Nohkalikai Falls (340m)', 'Mawlynnong — Asia\'s cleanest village'],
      stay: ['Ri Kynjai Serenity by the Lake', 'Hotel Polo Towers Shillong', 'Cherrapunji Holiday Resort'],
      eat: ['Jadoh (rice + pork)', 'Dohneiiong (black sesame pork)', 'Tungrymbai (fermented soybean)', 'Pukhlein (sweet rice cake)'],
      tips: 'Root Bridge trek takes 3+ hours. Start before 7am. Carry cash — ATMs limited in Sohra.',
      localWord: 'Khublei (ख़ुब्ले) — "Thank you" in Khasi',
    },
    'Arunachal Pradesh': {
      hi: 'अरुणाचल प्रदेश',
      emoji: '❄️',
      gateway: 'Dibrugarh (Assam) or Itanagar',
      highlights: ['Tawang Monastery (3,500m)', 'Sela Pass (4,170m)', 'Ziro Valley (UNESCO Tentative)', 'Mechuka Valley'],
      stay: ['Hotel Tawang Retreat', 'Pemaling Retreat, Tawang', 'Donyi-Polo Eco Camp, Ziro'],
      eat: ['Thukpa (Tibetan noodle soup)', 'Zan (maize porridge)', 'Pika Pila (bamboo shoot pickle)', 'Ngatok (fish curry)'],
      tips: 'Inner Line Permit (ILP) is mandatory. Apply online at arunachalilp.com. Takes 24hrs.',
      localWord: 'Namo Buddha — greeting used by Monpa tribe of Tawang',
    },
    'Nagaland': {
      hi: 'नागालैंड',
      emoji: '🥁',
      gateway: 'Dimapur (Dimapur Airport)',
      highlights: ['Hornbill Festival (Dec 1–10)', 'Kohima War Cemetery', 'Dzükou Valley trek', 'Kisama Heritage Village'],
      stay: ['Hotel Saramati, Kohima', 'Wild Nest Resort, Kohima', 'Legacy Lounge, Dimapur'],
      eat: ['Smoked Pork with Bamboo Shoot', 'Axone (fermented soybean chutney)', 'Galho (rice porridge)', 'Akhuni (naga chili paste)'],
      tips: 'Hornbill tickets sell out. Book 2 months ahead. Photography inside ceremonies requires permission.',
      localWord: 'Naran (नारन) — "Welcome" in Angami Naga',
    },
    'Manipur': {
      hi: 'मणिपुर',
      emoji: '💃',
      gateway: 'Imphal (Bir Tikendrajit International Airport)',
      highlights: ['Loktak Lake (floating islands)', 'Kangla Fort', 'Keibul Lamjao NP (only floating national park)', 'Ima Keithel — world\'s largest women-run market'],
      stay: ['Classic Grande Imphal', 'Hotel Nirmala, Imphal', 'Sirohi Homestay'],
      eat: ['Eromba (fish chutney)', 'Singju (spicy raw salad)', 'Chamthong (vegetable stew)', 'Morok Metpa (chili chutney)'],
      tips: 'Loktak floating huts (phumdi) — book a local boatman (₹300/hr). Carry cash.',
      localWord: 'Khurumjari — Greeting in Meitei (Manipuri)',
    },
    'Mizoram': {
      hi: 'मिजोरम',
      emoji: '🏔',
      gateway: 'Aizawl (Lengpui Airport)',
      highlights: ['Phawngpui (Blue Mountain)', 'Vantawng Falls (229m)', 'Durtlang Hills viewpoint', 'Reiek Tlang trek'],
      stay: ['Hotel Ritz, Aizawl', 'Chief\'s Holiday Home', 'Eco Village Stay, Champhai'],
      eat: ['Bai (pork + greens + bamboo shoot)', 'Chhangban (bamboo noodles)', 'Sawhchiar (congee)', 'Za\'l (bamboo shoot curry)'],
      tips: 'Inner Line Permit required for non-Mizos. Issue at Aizawl DC office same day.',
      localWord: 'Chibai — "Hello" in Mizo',
    },
    'Tripura': {
      hi: 'त्रिपुरा',
      emoji: '🏛',
      gateway: 'Agartala (Maharaja Bir Bikram Airport)',
      highlights: ['Ujjayanta Palace', 'Neermahal Palace (lake palace)', 'Sepahijala Wildlife Sanctuary', 'Unakoti rock carvings (10th century)'],
      stay: ['Royal Guest House, Agartala', 'Hotel Sonar Bangla', 'Neermahal Resort'],
      eat: ['Mui Borok (pork curry)', 'Gudok (pork + bamboo shoot stew)', 'Chakhwi (fish + bamboo curry)', 'Berma (fermented fish)'],
      tips: 'Unakoti is 178km from Agartala. Start early. Best visited Oct–March.',
      localWord: 'Kok Borok — the main tribal language; "Bor Khausi" means thank you',
    },
    'Sikkim': {
      hi: 'सिक्किम',
      emoji: '🏯',
      gateway: 'Bagdogra (West Bengal) or Pakyong Airport (Sikkim)',
      highlights: ['Tsomgo Lake', 'Rumtek Monastery', 'Yuksom (gateway to Khangchendzonga)', 'Pelling viewpoint (Kangchenjunga)'],
      stay: ['Elgin Mount Pandim, Pelling', 'Denzong Regency, Gangtok', 'Bamboo Retreat, Gangtok'],
      eat: ['Sel Roti (ring bread)', 'Thukpa (noodle soup)', 'Phagshapa (pork + radish)', 'Chhurpi (yak cheese)'],
      tips: 'Tsomgo Lake and Nathula require permits. Arrange via registered Sikkim tour operator.',
      localWord: 'Tashi Delek — Sikkimese greeting meaning "Good Luck"',
    },
  };

  const MONTH_WEATHER = {
    'January':   { icon: '❄️', note: 'Cold & clear. Snow in high-altitude areas (Tawang, Sikkim). Perfect for Tripura & Assam.' },
    'February':  { icon: '🌸', note: 'Rhododendrons bloom. Excellent visibility. Losar festival in Sikkim.' },
    'March':     { icon: '🌺', note: 'Beautiful – before monsoon. Best for Ziro Valley & Manipur.' },
    'April':     { icon: '🌤', note: 'Warm & pleasant. Rongali Bihu festival in Assam (April 14). Crowd-free.' },
    'May':       { icon: '🌿', note: 'Green & lush. Pre-monsoon showers start. Best for Nagaland trek.' },
    'June':      { icon: '🌧', note: 'Peak monsoon in Meghalaya. Spectacular waterfalls but slippery roads.' },
    'July':      { icon: '⛈', note: 'Heavy rains. Kaziranga safaris closed. Only for adventure seekers.' },
    'August':    { icon: '🌨', note: 'Still rainy. Some roads closed. Ziro Music Festival (late Aug).' },
    'September': { icon: '🌦', note: 'Monsoon eases. Kaziranga reopens. Great for photographers.' },
    'October':   { icon: '🌤', note: 'Best season starts! Clear skies, lush landscapes. Durga Puja in Tripura.' },
    'November':  { icon: '☀️', note: 'Peak season. Cool & dry. Hornbill Festival begins Dec 1 in Nagaland.' },
    'December':  { icon: '❄️', note: 'Cold & festive. Hornbill Festival (Dec 1–10) — top attraction of the year.' },
  };

  /* ── Main Generator ──────────────────────────────────── */
  async function generateItinerary() {
    const placeholder = document.getElementById('outputPlaceholder');
    const loading     = document.getElementById('outputLoading');
    const content     = document.getElementById('outputContent');
    const actions     = document.getElementById('outputActions');
    const chat        = document.getElementById('followupChat');

    if (placeholder) placeholder.style.display = 'none';
    if (loading)     loading.style.display = 'flex';
    if (content)     content.style.display  = 'none';
    if (actions)     actions.style.display  = 'none';
    if (chat)        chat.style.display     = 'none';

    // Gather inputs
    const states    = getSelected('#stateSelect');
    const style     = getSelected('#styleSelect')[0] || 'Adventure';
    const group     = getSelected('#groupSelect')[0] || 'Couple';
    const interests = getSelected('#interestSelect');
    const diet      = getSelected('#dietSelect')[0] || 'Non-Vegetarian';
    const budget    = getSelected('#budgetSelect')[0] || 'Mid-Range';
    const days      = parseInt(daysSlider ? daysSlider.value : 7);
    const month     = document.getElementById('monthSelect')?.value || 'October';

    const selectedStates = states.length
      ? states.map(s => STATE_DATA[s]).filter(Boolean)
      : [STATE_DATA['Assam'], STATE_DATA['Meghalaya']];

    const stateNames = selectedStates.map(s => s.emoji + ' ' + Object.keys(STATE_DATA).find(k => STATE_DATA[k] === s)).join(' · ');

    // Simulate AI delay
    await new Promise(r => setTimeout(r, 2400));

    // Build itinerary HTML
    const weather = MONTH_WEATHER[month] || MONTH_WEATHER['October'];
    const daysPerState = Math.max(1, Math.floor(days / selectedStates.length));
    let dayCount = 0;
    let itinHTML = '';

    // Header
    itinHTML += `
      <div class="itin-header">
        <div class="itin-title">Your ${days}-Day Northeast India Itinerary</div>
        <div class="itin-meta">
          <span>${stateNames}</span>
          <span>•</span>
          <span>${month} ${weather.icon}</span>
          <span>•</span>
          <span>${group}</span>
          <span>•</span>
          <span>${style}</span>
        </div>
        <div class="itin-weather-note">${weather.icon} <strong>${month} travel tip:</strong> ${weather.note}</div>
      </div>`;

    // Day cards per state
    selectedStates.forEach((state, si) => {
      const stateName = Object.keys(STATE_DATA).find(k => STATE_DATA[k] === state);
      const daysHere  = si === selectedStates.length - 1 ? days - dayCount : daysPerState;

      for (let d = 0; d < daysHere; d++) {
        dayCount++;
        const highlight = state.highlights[d % state.highlights.length];
        const stayOpt   = state.stay[d % state.stay.length];
        const eatOpt    = state.eat[d % state.eat.length];

        let morning, afternoon, evening;

        if (d === 0 && si === 0) {
          morning   = `Arrive at ${state.gateway}. Check in, acclimatise to the cool, forested air.`;
          afternoon = `Explore the arrival city — local market, first taste of authentic regional cuisine.`;
          evening   = `Sunset walk or Brahmaputra/riverside cruise depending on state. Welcome dinner.`;
        } else if (d === daysHere - 1 && si === selectedStates.length - 1) {
          morning   = `Last morning — golden hour photography or temple visit. Breakfast at the hotel.`;
          afternoon = `Shopping for souvenirs: silk, bamboo crafts, local tea, spices or tribal textiles.`;
          evening   = `Transfer to airport / onward journey. Carry memories of the Seven Sisters.`;
        } else {
          morning   = `Early start (7am) for ${highlight}. This is ${stateName}'s most iconic experience.`;
          afternoon = `Deep-dive into local culture. ${interests.length ? 'Focused on: ' + interests.slice(0, 2).join(' & ') + '.' : ''} Guided exploration with local expert.`;
          evening   = `Cultural experience: folk music, tribal dance performance, or cooking class with a local family.`;
        }

        itinHTML += `
          <div class="itin-day">
            <div class="itin-day-location">${stateName} ${state.emoji} · Day ${dayCount}</div>
            <div class="itin-day-header">Day ${dayCount}: ${highlight}</div>
            <div class="itin-detail">🌅 <strong>Morning:</strong> ${morning}</div>
            <div class="itin-detail">☀️ <strong>Afternoon:</strong> ${afternoon}</div>
            <div class="itin-detail">🌙 <strong>Evening:</strong> ${evening}</div>
            <div class="itin-detail-row">
              <span class="itin-chip">🏨 ${stayOpt}</span>
              <span class="itin-chip">🍛 ${eatOpt}</span>
            </div>
          </div>`;
      }

      // State tips banner
      itinHTML += `
        <div class="itin-tip-card">
          <strong>${stateName} Insider Tip:</strong> ${state.tips}<br>
          <em style="font-size:0.78rem;opacity:0.7">${state.localWord}</em>
        </div>`;
    });

    // Budget section — keys match pill data-val on planner.html
    const budgetMap = {
      'Budget':    {
        hotels:    `₹${Math.round(days * 600)}–${Math.round(days * 900)}`,
        food:      `₹${Math.round(days * 350)}–${Math.round(days * 600)}`,
        transport: `₹${Math.round(days * 350)}–${Math.round(days * 700)}`,
        total:     `₹${Math.round(days * 1500)}–${Math.round(days * 2500)}`
      },
      'Mid-Range': {
        hotels:    `₹${Math.round(days * 2000)}–${Math.round(days * 3500)}`,
        food:      `₹${Math.round(days * 900)}–${Math.round(days * 1800)}`,
        transport: `₹${Math.round(days * 1200)}–${Math.round(days * 2500)}`,
        total:     `₹${Math.round(days * 4500)}–${Math.round(days * 8500)}`
      },
      'Luxury': {
        hotels:    `₹${Math.round(days * 6000)}–${Math.round(days * 18000)}`,
        food:      `₹${Math.round(days * 2500)}–${Math.round(days * 5000)}`,
        transport: `₹${Math.round(days * 3500)}–${Math.round(days * 7000)}`,
        total:     `₹${Math.round(days * 12000)}–${Math.round(days * 30000)}`
      },
      // Legacy keys (for older homepage planner pill labels)
      'Budget (₹15,000–25,000)':    { hotels: `₹${Math.round(days*600)}–${Math.round(days*900)}`,   food: `₹${Math.round(days*350)}–${Math.round(days*600)}`,   transport: `₹${Math.round(days*350)}–${Math.round(days*700)}`,   total: `₹${Math.round(days*1500)}–${Math.round(days*2500)}` },
      'Mid-Range (₹30,000–60,000)': { hotels: `₹${Math.round(days*2000)}–${Math.round(days*3500)}`, food: `₹${Math.round(days*900)}–${Math.round(days*1800)}`,   transport: `₹${Math.round(days*1200)}–${Math.round(days*2500)}`, total: `₹${Math.round(days*4500)}–${Math.round(days*8500)}` },
      'Luxury (₹75,000+)':          { hotels: `₹${Math.round(days*6000)}–${Math.round(days*18000)}`,food: `₹${Math.round(days*2500)}–${Math.round(days*5000)}`, transport: `₹${Math.round(days*3500)}–${Math.round(days*7000)}`, total: `₹${Math.round(days*12000)}–${Math.round(days*30000)}` },
    };
    const budgetData = budgetMap[budget] || budgetMap['Mid-Range'];

    itinHTML += `
      <div class="itin-budget">
        <div class="itin-budget-title">💰 Estimated Budget for ${days} Days (per person)</div>
        <div class="itin-budget-grid">
          <div class="budget-item"><span>🏨 Accommodation</span><strong>${budgetData.hotels}</strong></div>
          <div class="budget-item"><span>🍛 Food (3 meals/day)</span><strong>${budgetData.food}</strong></div>
          <div class="budget-item"><span>🚙 Local Transport</span><strong>${budgetData.transport}</strong></div>
          <div class="budget-item"><span>✈ Flights (Guwahati/Bagdogra)</span><strong>₹6,000–15,000</strong></div>
          <div class="budget-item total"><span>Total Estimated</span><strong>${budgetData.total}</strong></div>
        </div>
        <p class="budget-note">Prices are approximate 2025 rates. Actual costs depend on accommodation grade and group size.</p>
      </div>`;

    // Must-carry
    itinHTML += `
      <div class="itin-checklist">
        <div class="checklist-title">🎒 Must Pack for Northeast India</div>
        <div class="checklist-grid">
          <span>✓ Warm layers (Shillong/Tawang get cold)</span>
          <span>✓ Rain jacket — it can rain anytime</span>
          <span>✓ Trekking shoes (root bridges, hills)</span>
          <span>✓ Cash — ATMs sparse in remote areas</span>
          <span>✓ ILP permit (for Arunachal, Mizoram)</span>
          <span>✓ Insect repellent (jungle areas)</span>
        </div>
      </div>`;

    // Footer
    itinHTML += `
      <div class="itin-footer">
        ✦ Crafted by Priya — Ashtadisha AI Travel Curator<br>
        <small>आपकी अष्टदिशा AI यात्रा सलाहकार</small>
      </div>`;

    if (loading)  loading.style.display  = 'none';
    if (content) {
      content.style.display = 'block';
      content.innerHTML     = '';

      // Animate in with fade
      content.style.opacity = '0';
      content.innerHTML     = itinHTML;
      requestAnimationFrame(() => {
        content.style.transition = 'opacity 0.5s ease';
        content.style.opacity    = '1';
      });
    }
    if (actions) actions.style.display = 'flex';
    if (chat)    chat.style.display    = 'block';
  }

  /* ── Save Logic ─────────────────────────────────────── */
  document.getElementById('saveBtn')?.addEventListener('click', () => {
    const content = document.getElementById('outputContent');
    if (!content?.innerText) return;
    const blob = new Blob([content.innerText], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Ashtadisha_Itinerary.txt';
    a.click();
  });

  /* ── Chat Logic ─────────────────────────────────────── */
  const chatSendBtn  = document.getElementById('chatSendBtn');
  const chatInput    = document.getElementById('chatInput');
  const chatHistory  = document.getElementById('chatHistory');

  const chatResponses = (q) => [
    `For "${q}" — most NE states are accessible without permits. Arunachal Pradesh & Mizoram require an Inner Line Permit (ILP). Apply online at arunachalilp.com or mizointrade.gov.in.`,
    `Great question about "${q}"! October–March is the prime season. Avoid July–August (peak monsoon) unless you love dramatic waterfalls and solitude.`,
    `Regarding "${q}": The best local guides can be booked through Ashtadisha. They speak English, Hindi and the local tribal languages — priceless for cultural immersion.`,
    `For "${q}" — yes, Northeast food is unique. If veg, Meghalaya's Jadoh can be made veg. Assam's Khar is veg. Sikkim has excellent Buddhist monastery food.`,
  ];

  const sendChat = () => {
    if (!chatInput || !chatHistory) return;
    const val = chatInput.value.trim();
    if (!val) return;

    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble-user';
    userBubble.textContent = val;
    chatHistory.appendChild(userBubble);
    chatInput.value = '';

    setTimeout(() => {
      const aiBubble = document.createElement('div');
      aiBubble.className = 'chat-bubble-ai';
      aiBubble.textContent = chatResponses(val)[Math.floor(Math.random() * 4)];
      chatHistory.appendChild(aiBubble);
      chatHistory.scrollTop = chatHistory.scrollHeight;
    }, 900);

    chatHistory.scrollTop = chatHistory.scrollHeight;
  };

  if (chatSendBtn) chatSendBtn.addEventListener('click', sendChat);
  if (chatInput)   chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });

  // ── Booking Integration (unified bookable object: AI) ──
  const bookBtn = document.getElementById('bookFromPlan');
  if (bookBtn) {
    bookBtn.addEventListener('click', (e) => {
      e.preventDefault();

      const out = document.getElementById('outputContent');
      if (!out || !out.innerHTML.trim()) {
        alert('Generate an itinerary first, then tap Book this plan.');
        return;
      }

      const states = getSelected('#stateSelect');
      const stateNames = states.length ? states.join(' & ') : 'Assam & Meghalaya';
      const days = parseInt(document.getElementById('daysSlider')?.value || 7);
      const budgetGroup = getSelected('#budgetSelect')[0] || 'Mid-Range';
      const BP = window.AshtaBookingPackage;
      const pricePerPerson = BP && typeof BP.estimateAIPrice === 'function'
        ? BP.estimateAIPrice(days, budgetGroup)
        : 8500 * days;
      const titleEl = out.querySelector('.itin-title');
      const title = titleEl?.textContent?.trim() || `Custom AI plan — ${stateNames}`;
      const planId = BP && typeof BP.uid === 'function' ? BP.uid('ai') : ('ai_' + Date.now().toString(36));

      const checkoutData = {
        id: planId,
        title,
        price: pricePerPerson,
        duration: `${days} Days`,
        source: 'AI',
        itinerary: out.innerHTML,
        destination: stateNames,
        image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=400&q=75'
      };

      if (window.AshtaCheckout) {
        window.AshtaCheckout.open(checkoutData);
      } else {
        alert('Checkout is still loading. Please try again in a moment.');
      }
    });
  }
}
