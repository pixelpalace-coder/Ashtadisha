export function initUI() {
    // 1. Loader Animation
    const loaderText = document.querySelector('.loader-text');
    const loaderHindi = document.querySelector('.loader-hindi');
    if (loaderText) loaderText.style.opacity = 1;

    if (typeof anime !== 'undefined') {
        const loaderTimeline = anime.timeline({
            complete() {
                anime({ targets: '#loader', opacity: [1, 0], duration: 600, easing: 'easeInOutQuad',
                    complete() {
                        const el = document.getElementById('loader');
                        if (el) el.style.display = 'none';
                        if (loaderTimeline) loaderTimeline.pause();
                        document.body.style.overflow = ''; // Restore native scroll
                        // Lenis will be started in animations.js
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
                    document.body.style.overflow = ''; 
                    window.dispatchEvent(new Event('scroll'));
                }, 500); 
            }
        }, 1500);
    }

    // 2. Navbar, Hamburger, and Theme Toggle
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

    const hamburger = document.getElementById('hamburger');
    const mobileOverlay = document.getElementById('mobileNavOverlay');
    const mobileClose = document.getElementById('mobileNavClose');

    function closeMobileNav() {
        hamburger?.classList.remove('open');
        mobileOverlay?.classList.remove('open');
        if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    function openMobileNav() {
        if (!mobileOverlay || !hamburger) return;
        hamburger.classList.add('open');
        mobileOverlay.classList.add('open');
        hamburger.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }

    if (hamburger && mobileOverlay) {
        hamburger.addEventListener('click', () => {
            const opening = !mobileOverlay.classList.contains('open');
            if (opening) openMobileNav();
            else closeMobileNav();
        });
        if (mobileClose) mobileClose.addEventListener('click', closeMobileNav);
        // Tap dimmed backdrop (overlay itself) to close — fixes “stuck” feeling
        mobileOverlay.addEventListener('click', (e) => {
            if (e.target === mobileOverlay) closeMobileNav();
        });
        mobileOverlay.querySelectorAll('.mobile-nav-link').forEach(link => {
            link.addEventListener('click', () => {
                closeMobileNav();
            });
        });
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;
            if (mobileOverlay.classList.contains('open')) {
                closeMobileNav();
                e.preventDefault();
            }
        });
    }

    // Mobile quick bar (homepage): Home / Packages / Book / Menu
    const mqnMenuBtn = document.getElementById('mqnOpenMenu');
    if (mqnMenuBtn && hamburger && mobileOverlay) {
        mqnMenuBtn.addEventListener('click', () => {
            if (!mobileOverlay.classList.contains('open')) openMobileNav();
            else closeMobileNav();
        });
    }
    document.querySelectorAll('.mqn-link[href^="#"]').forEach((link) => {
        link.addEventListener('click', () => closeMobileNav());
    });

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

    // 3. Custom Cursor
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorRing = document.querySelector('.cursor-ring');
    const cursorWrapper = document.querySelector('.custom-cursor');

    if (window.matchMedia('(pointer: fine)').matches && cursorDot && cursorRing) {
        let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
        let dotX = mouseX, dotY = mouseY, ringX = mouseX, ringY = mouseY;
        let rAF_flag = false;

        let isCursorRendering = false;

        window.addEventListener('mousemove', (e) => { 
            if (!rAF_flag) {
                requestAnimationFrame(() => {
                    mouseX = e.clientX; mouseY = e.clientY; 
                    if (!isCursorRendering) {
                        isCursorRendering = true;
                        renderCursor();
                    }
                    rAF_flag = false;
                });
                rAF_flag = true;
            }
        }, { passive: true });

        const renderCursor = () => {
            const dx = mouseX - dotX;
            const dy = mouseY - dotY;
            const rx = mouseX - ringX;
            const ry = mouseY - ringY;

            dotX += dx * 0.4;
            dotY += dy * 0.4;
            ringX += rx * 0.1;
            ringY += ry * 0.1;

            cursorDot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0)`;
            cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;

            if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1 || Math.abs(rx) > 0.1 || Math.abs(ry) > 0.1) {
                requestAnimationFrame(renderCursor);
            } else {
                isCursorRendering = false;
            }
        };
        isCursorRendering = true;
        renderCursor();

        const bindHovers = () => {
            document.querySelectorAll('a,button,input,select,label,.thumb, .shop-card, .pkg-card').forEach(el => {
                el.addEventListener('mouseenter', () => cursorWrapper && cursorWrapper.classList.add('hovering'), { passive: true });
                el.addEventListener('mouseleave', () => cursorWrapper && cursorWrapper.classList.remove('hovering'), { passive: true });
            });
        };
        bindHovers();
    }

    // 4. Shopping Tabs
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

    // 5. Lightbox
    const lightbox = document.createElement('div');
    lightbox.id = 'lightbox';
    lightbox.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.94);z-index:9999;align-items:center;justify-content:center;flex-direction:column;';
    lightbox.innerHTML = `<span style="color:#fff;font-size:40px;position:absolute;top:20px;right:40px;cursor:pointer;" onclick="closeLightbox()">×</span><img id="lb-img" style="max-width:90%;max-height:80vh;object-fit:contain;border-radius:8px;" src="" alt=""><p id="lb-caption" style="color:#fff;margin-top:20px;font-size:18px;text-align:center;font-family:var(--font-accent)"></p>`;
    document.body.appendChild(lightbox);

    window.openLightbox = function(wrap) {
        const img = wrap.querySelector('.place-main-img');
        const en = wrap.querySelector('.place-name-en')?.textContent || '';
        const hi = wrap.querySelector('.place-name-hi')?.textContent || '';
        document.getElementById('lb-img').src = img.src;
        document.getElementById('lb-caption').textContent = en + (hi ? ' / ' + hi : '');
        lightbox.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    };
    window.closeLightbox = function() {
        lightbox.style.display = 'none';
        document.body.style.overflow = '';
    };
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
    window.swapMain = function(thumb) {
        const card = thumb.closest('.place-card');
        const main = card.querySelector('.place-main-img');
        [main.src, thumb.src] = [thumb.src, main.src];
    };

    // 6. Newsletter
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = newsletterForm.querySelector('button');
            if (!btn) return;
            const orig = btn.textContent;
            btn.textContent = '✓ Subscribed!';
            btn.style.background = '#4CAF7D';
            setTimeout(() => { btn.textContent = orig; btn.style.background = ''; }, 3000);
        });
    }

    // 7. Hero Live Clock (Awesome UI)
    const heroClock = document.getElementById('heroClock');
    if (heroClock) {
        setInterval(() => {
            const now = new Date();
            heroClock.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }, 1000);
    }
}
