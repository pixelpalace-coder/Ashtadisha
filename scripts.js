/* ============================================================
   ASHTADISHA — Complete JavaScript
   GSAP + ScrollTrigger + Three.js + Anime.js + Lenis + AOS
   ============================================================ */

// ── Wait for DOM ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

    // 1. GSAP Plugin Registration
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }

    // 2. AOS Init
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 600,
            once: true,
            offset: 50,
            mirror: false,
            disable: window.innerWidth < 768
        });
    }

    // 3. Lenis Smooth Scroll
    let lenis;
    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({
            duration: 1.0,
            easing: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            smoothTouch: false,
            touchMultiplier: 1.5,
            wheelMultiplier: 0.9,
            infinite: false,
        });
        function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
        requestAnimationFrame(raf);
        if (typeof ScrollTrigger !== 'undefined') {
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.lagSmoothing(0);
        }
        // Stop scroll during load
        lenis.stop();
    } else {
        // CSS fallback for smooth scroll if Lenis not loaded
        document.documentElement.style.scrollBehavior = 'smooth';
    }

    // Prevent native scroll during load
    document.body.style.overflow = 'hidden';

    // ────────────────────────────────────────────────────────────
    // LOADER ANIMATION
    // ────────────────────────────────────────────────────────────
    const loaderText = document.querySelector('.loader-text');
    const loaderHindi = document.querySelector('.loader-hindi');
    if (loaderText) loaderText.style.opacity = 1;

    if (typeof anime !== 'undefined') {
        const loaderTimeline = anime.timeline({
            complete() {
                anime({
                    targets: '#loader', opacity: [1, 0], duration: 600, easing: 'easeInOutQuad',
                    complete() {
                        const el = document.getElementById('loader');
                        if (el) el.style.display = 'none';
                        if (loaderTimeline) loaderTimeline.pause();
                        document.body.style.overflow = ''; // Restore native scroll
                        if (lenis) lenis.start(); // Start Lenis smooth scroll
                        window.dispatchEvent(new Event('scroll'));
                    }
                });
            }
        });
        loaderTimeline
            .add({ targets: '.compass-rose', rotate: '1turn', duration: 1200, easing: 'easeInOutQuad' })
            .add({ targets: '.l-char', translateY: [20, 0], opacity: [0, 1], easing: 'easeOutExpo', duration: 700, delay: anime.stagger(60) }, '-=700')
            .add({ targets: '.loader-hindi', opacity: [0, 1], translateY: [8, 0], duration: 500 }, '-=200');
    } else {
        setTimeout(() => {
            const el = document.getElementById('loader');
            if (el) {
                el.style.opacity = 0;
                setTimeout(() => {
                    el.style.display = 'none';
                    document.body.style.overflow = ''; // Restore native scroll if anime is blocked
                    if (lenis) lenis.start();
                    window.dispatchEvent(new Event('scroll'));
                }, 500);
            }
        }, 1500);
    }

    // ────────────────────────────────────────────────────────────
    // SCROLL PROGRESS BAR
    // ────────────────────────────────────────────────────────────
    const progressBar = document.getElementById('scrollProgressBar');
    window.addEventListener('scroll', () => {
        if (!progressBar) return;
        const scrolled = (document.documentElement.scrollTop / (document.documentElement.scrollHeight - document.documentElement.clientHeight)) * 100;
        progressBar.style.width = scrolled + '%';
    }, { passive: true });

    // ────────────────────────────────────────────────────────────
    // NAVBAR — Shrink + Active State
    // ────────────────────────────────────────────────────────────
    const nav = document.getElementById('mainNav');
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const y = window.scrollY;
        if (nav) {
            nav.classList.toggle('scrolled', y > 60);
            nav.style.transform = y > lastScroll && y > 300 ? 'translateY(-100%)' : 'translateY(0)';
            lastScroll = y;
        }
    }, { passive: true });

    // ────────────────────────────────────────────────────────────
    // HAMBURGER MOBILE NAV
    // ────────────────────────────────────────────────────────────
    const hamburger = document.getElementById('hamburger');
    const mobileOverlay = document.getElementById('mobileNavOverlay');
    const mobileClose = document.getElementById('mobileNavClose');

    if (hamburger && mobileOverlay) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('open');
            mobileOverlay.classList.toggle('open');
            hamburger.setAttribute('aria-expanded', hamburger.classList.contains('open'));
        });
        if (mobileClose) mobileClose.addEventListener('click', () => {
            hamburger.classList.remove('open');
            mobileOverlay.classList.remove('open');
        });
        mobileOverlay.querySelectorAll('.mobile-nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('open');
                mobileOverlay.classList.remove('open');
            });
        });
    }

    // ────────────────────────────────────────────────────────────
    // THEME TOGGLE
    // ────────────────────────────────────────────────────────────
    const themeBtn = document.getElementById('theme-toggle');
    const htmlEl = document.documentElement;
    const savedTheme = localStorage.getItem('ashtadisha_theme');
    if (savedTheme === 'dark') { htmlEl.classList.add('dark'); htmlEl.classList.remove('light'); }
    else { htmlEl.classList.add('light'); }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const isDark = htmlEl.classList.contains('dark');
            htmlEl.classList.toggle('dark', !isDark);
            htmlEl.classList.toggle('light', isDark);
            localStorage.setItem('ashtadisha_theme', isDark ? 'light' : 'dark');
            if (typeof anime !== 'undefined') {
                anime({ targets: themeBtn, scale: [0.8, 1.15, 1], duration: 500, easing: 'easeOutElastic(1, .5)' });
            }
        });
    }

    // ────────────────────────────────────────────────────────────
    // CUSTOM CURSOR
    // ────────────────────────────────────────────────────────────
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorRing = document.querySelector('.cursor-ring');
    const cursorWrapper = document.querySelector('.custom-cursor');

    if (window.matchMedia('(pointer: fine)').matches) {
        let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
        let dotX = mouseX, dotY = mouseY, ringX = mouseX, ringY = mouseY;
        let rAF_flag = false;

        window.addEventListener('mousemove', (e) => {
            if (!rAF_flag) {
                requestAnimationFrame(() => {
                    mouseX = e.clientX; mouseY = e.clientY;
                    rAF_flag = false;
                });
                rAF_flag = true;
            }
        }, { passive: true });

        const renderCursor = () => {
            dotX += (mouseX - dotX) * 0.4;
            dotY += (mouseY - dotY) * 0.4;
            ringX += (mouseX - ringX) * 0.1;
            ringY += (mouseY - ringY) * 0.1;
            if (cursorDot) cursorDot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0)`;
            if (cursorRing) cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
        };
        gsap.ticker.add(renderCursor);

        const bindHovers = () => {
            document.querySelectorAll('a,button,input,select,label,.thumb, .shop-card, .pkg-card').forEach(el => {
                el.addEventListener('mouseenter', () => cursorWrapper && cursorWrapper.classList.add('hovering'), { passive: true });
                el.addEventListener('mouseleave', () => cursorWrapper && cursorWrapper.classList.remove('hovering'), { passive: true });
            });
        };
        bindHovers();
    }

    // ────────────────────────────────────────────────────────────
    // HERO TYPEWRITER
    // ────────────────────────────────────────────────────────────
    const typeSpan = document.getElementById('typewriterText');
    const typeStrings = [
        'Where Mist Meets Mountain.',
        'जहाँ कोहरा पहाड़ से मिलता है।',
        '220+ Tribes. 8 States. Infinite Stories.',
        '220+ जनजातियाँ। 8 राज्य। अनंत कहानियाँ।',
        'Home of the Hornbill Festival.',
        'हॉर्नबिल उत्सव की भूमि।',
        'The Land the World Forgot.',
    ];
    if (typeSpan) {
        let si = 0, ci = 0, deleting = false, typePause = false;
        const typeSpeed = 65, deleteSpeed = 30, pauseMs = 2200;
        const typeStep = () => {
            if (typePause) return;
            const current = typeStrings[si];
            if (deleting) {
                ci--;
                typeSpan.textContent = current.substring(0, ci);
                if (ci <= 0) { deleting = false; si = (si + 1) % typeStrings.length; setTimeout(typeStep, 400); return; }
                setTimeout(typeStep, deleteSpeed);
            } else {
                ci++;
                typeSpan.textContent = current.substring(0, ci);
                if (ci >= current.length) {
                    typePause = true;
                    setTimeout(() => { typePause = false; deleting = true; typeStep(); }, pauseMs);
                    return;
                }
                setTimeout(typeStep, typeSpeed);
            }
        };
        setTimeout(typeStep, 2500);
    }

    // ────────────────────────────────────────────────────────────
    // STAT COUNTERS
    // ────────────────────────────────────────────────────────────
    const statNums = document.querySelectorAll('.stat-num[data-target]');
    const statsBar = document.querySelector('.stats-bar');
    if (statsBar && statNums.length) {
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    statNums.forEach(el => {
                        const target = parseInt(el.dataset.target, 10);
                        let count = 0;
                        const step = target / 60;
                        const timer = setInterval(() => {
                            count = Math.min(count + step, target);
                            el.textContent = Math.floor(count);
                            if (count >= target) clearInterval(timer);
                        }, 20);
                    });
                    statsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });
        statsObserver.observe(statsBar);
    }

    // ────────────────────────────────────────────────────────────
    // REVEAL SECTIONS
    // ────────────────────────────────────────────────────────────
    const revealEls = document.querySelectorAll('.reveal-section');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-revealed');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    revealEls.forEach(el => revealObserver.observe(el));

    // ────────────────────────────────────────────────────────────
    // GSAP SCROLL ANIMATIONS
    // ────────────────────────────────────────────────────────────
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        // State banners parallax
        document.querySelectorAll('.state-hero-banner').forEach(banner => {
            gsap.to(banner, {
                backgroundPositionY: '30%',
                ease: 'none',
                scrollTrigger: { trigger: banner, start: 'top bottom', end: 'bottom top', scrub: 2 }
            });
        });

        // About section text reveal
        ScrollTrigger.batch('.about-text p', {
            onEnter: batch => gsap.from(batch, { opacity: 0, y: 30, duration: 0.8, stagger: 0.15, ease: 'power2.out', overwrite: true }),
            start: 'top 80%',
            once: true
        });

        // Stats bar
        ScrollTrigger.batch('.stat-item', {
            onEnter: batch => gsap.from(batch, { opacity: 0, y: 20, duration: 0.5, stagger: 0.1, overwrite: true }),
            start: 'top 85%',
            once: true
        });
    }

    // ────────────────────────────────────────────────────────────
    // SHOPPING TABS
    // ────────────────────────────────────────────────────────────
    const shopTabs = document.querySelectorAll('.shop-tab');
    const shopPanels = document.querySelectorAll('.shop-panel');
    shopTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            shopTabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
            shopPanels.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            const panel = document.getElementById('tab-' + target);
            if (panel) {
                panel.classList.add('active');
                if (typeof AOS !== 'undefined') AOS.refresh();
            }
        });
    });

    // ────────────────────────────────────────────────────────────
    // AI PLANNER — Multi-Select Pills
    // ────────────────────────────────────────────────────────────
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

    // Days Slider
    const daysSlider = document.getElementById('daysSlider');
    const daysVal = document.getElementById('daysVal');
    if (daysSlider && daysVal) {
        daysSlider.addEventListener('input', () => { daysVal.textContent = daysSlider.value; });
    }

    // ── GENERATE ITINERARY ──
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

        // Simulate AI response with comprehensive demo itinerary
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
            // Typewriter reveal
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

    // Save Itinerary
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

    // Follow-up Chat
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

    // ────────────────────────────────────────────────────────────
    // BOOKING SYSTEM — 4 Steps
    // ────────────────────────────────────────────────────────────
    const stepBtns = document.querySelectorAll('.step-next, .step-prev');
    const stepIndicators = document.querySelectorAll('.b-step');
    let currentStep = 1;

    function goToStep(n) {
        const currentPanel = document.getElementById('bStep' + currentStep);
        const nextPanel = document.getElementById('bStep' + n);
        if (currentPanel) {
            currentPanel.style.opacity = '0';
            setTimeout(() => {
                currentPanel.classList.remove('active');
                if (nextPanel) {
                    nextPanel.classList.add('active');
                    nextPanel.style.opacity = '0';
                    setTimeout(() => { nextPanel.style.transition = 'opacity 0.4s'; nextPanel.style.opacity = '1'; }, 20);
                }
            }, 200);
        }
        currentStep = n;
        stepIndicators.forEach(ind => {
            const s = parseInt(ind.dataset.step);
            ind.classList.remove('active', 'completed');
            if (s === n) ind.classList.add('active');
            else if (s < n) ind.classList.add('completed');
        });
        if (n === 4) populateReview();
    }

    stepBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const next = btn.dataset.next;
            const prev = btn.dataset.prev;
            if (next) goToStep(parseInt(next));
            if (prev) goToStep(parseInt(prev));
        });
    });

    function populateReview() {
        const pkgLabel = { complete: 'The Complete 7 Sisters (₹85,000)', assam_megh: 'Assam + Meghalaya (₹42,000)', arunachal: 'Arunachal Monastery Trek (₹55,000)', hornbill: 'Hornbill Festival Special (₹38,000)', wildlife: 'Wildlife & Safari Circuit (₹62,000)', custom: 'Custom Journey (On request)' };
        const selectedPkg = document.querySelector('input[name="package"]:checked');
        const adults = parseInt(document.getElementById('adultsCount')?.value || 2);
        const children = parseInt(document.getElementById('childrenCount')?.value || 0);
        const price = selectedPkg ? parseInt(selectedPkg.dataset.price || 0) : 0;
        const total = price * adults;
        const formatted = total ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(total) : '—';

        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('rv-package', selectedPkg ? pkgLabel[selectedPkg.value] || selectedPkg.value : '—');
        set('rv-date', document.getElementById('departDate')?.value || '—');
        set('rv-travelers', `${adults} Adult${adults > 1 ? 's' : ''} + ${children} Child${children === 1 ? '' : 'ren'}`);
        set('rv-accom', document.getElementById('accommodation')?.value || '—');
        set('rv-name', document.getElementById('fullName')?.value || '—');
        set('rv-total', formatted + (total ? ` (10% advance: ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(total * 0.1)})` : ''));
    }

    const confirmBtn = document.getElementById('confirmBookingBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            const bookingWrapper = document.querySelector('.booking-wrapper');
            const steps = document.getElementById('bookingSteps');
            const stepPanels = document.querySelectorAll('.booking-step-panel');
            const success = document.getElementById('bookingSuccess');
            const ref = document.getElementById('bookingRef');

            stepPanels.forEach(p => p.style.display = 'none');
            if (steps) steps.style.display = 'none';
            if (success) success.style.display = 'flex';
            if (ref) ref.textContent = 'ASHTA-2026-' + Math.floor(1000 + Math.random() * 9000);

            if (typeof anime !== 'undefined') {
                anime({ targets: '.success-icon', scale: [0, 1.2, 1], duration: 800, easing: 'easeOutElastic(1, .6)' });
            }
        });
    }

    // ────────────────────────────────────────────────────────────
    // LIGHTBOX
    // ────────────────────────────────────────────────────────────
    const lightbox = document.createElement('div');
    lightbox.id = 'lightbox';
    lightbox.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.94);z-index:9999;align-items:center;justify-content:center;flex-direction:column;';
    lightbox.innerHTML = `<span style="color:#fff;font-size:40px;position:absolute;top:20px;right:40px;" onclick="closeLightbox()">×</span><img id="lb-img" style="max-width:90%;max-height:80vh;object-fit:contain;border-radius:8px;" src="" alt=""><p id="lb-caption" style="color:#fff;margin-top:20px;font-size:18px;text-align:center;font-family:var(--font-accent)"></p>`;
    document.body.appendChild(lightbox);

    window.openLightbox = function (wrap) {
        const img = wrap.querySelector('.place-main-img');
        const en = wrap.querySelector('.place-name-en')?.textContent || '';
        const hi = wrap.querySelector('.place-name-hi')?.textContent || '';
        document.getElementById('lb-img').src = img.src;
        document.getElementById('lb-caption').textContent = en + (hi ? ' / ' + hi : '');
        lightbox.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    };
    window.closeLightbox = function () {
        lightbox.style.display = 'none';
        document.body.style.overflow = '';
    };
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

    window.swapMain = function (thumb) {
        const card = thumb.closest('.place-card');
        const main = card.querySelector('.place-main-img');
        [main.src, thumb.src] = [thumb.src, main.src];
    };

    // ────────────────────────────────────────────────────────────
    // ────────────────────────────────────────────────────────────
    // THREE.JS — PERFORMANCE OPTIMIZED PARTICLE SYSTEMS
    // ────────────────────────────────────────────────────────────
    if (typeof THREE !== 'undefined' && window.innerWidth >= 768) {

        // Configuration
        const PIXEL_RATIO_CAP = 1;
        const HERO_PARTICLES = 3000;
        const STRIP_PARTICLES = 200;
        const FOOTER_PARTICLES = 200;

        /**
         * Shared Particle System Initializer
         */
        function initParticleSystem(canvas, count, color = 0x4CAF7D, size = 0.03, opacity = 0.5, spread = 8) {
            if (!canvas) return null;
            const width = canvas.offsetWidth || window.innerWidth;
            const height = canvas.offsetHeight || window.innerHeight;

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
            camera.position.z = 3;

            const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, PIXEL_RATIO_CAP));

            const positions = new Float32Array(count * 3);
            for (let i = 0; i < count * 3; i++) {
                positions[i] = (Math.random() - 0.5) * spread;
            }

            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            const mat = new THREE.PointsMaterial({ color, size, transparent: true, opacity });
            const points = new THREE.Points(geo, mat);
            scene.add(points);

            const system = {
                renderer, scene, camera, points,
                rafId: null,
                active: false,
                animate: function () {
                    system.rafId = requestAnimationFrame(system.animate);
                    system.points.rotation.y += 0.001;
                    system.points.rotation.x += 0.0005;
                    system.renderer.render(system.scene, system.camera);
                },
                start: function () {
                    if (!system.active) {
                        system.active = true;
                        system.animate();
                    }
                },
                stop: function () {
                    if (system.active) {
                        cancelAnimationFrame(system.rafId);
                        system.rafId = null;
                        system.active = false;
                    }
                },
                resize: function () {
                    const w = canvas.offsetWidth || window.innerWidth;
                    const h = canvas.offsetHeight || window.innerHeight;
                    system.camera.aspect = w / h;
                    system.camera.updateProjectionMatrix();
                    system.renderer.setSize(w, h);
                }
            };
            return system;
        }

        // 1. Initialize Hero
        const heroCanvas = document.getElementById('heroCanvas');
        let heroSystem = initParticleSystem(heroCanvas, HERO_PARTICLES, 0xC8842A, 0.02, 0.6, 12);
        if (heroSystem) {
            let mouseX = 0, mouseY = 0;
            window.addEventListener('mousemove', e => {
                mouseX = (e.clientX / window.innerWidth - 0.5) * 0.05;
                mouseY = (e.clientY / window.innerHeight - 0.5) * 0.05;
            }, { passive: true });

            const baseAnimate = heroSystem.animate;
            heroSystem.animate = function () {
                heroSystem.rafId = requestAnimationFrame(heroSystem.animate);
                heroSystem.points.rotation.y += 0.0008 + mouseX;
                heroSystem.points.rotation.x += 0.0003 + mouseY;
                heroSystem.renderer.render(heroSystem.scene, heroSystem.camera);
            };
        }

        // 2. Initialize Footer
        const footerCanvas = document.getElementById('footerCanvas');
        let footerSystem = initParticleSystem(footerCanvas, FOOTER_PARTICLES, 0x4CAF7D, 0.04, 0.4, 8);

        // 3. Initialize State Strips
        const stripCanvases = document.querySelectorAll('.state-strip-canvas');
        const stripSystems = new Map();
        stripCanvases.forEach(canvas => {
            const system = initParticleSystem(canvas, STRIP_PARTICLES, 0xC8842A, 0.035, 0.5, 10);
            if (system) stripSystems.set(canvas, system);
        });

        const canvasObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const canvas = entry.target;
                let sys = (canvas.id === 'heroCanvas') ? heroSystem : (canvas.id === 'footerCanvas' ? footerSystem : stripSystems.get(canvas));
                if (sys) entry.isIntersecting ? sys.start() : sys.stop();
            });
        }, { threshold: 0 });

        if (heroCanvas) canvasObserver.observe(heroCanvas);
        if (footerCanvas) canvasObserver.observe(footerCanvas);
        stripCanvases.forEach(c => canvasObserver.observe(c));

        window.addEventListener('resize', () => {
            if (heroSystem) heroSystem.resize();
            if (footerSystem) footerSystem.resize();
            stripSystems.forEach(s => s.resize());
        }, { passive: true });
    }

    // ────────────────────────────────────────────────────────────
    // NEWSLETTER & FOOTER INTERACTION
    // ────────────────────────────────────────────────────────────
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = newsletterForm.querySelector('button');
            const orig = btn.textContent;
            btn.textContent = '✓ Subscribed!';
            btn.style.background = '#4CAF7D';
            setTimeout(() => { btn.textContent = orig; btn.style.background = ''; }, 3000);
        });
    }

    // ────────────────────────────────────────────────────────────
    // MAGNETIC BUTTONS (GSAP)
    // ────────────────────────────────────────────────────────────
    if (typeof gsap !== 'undefined') {
        const magneticEls = document.querySelectorAll('.nav-link, .btn, .meta-pill, .pill, .thumb, .logo, .shop-tab');
        magneticEls.forEach(el => {
            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                gsap.to(el, { x: x * 0.3, y: y * 0.3, duration: 0.4, ease: 'power2.out' });
            }, { passive: true });
            el.addEventListener('mouseleave', () => {
                gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
            }, { passive: true });
        });
    }

    // Smooth anchor links (for Lenis)
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href === '#' || !href) return;
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            if (lenis) lenis.scrollTo(target, { offset: -80, duration: 1.4 });
            else target.scrollIntoView({ behavior: 'smooth' });
        }, { passive: false });
    });

}); // end DOMContentLoaded


const IMAGE_MAP = {
    assam: {
        kaziranga: [
            "https://source.unsplash.com/800x600/?kaziranga,rhino",
            "https://source.unsplash.com/800x600/?assam,wildlife,rhino",
            "https://source.unsplash.com/800x600/?kaziranga,safari",
            "https://source.unsplash.com/800x600/?kaziranga,forest"
        ],
        majuli: [
            "https://source.unsplash.com/800x600/?majuli,island",
            "https://source.unsplash.com/800x600/?brahmaputra,island",
            "https://source.unsplash.com/800x600/?majuli,boat",
            "https://source.unsplash.com/800x600/?assam,culture,island"
        ],
        kamakhya: [
            "https://source.unsplash.com/800x600/?kamakhya,temple",
            "https://source.unsplash.com/800x600/?guwahati,temple",
            "https://source.unsplash.com/800x600/?hindu,temple,assam",
            "https://source.unsplash.com/800x600/?nilachal,hill"
        ]
    },

    meghalaya: {
        cherrapunji: [
            "https://source.unsplash.com/800x600/?cherrapunji,waterfall",
            "https://source.unsplash.com/800x600/?meghalaya,rain",
            "https://source.unsplash.com/800x600/?northeast,waterfall",
            "https://source.unsplash.com/800x600/?green,valley,meghalaya"
        ],
        dawki: [
            "https://source.unsplash.com/800x600/?dawki,river",
            "https://source.unsplash.com/800x600/?umngot,river",
            "https://source.unsplash.com/800x600/?transparent,river,india",
            "https://source.unsplash.com/800x600/?boat,clear,water"
        ],
        rootbridge: [
            "https://source.unsplash.com/800x600/?living,root,bridge",
            "https://source.unsplash.com/800x600/?meghalaya,bridge",
            "https://source.unsplash.com/800x600/?double,decker,bridge",
            "https://source.unsplash.com/800x600/?forest,bridge"
        ]
    },

    arunachal: {
        tawang: [
            "https://source.unsplash.com/800x600/?tawang,monastery",
            "https://source.unsplash.com/800x600/?arunachal,monk",
            "https://source.unsplash.com/800x600/?buddhist,monastery",
            "https://source.unsplash.com/800x600/?mountain,monastery"
        ],
        ziro: [
            "https://source.unsplash.com/800x600/?ziro,valley",
            "https://source.unsplash.com/800x600/?arunachal,valley",
            "https://source.unsplash.com/800x600/?rice,fields,ziro",
            "https://source.unsplash.com/800x600/?green,valley,india"
        ]
    },

    nagaland: {
        hornbill: [
            "https://source.unsplash.com/800x600/?hornbill,festival",
            "https://source.unsplash.com/800x600/?nagaland,culture",
            "https://source.unsplash.com/800x600/?tribal,festival",
            "https://source.unsplash.com/800x600/?traditional,dance,india"
        ],
        kohima: [
            "https://source.unsplash.com/800x600/?kohima,city",
            "https://source.unsplash.com/800x600/?nagaland,hills",
            "https://source.unsplash.com/800x600/?war,memorial,kohima",
            "https://source.unsplash.com/800x600/?mountain,town"
        ]
    },

    manipur: {
        loktak: [
            "https://source.unsplash.com/800x600/?loktak,lake",
            "https://source.unsplash.com/800x600/?floating,islands",
            "https://source.unsplash.com/800x600/?manipur,lake",
            "https://source.unsplash.com/800x600/?phumdis"
        ]
    },

    mizoram: {
        aizawl: [
            "https://source.unsplash.com/800x600/?aizawl,city",
            "https://source.unsplash.com/800x600/?mizoram,hills",
            "https://source.unsplash.com/800x600/?mountain,city,india",
            "https://source.unsplash.com/800x600/?northeast,india,hills"
        ]
    },

    tripura: {
        ujjayanta: [
            "https://source.unsplash.com/800x600/?ujjayanta,palace",
            "https://source.unsplash.com/800x600/?tripura,palace",
            "https://source.unsplash.com/800x600/?royal,architecture,india",
            "https://source.unsplash.com/800x600/?heritage,palace"
        ]
    },

    sikkim: {
        gangtok: [
            "https://source.unsplash.com/800x600/?gangtok,city",
            "https://source.unsplash.com/800x600/?kanchenjunga,mountain",
            "https://source.unsplash.com/800x600/?sikkim,monastery",
            "https://source.unsplash.com/800x600/?himalaya,view"
        ]
    }
};

function loadImages() {
    document.querySelectorAll(".place-card").forEach(card => {
        const state = card.dataset.state;
        const place = card.dataset.place;

        const imgs = IMAGE_MAP[state]?.[place];
        if (!imgs) return;

        const main = card.querySelector(".place-main-img");
        const thumbs = card.querySelectorAll(".thumb");

        main.src = imgs[0];
        thumbs.forEach((t, i) => {
            t.src = imgs[i + 1];
        });
    });
}

document.addEventListener("DOMContentLoaded", loadImages);