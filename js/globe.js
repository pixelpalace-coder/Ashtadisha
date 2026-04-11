/**
 * Ashtadisha — Premium 3D Interactive Globe
 * High-performance, aesthetic visualization of the Seven Sisters region.
 */

export function initGlobe() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas || window.innerWidth < 768) return;

    const width = canvas.offsetWidth || window.innerWidth;
    const height = canvas.offsetHeight || window.innerHeight;

    // ── Setup ──
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // ── Globe Group ──
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // ── Sphere (Earth) ──
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    
    // Using a beautiful night-time texture for a premium look
    const loader = new THREE.TextureLoader();
    const earthTexture = loader.load('https://raw.githubusercontent.com/turban/webgl-earth/master/images/earth_lights_2048.png');
    
    const globeMat = new THREE.MeshPhongMaterial({
        map: earthTexture,
        color: 0x888888,
        specular: 0x333333,
        shininess: 10,
        bumpScale: 0.05,
        transparent: true,
        opacity: 0.95
    });

    const globe = new THREE.Mesh(geometry, globeMat);
    globeGroup.add(globe);

    // ── Atmosphere Glow ──
    const atmosphereGeo = new THREE.SphereGeometry(1.25, 64, 64);
    const atmosphereMat = new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.BackSide,
        uniforms: {
            glowColor: { value: new THREE.Color(0x4CAF7D) },
            viewVector: { value: camera.position }
        },
        vertexShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
                vNormal = normalize( normalMatrix * normal );
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }
        `,
        fragmentShader: `
            varying vec3 vNormal;
            uniform vec3 glowColor;
            void main() {
                float intensity = pow( 0.7 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 4.0 );
                gl_FragColor = vec4( glowColor, intensity );
            }
        `
    });
    const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    globeGroup.add(atmosphere);

    // ── Lights ──
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(5, 3, 5);
    scene.add(mainLight);

    // ── Seven Sisters Markers ──
    const states = [
        { name: 'Assam', lat: 26.2, lon: 92.9, color: 0xD4602A },
        { name: 'Meghalaya', lat: 25.4, lon: 91.3, color: 0x4A7FA5 },
        { name: 'Nagaland', lat: 26.1, lon: 94.5, color: 0xC0392B },
        { name: 'Manipur', lat: 24.6, lon: 93.9, color: 0x8E44AD },
        { name: 'Mizoram', lat: 23.1, lon: 92.9, color: 0x27AE60 },
        { name: 'Tripura', lat: 23.9, lon: 91.9, color: 0xE67E22 },
        { name: 'Arunachal', lat: 28.2, lon: 94.7, color: 0x2C3E50 }
    ];

    const hubs = [
        { name: 'Delhi', lat: 28.6, lon: 77.2 },
        { name: 'Mumbai', lat: 19.1, lon: 72.8 },
        { name: 'Kolkata', lat: 22.6, lon: 88.4 }
    ];

    function latLonToVector3(lat, lon, radius) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        return new THREE.Vector3(
            -(radius * Math.sin(phi) * Math.cos(theta)),
            radius * Math.cos(phi),
            radius * Math.sin(phi) * Math.sin(theta)
        );
    }

    const markers = new THREE.Group();
    const arcs = new THREE.Group();
    const hubArcs = new THREE.Group();
    globe.add(markers);
    globe.add(arcs);
    globe.add(hubArcs);

    states.forEach((state, i) => {
        const pos = latLonToVector3(state.lat, state.lon, 1.01);
        
        // Marker with Pulse
        const markerGroup = new THREE.Group();
        markerGroup.position.copy(pos);
        
        const core = new THREE.Mesh(
            new THREE.SphereGeometry(0.015, 16, 16),
            new THREE.MeshBasicMaterial({ color: state.color })
        );
        markerGroup.add(core);

        const ring = new THREE.Mesh(
            new THREE.RingGeometry(0.02, 0.025, 32),
            new THREE.MeshBasicMaterial({ color: state.color, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
        );
        ring.lookAt(pos.clone().multiplyScalar(1.1));
        markerGroup.add(ring);
        
        markers.add(markerGroup);
        state.mesh = markerGroup;
        state.ring = ring;
    });

    function createArc(start, end, color, opacity = 0.3, height = 1.2) {
        const mid = start.clone().lerp(end, 0.5);
        mid.normalize().multiplyScalar(height);
        
        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        const points = curve.getPoints(50);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
        const line = new THREE.Line(geometry, material);
        return line;
    }

    // Connectivity Automation: Add arcs from hubs to states
    function initConnectivity() {
        hubs.forEach(hub => {
            const hubPos = latLonToVector3(hub.lat, hub.lon, 1.01);
            states.forEach(state => {
                if (Math.random() > 0.7) { // Sparse connections for cleaner look
                    const statePos = latLonToVector3(state.lat, state.lon, 1.01);
                    const arc = createArc(hubPos, statePos, 0xffffff, 0.1, 1.3);
                    hubArcs.add(arc);
                }
            });
        });
    }
    initConnectivity();

    // ── Animation Loop ──
    let targetRotationX = 0;
    let targetRotationY = Math.PI * 1.35; 
    let mouseX = 0, mouseY = 0;
    let isFocusing = false;

    window.focusOnState = (stateName) => {
        const state = states.find(s => s.name.toLowerCase() === stateName.toLowerCase());
        if (!state) return;

        isFocusing = true;
        // Calculate Y rotation to bring longitude to front
        // Longitude 92.9 -> target rotation
        const lonRad = (state.lon + 180) * (Math.PI / 180);
        targetRotationY = -lonRad + Math.PI / 2;
        targetRotationX = (state.lat) * (Math.PI / 180);

        // Visual feedback
        states.forEach(s => {
            if (s.ring) s.ring.scale.set(1, 1, 1);
        });
        if (state.ring) state.ring.scale.set(3, 3, 3);
        
        setTimeout(() => { isFocusing = false; }, 2000);
    };

    window.addEventListener('mousemove', (e) => {
        if (isFocusing) return;
        mouseX = (e.clientX - width / 2) / (width / 2);
        mouseY = (e.clientY - height / 2) / (height / 2);
    });

    const animate = () => {
        requestAnimationFrame(animate);

        const time = Date.now() * 0.001;

        // Pulse Effect
        states.forEach(state => {
            if (state.ring) {
                const s = (isFocusing ? 1.5 : 1) + Math.sin(time * 4) * 0.5;
                state.ring.scale.set(s, s, s);
                state.ring.material.opacity = 0.5 - (Math.sin(time * 4) * 0.2);
            }
        });

        // Hub Arcs Animation (Subtle Pulse)
        hubArcs.children.forEach((arc, i) => {
            arc.material.opacity = 0.05 + Math.sin(time + i) * 0.05;
        });

        // Rotation & Smoothing
        if (!isFocusing) {
            targetRotationY += 0.001; // Slower auto-rotation
        }
        
        globeGroup.rotation.y += (targetRotationY + mouseX * 0.1 - globeGroup.rotation.y) * 0.05;
        globeGroup.rotation.x += (targetRotationX + mouseY * 0.05 - globeGroup.rotation.x) * 0.05;

        renderer.render(scene, camera);
    };

    animate();

    window.addEventListener('resize', () => {
        const w = canvas.parentElement.offsetWidth || window.innerWidth;
        const h = canvas.parentElement.offsetHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });
}

