/* Compact 3D N splash + small main logo */
document.addEventListener('DOMContentLoaded', () => {
  if (window.MapEngine && MapEngine.initMap) {
    try { MapEngine.initMap('hero-map'); } catch (e) {}
  } else if (typeof L !== 'undefined') {
    const map = L.map('hero-map', { zoomControl: false, dragging: false, scrollWheelZoom: false }).setView([26.15, 92.80], 7);
    L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', { maxZoom: 18 }).addTo(map);
  }
  initSplashN();
  initMain3DNLogo();
});

function dismissSplash() {
  const splash = document.getElementById('splash-screen');
  if (!splash) return;
  splash.style.opacity = '0';
  splash.style.pointerEvents = 'none';
  setTimeout(() => { splash.style.display = 'none'; }, 600);
}
window.dismissSplash = dismissSplash;

function initSplashN() {
  const canvas = document.getElementById('splash-n-canvas');
  if (!canvas || typeof THREE === 'undefined') {
    setTimeout(dismissSplash, 800);
    return;
  }
  const size = Math.min(window.innerWidth * 0.38, 220);
  canvas.width = size; canvas.height = size;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0.3, 13);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(size, size);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;

  scene.add(new THREE.AmbientLight(0x0a1a2e, 2));
  const d1 = new THREE.DirectionalLight(0x00d4ff, 3.5); d1.position.set(5, 8, 6); scene.add(d1);
  const d2 = new THREE.DirectionalLight(0x00ff88, 2); d2.position.set(-6, -2, 4); scene.add(d2);

  const shape = new THREE.Shape();
  shape.moveTo(-2.2, -3.2); shape.lineTo(-2.2, 3.2); shape.lineTo(-0.8, 3.2);
  shape.lineTo(1.0, -0.6); shape.lineTo(1.0, 3.2); shape.lineTo(2.2, 3.2);
  shape.lineTo(2.2, -3.2); shape.lineTo(0.8, -3.2); shape.lineTo(-1.0, 0.6);
  shape.lineTo(-1.0, -3.2); shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.8, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 4 });
  geo.center();
  const mat = new THREE.MeshStandardMaterial({ color: 0x051829, emissive: new THREE.Color(0x003355), emissiveIntensity: 0.55, metalness: 0.85, roughness: 0.2 });
  const nMesh = new THREE.Mesh(geo, mat);
  scene.add(nMesh);
  nMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0x00d4ff })));

  const bead = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), new THREE.MeshBasicMaterial({ color: 0x00ffff }));
  scene.add(bead);

  const title = document.getElementById('splash-title');
  const sub = document.getElementById('splash-subtitle');
  const btn = document.getElementById('splash-enter-btn');
  [title, sub, btn].forEach(el => { if (el) { el.style.opacity = '0'; el.style.transition = 'opacity 0.8s ease'; } });

  let t0 = performance.now(), angle = 0;
  function animate(now) {
    requestAnimationFrame(animate);
    const elapsed = (now - t0) / 1000;
    const ease = Math.min(1, elapsed / 0.9);
    nMesh.scale.setScalar(0.25 + (1 - Math.pow(1 - ease, 3)) * 0.75);
    angle += 0.015;
    nMesh.rotation.y = angle;
    nMesh.rotation.x = Math.sin(elapsed * 0.5) * 0.12;
    const r = 3.5;
    bead.position.set(Math.cos(elapsed * 1.6) * r, Math.sin(elapsed * 2) * 1.0, Math.sin(elapsed * 1.6) * r);
    mat.emissiveIntensity = 0.45 + Math.sin(elapsed * 3) * 0.2;
    if (elapsed > 0.5 && title) title.style.opacity = '1';
    if (elapsed > 0.85 && sub) sub.style.opacity = '1';
    if (elapsed > 1.1 && btn) btn.style.opacity = '1';
    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);

  let dragging = false, lastX = 0;
  canvas.addEventListener('mousedown', e => { dragging = true; lastX = e.clientX; });
  window.addEventListener('mouseup', () => { dragging = false; });
  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    angle += (e.clientX - lastX) * 0.012;
    lastX = e.clientX;
  });
}

function initMain3DNLogo() {
  const container = document.getElementById('logo-canvas');
  if (!container || typeof THREE === 'undefined') return;
  const hint = container.querySelector('.logo-hint');
  const size = 96;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0.8, 12);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(size, size);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.insertBefore(renderer.domElement, hint || null);

  scene.add(new THREE.AmbientLight(0x00d4ff, 0.9));
  const pl = new THREE.PointLight(0x00ffff, 2, 28); pl.position.set(4, 6, 5); scene.add(pl);

  const shape = new THREE.Shape();
  shape.moveTo(-2.2, -3.2); shape.lineTo(-2.2, 3.2); shape.lineTo(-0.8, 3.2);
  shape.lineTo(1.0, -0.6); shape.lineTo(1.0, 3.2); shape.lineTo(2.2, 3.2);
  shape.lineTo(2.2, -3.2); shape.lineTo(0.8, -3.2); shape.lineTo(-1.0, 0.6);
  shape.lineTo(-1.0, -3.2); shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.75, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 3 });
  geo.center();
  const mat = new THREE.MeshStandardMaterial({ color: 0x051829, emissive: 0x002d4d, emissiveIntensity: 0.5, metalness: 0.88, roughness: 0.18 });
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);
  group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 24), new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.5 })));
  scene.add(group);

  let down = false, lx = 0, ly = 0, ty = 0, tx = 0;
  container.addEventListener('mousedown', e => { down = true; lx = e.clientX; ly = e.clientY; });
  window.addEventListener('mouseup', () => { down = false; });
  window.addEventListener('mousemove', e => {
    if (!down) return;
    ty += (e.clientX - lx) * 0.012;
    tx = THREE.MathUtils.clamp(tx + (e.clientY - ly) * 0.01, -0.5, 0.5);
    lx = e.clientX; ly = e.clientY;
  });

  function animate() {
    requestAnimationFrame(animate);
    if (!down) ty += 0.01;
    group.rotation.y += (ty - group.rotation.y) * 0.12;
    group.rotation.x += (tx - group.rotation.x) * 0.12;
    renderer.render(scene, camera);
  }
  animate();
}
