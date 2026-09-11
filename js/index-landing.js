
document.addEventListener('DOMContentLoaded', () => {
    // Background map / 3D scene
    if (window.MapEngine && MapEngine.create3DScene) {
        try {
            const scene3D = MapEngine.create3DScene('hero-map', { autoRotate: true });
        } catch (e) {
            if (MapEngine.initMap) MapEngine.initMap('hero-map');
        }
    } else if (window.MapEngine && MapEngine.initMap) {
        MapEngine.initMap('hero-map');
    } else if (typeof L !== 'undefined') {
        const map = L.map('hero-map', { zoomControl: false, dragging: false, scrollWheelZoom: false }).setView([26.15, 92.80], 7);
        L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', { maxZoom: 18 }).addTo(map);
    }

    // Interactive 3D N logo on main panel
    initMain3DNLogo();

    // Splash screen N entry animation
    initSplashN();
});

function dismissSplash() {
    const splash = document.getElementById('splash-screen');
    if (!splash) return;
    splash.style.opacity = '0';
    splash.style.pointerEvents = 'none';
    setTimeout(() => { splash.style.display = 'none'; }, 700);
}

function initSplashN() {
    const canvas = document.getElementById('splash-n-canvas');
    if (!canvas || typeof THREE === 'undefined') {
        setTimeout(dismissSplash, 1200);
        return;
    }

    const W = Math.min(window.innerWidth * 0.55, 420);
    const H = W;
    canvas.width = W;
    canvas.height = H;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0.4, 14);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;

    scene.add(new THREE.AmbientLight(0x0a1a2e, 2));
    const dirLight = new THREE.DirectionalLight(0x00d4ff, 4);
    dirLight.position.set(5, 8, 6);
    scene.add(dirLight);
    const rimLight = new THREE.DirectionalLight(0x00ff88, 2.5);
    rimLight.position.set(-6, -2, 4);
    scene.add(rimLight);
    const backLight = new THREE.DirectionalLight(0xffffff, 1.5);
    backLight.position.set(0, 4, -8);
    scene.add(backLight);

    // Extruded N shape
    const shape = new THREE.Shape();
    shape.moveTo(-2.2, -3.2);
    shape.lineTo(-2.2, 3.2);
    shape.lineTo(-0.8, 3.2);
    shape.lineTo(1.0, -0.6);
    shape.lineTo(1.0, 3.2);
    shape.lineTo(2.2, 3.2);
    shape.lineTo(2.2, -3.2);
    shape.lineTo(0.8, -3.2);
    shape.lineTo(-1.0, 0.6);
    shape.lineTo(-1.0, -3.2);
    shape.closePath();

    const extrudeSettings = { depth: 0.9, bevelEnabled: true, bevelThickness: 0.16, bevelSize: 0.12, bevelSegments: 6 };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();

    const mat = new THREE.MeshStandardMaterial({
        color: 0x051829,
        emissive: new THREE.Color(0x003355),
        emissiveIntensity: 0.6,
        metalness: 0.85,
        roughness: 0.2
    });
    const nMesh = new THREE.Mesh(geo, mat);
    scene.add(nMesh);

    const edges = new THREE.EdgesGeometry(geo);
    const wireMat = new THREE.LineBasicMaterial({ color: 0x00d4ff, linewidth: 1.5 });
    const wireframe = new THREE.LineSegments(edges, wireMat);
    nMesh.add(wireframe);

    // Energy bead around N
    const beadGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const beadMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const bead = new THREE.Mesh(beadGeo, beadMat);
    scene.add(bead);

    const title = document.getElementById('splash-title');
    const sub = document.getElementById('splash-subtitle');
    const btn = document.getElementById('splash-enter-btn');
    if (title) { title.style.opacity = '0'; title.style.transition = 'opacity 1s ease 0.6s'; }
    if (sub) { sub.style.opacity = '0'; sub.style.transition = 'opacity 1s ease 1s'; }
    if (btn) { btn.style.opacity = '0'; btn.style.transition = 'opacity 1s ease 1.4s'; }

    let t0 = performance.now();
    let angle = 0;

    function animate(now) {
        requestAnimationFrame(animate);
        const elapsed = (now - t0) / 1000;

        // Scale-in intro
        const scale = elapsed < 1.2 ? Math.min(1, elapsed / 1.2) : 1;
        const ease = 1 - Math.pow(1 - scale, 3);
        nMesh.scale.setScalar(0.2 + ease * 0.8);

        angle += 0.012;
        nMesh.rotation.y = angle;
        nMesh.rotation.x = Math.sin(elapsed * 0.5) * 0.15;

        // Orbiting bead
        const r = 3.8;
        bead.position.set(Math.cos(elapsed * 1.5) * r, Math.sin(elapsed * 2) * 1.2, Math.sin(elapsed * 1.5) * r);

        mat.emissiveIntensity = 0.5 + Math.sin(elapsed * 3) * 0.25;

        if (elapsed > 0.7 && title) title.style.opacity = '1';
        if (elapsed > 1.1 && sub) sub.style.opacity = '1';
        if (elapsed > 1.5 && btn) btn.style.opacity = '1';

        renderer.render(scene, camera);
    }
    requestAnimationFrame(animate);

    // Auto-dismiss after 5s if user doesn't click
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash && splash.style.display !== 'none' && splash.style.opacity !== '0') {
            // keep waiting for user — do not force dismiss
        }
    }, 5000);

    // Drag to rotate on splash canvas
    let dragging = false, lastX = 0;
    canvas.addEventListener('mousedown', (e) => { dragging = true; lastX = e.clientX; });
    window.addEventListener('mouseup', () => { dragging = false; });
    window.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        angle += (e.clientX - lastX) * 0.01;
        lastX = e.clientX;
    });
}

function initMain3DNLogo() {
    const container = document.getElementById('logo-canvas');
    if (!container || typeof THREE === 'undefined') return;

    // Clear hint temporarily for canvas
    const hint = container.querySelector('.logo-hint');
    const width = 180, height = 180;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 1.0, 13);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.insertBefore(renderer.domElement, hint || null);

    scene.add(new THREE.AmbientLight(0x00d4ff, 0.9));
    const topLight = new THREE.PointLight(0x00ffff, 2.5, 30);
    topLight.position.set(4, 7, 6);
    scene.add(topLight);
    const rimLight = new THREE.PointLight(0x00ff88, 1.8, 25);
    rimLight.position.set(-5, -4, 4);
    scene.add(rimLight);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    const shape = new THREE.Shape();
    shape.moveTo(-2.2, -3.2);
    shape.lineTo(-2.2, 3.2);
    shape.lineTo(-0.8, 3.2);
    shape.lineTo(1.0, -0.6);
    shape.lineTo(1.0, 3.2);
    shape.lineTo(2.2, 3.2);
    shape.lineTo(2.2, -3.2);
    shape.lineTo(0.8, -3.2);
    shape.lineTo(-1.0, 0.6);
    shape.lineTo(-1.0, -3.2);
    shape.closePath();

    const extrudeSettings = { depth: 0.9, bevelEnabled: true, bevelSegments: 3, steps: 2, bevelSize: 0.15, bevelThickness: 0.15 };
    const nGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    nGeo.center();

    const nMat = new THREE.MeshStandardMaterial({
        color: 0x051829, emissive: 0x002d4d, emissiveIntensity: 0.5, roughness: 0.18, metalness: 0.88
    });
    const nMesh = new THREE.Mesh(nGeo, nMat);
    rootGroup.add(nMesh);

    const edgeMat = new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.5 });
    const edgeLines = new THREE.LineSegments(new THREE.EdgesGeometry(nGeo, 24), edgeMat);
    nMesh.add(edgeLines);

    const perimeterPoints = [
        new THREE.Vector3(-2.2, 3.2, 0.5), new THREE.Vector3(-0.8, 3.2, 0.5),
        new THREE.Vector3(1.0, -0.6, 0.5), new THREE.Vector3(1.0, 3.2, 0.5),
        new THREE.Vector3(2.2, 3.2, 0.5), new THREE.Vector3(2.2, -3.2, 0.5),
        new THREE.Vector3(0.8, -3.2, 0.5), new THREE.Vector3(-1.0, 0.6, 0.5),
        new THREE.Vector3(-1.0, -3.2, 0.5), new THREE.Vector3(-2.2, -3.2, 0.5),
        new THREE.Vector3(-2.2, 3.2, 0.5)
    ];
    const energyCurve = new THREE.CatmullRomCurve3(perimeterPoints, true);
    const energyTube = new THREE.Mesh(
        new THREE.TubeGeometry(energyCurve, 60, 0.08, 6, true),
        new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.75 })
    );
    nMesh.add(energyTube);

    const energyBead = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    nMesh.add(energyBead);

    let isPointerDown = false, lastMouseX = 0, lastMouseY = 0;
    let targetRotY = 0, targetRotX = 0, rotVelocity = 0;

    container.addEventListener('mousedown', (e) => {
        isPointerDown = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    });
    window.addEventListener('mousemove', (e) => {
        if (!isPointerDown) return;
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        targetRotY += dx * 0.012;
        targetRotX = THREE.MathUtils.clamp(targetRotX + dy * 0.01, -0.6, 0.6);
        rotVelocity = Math.hypot(dx, dy) * 0.05;
    });
    window.addEventListener('mouseup', () => { isPointerDown = false; });

    const clock = new THREE.Clock();
    let travelProgress = 0;
    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        if (!isPointerDown) {
            targetRotY += 0.008;
            rotVelocity *= 0.94;
        }
        rootGroup.rotation.y += (targetRotY - rootGroup.rotation.y) * 0.15;
        rootGroup.rotation.x += (targetRotX - rootGroup.rotation.x) * 0.15;
        travelProgress = (travelProgress + delta * 0.35) % 1.0;
        energyBead.position.copy(energyCurve.getPointAt(travelProgress));
        nMat.emissiveIntensity = 0.45 + Math.min(rotVelocity * 1.6, 2.5);
        renderer.render(scene, camera);
    }
    animate();
}

// Expose for button onclick
window.dismissSplash = dismissSplash;
