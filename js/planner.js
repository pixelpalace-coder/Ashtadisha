export function initPlanner() {
    const singleSelectGroups = ['#styleSelect', '#groupSelect', '#dietSelect'];
    const multiSelectGroups = ['#stateSelect', '#interestSelect'];

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

    const daysSlider = document.getElementById('daysSlider');
    const daysVal = document.getElementById('daysVal');
    if (daysSlider && daysVal) {
        daysSlider.addEventListener('input', () => { daysVal.textContent = daysSlider.value; });
    }

    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateItinerary);
    }
    const regenBtn = document.getElementById('regenBtn');
    if (regenBtn) regenBtn.addEventListener('click', generateItinerary);

    function buildPrompt() {
        const getSelectedVals = (sel) => {
            const wrap = document.querySelector(sel);
            if (!wrap) return [];
            return Array.from(wrap.querySelectorAll('.pill.selected')).map(p => p.dataset.val);
        };
        const states = getSelectedVals('#stateSelect');
        const style = getSelectedVals('#styleSelect')[0] || 'Adventure';
        const group = getSelectedVals('#groupSelect')[0] || 'Couple';
        const interests = getSelectedVals('#interestSelect');
        const diet = getSelectedVals('#dietSelect')[0] || 'Non-Vegetarian';
        const days = daysSlider ? daysSlider.value : 7;
        const month = document.getElementById('monthSelect') ? document.getElementById('monthSelect').value : 'October';

        const stateStr = states.length ? states.join(', ') : 'Assam and Meghalaya';
        const interestStr = interests.length ? interests.join(', ') : 'Nature and Culture';

        return `You are an expert Northeast India travel planner. Create a detailed ${days}-day itinerary for a ${group} traveling to ${stateStr} in ${month}. Travel style: ${style}. Interests: ${interestStr}. Diet: ${diet}.

Format the itinerary as:
🗓 DAY [N]: [PLACE] (include Hindi name in parentheses)
- Morning: ...
- Afternoon: ...
- Evening: ...
- Stay: [Hotel/Homestay recommendation]
- Eat: [Local dish and restaurant]

Also include:
• Must-Carry / ज़रूरी सामान
• Local Tips / स्थानीय सुझाव (3 tips in both English & Hindi)
• Approximate Budget: ₹XX,XXX per person

Keep it immersive, specific, and include local cultural context. Use ✦ for section dividers.`;
    }

    async function generateItinerary() {
        const placeholder = document.getElementById('outputPlaceholder');
        const loading = document.getElementById('outputLoading');
        const content = document.getElementById('outputContent');
        const actions = document.getElementById('outputActions');
        const chat = document.getElementById('followupChat');

        if (placeholder) placeholder.style.display = 'none';
        if (loading) loading.style.display = 'flex';
        if (content) content.style.display = 'none';
        if (actions) actions.style.display = 'none';
        if (chat) chat.style.display = 'none';

        const prompt = buildPrompt();

        await new Promise(r => setTimeout(r, 2200));

        const days = daysSlider ? daysSlider.value : 7;
        const getSelectedVals = (sel) => {
            const wrap = document.querySelector(sel);
            if (!wrap) return [];
            return Array.from(wrap.querySelectorAll('.pill.selected')).map(p => p.dataset.val);
        };
        const states = getSelectedVals('#stateSelect');
        const stateStr = states.length ? states.join(' & ') : 'Assam & Meghalaya';
        const month = document.getElementById('monthSelect') ? document.getElementById('monthSelect').value : 'October';

        const mockItinerary = `✦ YOUR ${days}-DAY NORTHEAST INDIA ITINERARY ✦
${stateStr} • ${month}
आपकी ${days} दिन की पूर्वोत्तर यात्रा

══════════════════════════════════════

🗓 DAY 1: GUWAHATI (गुवाहाटी) — Gateway to the Northeast
- Morning: Arrive at Lokpriya Gopinath Bordoloi Airport. Transfer to hotel. The air is thick with bamboo and rain. Visit Kamakhya Temple at dawn — one of India's most powerful shakti peethas.
- Afternoon: Explore Fancy Bazaar for Assam muga silk and bamboo handicrafts. Lunch at Paradise Restaurant — order Masor Tenga (খট্টা মাছ / खट्टी मछली करी) and Khar.
- Evening: Cruise on Brahmaputra at sunset. The river turns gold. Visit Umananda Island — Asia's smallest river island with a Shiva temple reachable by ferry.
- Stay: Vivanta Guwahati or Wild Mahseer Retreat (Eco)
- Eat: Masor Tenga, Khar, Duck Curry | মাছর তেংগা, খার

══════════════════════════════════════

🗓 DAY 2: KAZIRANGA NATIONAL PARK (কাজিৰঙা / काज़ीरंगा)
- Morning: Drive 4 hours to Kaziranga. Pre-dawn jeep safari in the Central Zone — watch Indian one-horned rhinos in morning mist. Elephants, wild buffaloes, Gangetic river dolphins.
- Afternoon: Visit Kohora market. Lunch at Aranya Lodge. Afternoon elephant safari in Western Range.
- Evening: Cultural show at the lodge — Bihu dance with brass plates and percussion.
- Stay: Iora – The Retreat or Wild Grass Resort
- Eat: Local thali with bamboo shoot pickle | বাহৰ আচাৰ

══════════════════════════════════════

🗓 DAY 3: KAZIRANGA → SHILLONG (শিলং / शिलांग)
- Morning: Final morning safari. Drive south to Meghalaya through winding ghats. The landscape changes — pine trees, cool air.
- Afternoon: Arrive Shillong. Check in. Explore Ward's Lake and Police Bazaar — Meghalaya's shopping hub for tribal textiles.
- Evening: Live music at Dylan's Cafe — Shillong is called the Rock Music Capital of India!
- Stay: Hotel Polo Towers or Ri Kynjai Lake Resort
- Eat: Jadoh (জাদোহ / जाडोह), Tungrymbai, Pukhlein sweet rice cake

══════════════════════════════════════

🗓 DAY 4: CHERRAPUNJI / SOHRA (চেৰাপুঞ্জি / चेरापूँजी)
- Morning: Drive to Sohra — once the wettest place on Earth. Visit Nohkalikai Falls (India's tallest plunge waterfall, 340m). The valley below is emerald green.
- Afternoon: Trek to Double Decker Living Root Bridge in Nongriat (3-hour hike). These bridges are grown — interwoven Ficus roots, 500 years old. UNESCO nominated.
- Evening: Return to Cherrapunji. Visit Eco Park with views of Bangladesh plains.
- Stay: Cherrapunji Holiday Resort
- Eat: Dohneiiong (black sesame pork), Pumaloi rice

══════════════════════════════════════

🗓 DAY 5: MAWLYNNONG + DAWKI (মাওলিননং / मावलिन्नोंग)
- Morning: Visit Mawlynnong — Asia's Cleanest Village. Every home has bamboo dustbins. Giant treehouse. Walk bamboo boardwalks.
- Afternoon: Drive to Dawki — take a boat on Umngot River. Water so crystal clear, boats appear to float on glass.
- Evening: Return to Shillong via Mawphlang Sacred Forest — a living museum protected by tribal law since the 1400s.
- Stay: Back in Shillong
- Eat: Pork Jadoh, Jyatut (fermented soybean), local rice wine

══════════════════════════════════════

🗓 DAY 6: SHILLONG → GUWAHATI → HOME
- Morning: Last morning in the hills. Optional: Elephant Falls, Laitlum Canyons for sunrise.
- Afternoon: Drive back to Guwahati. Last shopping at Fancy Bazaar or Sarusajai.
- Evening: Departure. Carry: Muga silk, Assam Orthodox tea, Raja Mirchi pickle, bamboo baskets.

══════════════════════════════════════

🎒 MUST-CARRY / ज़रूरी सामान
• Warm layers (Shillong is cold!) | गर्म कपड़े
• Rain jacket/umbrella (mandatory) | बरसाती
• Inner Line Permit not needed for these states | परमिट की जरूरत नहीं
• Cash (ATMs sparse in Sohra) | नकद पैसे
• Trekking shoes for root bridges | ट्रेकिंग जूते

✦ LOCAL TIPS / स्थानीय सुझाव ✦

1. Always ask permission before photographing tribal people or ceremonies. / जनजातीय लोगों या समारोहों की फोटो लेने से पहले हमेशा अनुमति लें।

2. The Khasi Matrilineal Society: Property and surnames pass through daughters. Be respectful of this culture. / संपत्ति और उपनाम बेटियों को मिलते हैं। इस संस्कृति का सम्मान करें।

3. Best souvenirs: Living Root Bridge seeds, Shillong cheese, Khasi handloom. Avoid: Buying animal products or wild plants. / सर्वोत्तम स्मृतिचिह्न: शिलांग पनीर, खासी हथकरघा।

✦ APPROXIMATE BUDGET / अनुमानित बजट ✦
Per person (mid-range):
• Flights: ₹8,000–15,000
• Hotels (5 nights): ₹12,000–20,000
• Safaris & Activities: ₹6,000–10,000
• Food: ₹3,000–5,000
• Shopping: ₹3,000–8,000
━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL: ₹32,000–58,000 per person
(Without flights: ₹24,000–43,000)

Crafted with ❤️ by Priya, your Ashtadisha AI Planner
प्रिया, आपकी अष्टदिशा AI यात्रा सलाहकार द्वारा`;

        if (loading) loading.style.display = 'none';
        if (content) {
            content.style.display = 'block';
            content.textContent = '';
            let i = 0;
            const typeInterval = setInterval(() => {
                content.textContent = mockItinerary.substring(0, i);
                i += 4;
                content.scrollTop = content.scrollHeight;
                if (i >= mockItinerary.length) { clearInterval(typeInterval); content.textContent = mockItinerary; }
            }, 10);
        }
        if (actions) actions.style.display = 'flex';
        if (chat) chat.style.display = 'block';
    }

    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const content = document.getElementById('outputContent');
            if (!content || !content.textContent) return;
            const blob = new Blob([content.textContent], { type: 'text/plain;charset=utf-8' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
            a.download = 'Ashtadisha_Itinerary.txt'; a.click();
        });
    }

    const chatSendBtn = document.getElementById('chatSendBtn');
    const chatInput = document.getElementById('chatInput');
    const chatHistory = document.getElementById('chatHistory');

    if (chatSendBtn && chatInput && chatHistory) {
        const sendChat = () => {
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
                const responses = [
                    `Great question! For "${val}", I recommend checking the local tourism board in Guwahati. They offer free guides for most attractions.`,
                    `For "${val}" — yes, most Northeast states require local permits. Meghalaya and Assam are open to all Indian citizens without permits. Arunachal requires an Inner Line Permit.`,
                    `Regarding "${val}": October–March is the best window. Hornbill Festival (Dec 1-10) is a must-see! बिल्कुल जाएँ!`,
                ];
                aiBubble.textContent = responses[Math.floor(Math.random() * responses.length)];
                chatHistory.appendChild(aiBubble);
                chatHistory.scrollTop = chatHistory.scrollHeight;
            }, 1000);
            chatHistory.scrollTop = chatHistory.scrollHeight;
        };
        chatSendBtn.addEventListener('click', sendChat);
        chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });
    }
}
