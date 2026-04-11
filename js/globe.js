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
    const atmosphereGeo = new THREE.SphereGeometry(1.2, 64, 64);
    const atmosphereMat = new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.BackSide,
        uniforms: {
            glowColor: { value: new THREE.Color(0x4CAF7D) },
            viewVector: { value: camera.position }
        },
        vertexShader: `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize( normalMatrix * normal );
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }
        `,
        fragmentShader: `
            varying vec3 vNormal;
            uniform vec3 glowColor;
            void main() {
                float intensity = pow( 0.6 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 3.0 );
                gl_FragColor = vec4( glowColor, intensity );
            }
        `
    });
    const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    globeGroup.add(atmosphere);

    // ── Lights ──
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
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
    states.forEach(state => {
        const pos = latLonToVector3(state.lat, state.lon, 1.01);
        const marker = new THREE.Mesh(
            new THREE.SphereGeometry(0.02, 16, 16),
            new THREE.MeshBasicMaterial({ color: state.color })
        );
        marker.position.copy(pos);
        markers.add(marker);
        
        // Add label or hover effect if desired
    });
    globe.add(markers);

    // ── Animation Loop ──
    let targetRotationX = 0;
    let targetRotationY = Math.PI * 1.3; // Center on India
    let mouseX = 0, mouseY = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX - width / 2) / (width / 2);
        mouseY = (e.clientY - height / 2) / (height / 2);
    });

    const animate = () => {
        requestAnimationFrame(animate);

        // Auto Rotation
        targetRotationY += 0.001;

        // Smooth Mouse Follow
        globeGroup.rotation.y += (targetRotationY + mouseX * 0.2 - globeGroup.rotation.y) * 0.05;
        globeGroup.rotation.x += (mouseY * 0.2 - globeGroup.rotation.x) * 0.05;

        renderer.render(scene, camera);
    };

    animate();

    // Responsive
    window.addEventListener('resize', () => {
        const w = canvas.offsetWidth || window.innerWidth;
        const h = canvas.offsetHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });
}
