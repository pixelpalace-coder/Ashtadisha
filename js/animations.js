export function initAnimations() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;

    // 1. GSAP Plugin Registration
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }

    // 2. AOS Init — lighter on tablets; disabled on small phones via CSS too
    if (typeof AOS !== 'undefined') {
        AOS.init({ 
            duration: 500, 
            once: true, 
            offset: 40,
            mirror: false,
            disable: window.innerWidth < 768 || prefersReducedMotion
        });
    }

    // 3. Lenis — skip on touch-first devices (major scroll jank fix) and reduced-motion
    let lenis = null;
    const useLenis = typeof Lenis !== 'undefined' && !isCoarsePointer && !prefersReducedMotion;

    if (useLenis) {
        lenis = new Lenis({
            duration: 0.85,
            easing: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            smoothTouch: false,
            touchMultiplier: 1.5,
            wheelMultiplier: 0.85,
            infinite: false,
        });
        function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
        requestAnimationFrame(raf);
        
        if (typeof ScrollTrigger !== 'undefined') {
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.lagSmoothing(0);
        }
    } else {
        document.documentElement.style.scrollBehavior = 'smooth';
    }

    // 4. Scroll progress bar — rAF-throttled to avoid layout thrash
    const progressBar = document.getElementById('scrollProgressBar');
    let progressTicking = false;
    window.addEventListener('scroll', () => {
        if (!progressBar || progressTicking) return;
        progressTicking = true;
        requestAnimationFrame(() => {
            progressTicking = false;
            const doc = document.documentElement;
            const max = doc.scrollHeight - doc.clientHeight;
            const scrolled = max > 0 ? (doc.scrollTop / max) * 100 : 0;
            progressBar.style.width = scrolled + '%';
        });
    }, { passive: true });

    // 5. Hero Typewriter
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

    // 6. Stat Counters
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

    // 7. Reveal Sections
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

    // 8. GSAP Scroll Animations — skip on touch to reduce main-thread work
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && !isCoarsePointer) {
        ScrollTrigger.batch('.about-text p', {
            onEnter: batch => gsap.from(batch, { opacity: 0, y: 30, duration: 0.8, stagger: 0.15, ease: 'power2.out', overwrite: true }),
            start: 'top 80%',
            once: true
        });

        ScrollTrigger.batch('.stat-item', {
            onEnter: batch => gsap.from(batch, { opacity: 0, y: 20, duration: 0.5, stagger: 0.1, overwrite: true }),
            start: 'top 85%',
            once: true
        });
    }

    // 9. Magnetic Buttons (GSAP) — pointer devices only
    if (typeof gsap !== 'undefined' && isFinePointer) {
        const magneticEls = document.querySelectorAll('.nav-link, .btn, .meta-pill, .pill, .thumb, .logo, .shop-tab');
        magneticEls.forEach(el => {
            let rect;
            el.addEventListener('mouseenter', () => {
                rect = el.getBoundingClientRect();
            }, { passive: true });
            el.addEventListener('mousemove', (e) => {
                if (!rect) return;
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                gsap.to(el, { x: x * 0.3, y: y * 0.3, duration: 0.4, ease: 'power2.out' });
            }, { passive: true });
            el.addEventListener('mouseleave', () => {
                rect = null;
                gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
            }, { passive: true });
        });
    }

    // Smooth anchor links
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
}
