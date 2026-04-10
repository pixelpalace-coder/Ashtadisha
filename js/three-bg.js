export function initThreeJS() {
    if (typeof THREE !== 'undefined' && window.innerWidth >= 768) {
        
        // Configuration
        const PIXEL_RATIO_CAP = 1;
        const HERO_PARTICLES = 3000;
        const STRIP_PARTICLES = 200;
        const FOOTER_PARTICLES = 200;

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
                animate: function() {
                    system.rafId = requestAnimationFrame(system.animate);
                    system.points.rotation.y += 0.001;
                    system.points.rotation.x += 0.0005;
                    system.renderer.render(system.scene, system.camera);
                },
                start: function() {
                    if (!system.active) {
                        system.active = true;
                        system.animate();
                    }
                },
                stop: function() {
                    if (system.active) {
                        cancelAnimationFrame(system.rafId);
                        system.rafId = null;
                        system.active = false;
                    }
                },
                resize: function() {
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
            
            heroSystem.animate = function() {
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
}
