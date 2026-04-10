export function initAnimations() {
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
        
        // Wait for loader to finish then start lenis.
        // It's started natively via window event or we can just start it directly since loader pauses native overflow.
        // Let's assume lenis runs constantly but overflow: hidden handles lock
    } else {
        document.documentElement.style.scrollBehavior = 'smooth';
    }

    // 4. Scroll Progress Bar
    const progressBar = document.getElementById('scrollProgressBar');
    window.addEventListener('scroll', () => {
        if (!progressBar) return;
        const scrolled = (document.documentElement.scrollTop / (document.documentElement.scrollHeight - document.documentElement.clientHeight)) * 100;
        progressBar.style.width = scrolled + '%';
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

    // 8. GSAP Scroll Animations
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        document.querySelectorAll('.state-hero-banner').forEach(banner => {
            gsap.to(banner, {
                backgroundPositionY: '30%',
                ease: 'none',
                scrollTrigger: { trigger: banner, start: 'top bottom', end: 'bottom top', scrub: 2 }
            });
        });

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

    // 9. Magnetic Buttons (GSAP)
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
