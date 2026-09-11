/* SmartRoute — 3D Terrain View (Three.js) for NER Live Map */
function create3DScene(containerId, options) {
  options = options || {};
  const container = document.getElementById(containerId);
  if (!container || typeof THREE === 'undefined') return null;

  const width = container.clientWidth || 800;
  const height = container.clientHeight || 500;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030814);
  scene.fog = new THREE.FogExp2(0x030814, 0.0045);

  const camera = new THREE.PerspectiveCamera(45, width / Math.max(height, 1), 0.5, 2500);
  camera.position.set(0, 70, 110);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.shadowMap.enabled = true;
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0x406085, 1.15));
  const sun = new THREE.DirectionalLight(0x00d4ff, 1.6);
  sun.position.set(40, 80, 30);
  sun.castShadow = true;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xff9500, 0.7);
  rim.position.set(-50, 30, -40);
  scene.add(rim);

  const layers = {
    terrain: new THREE.Group(),
    roads: new THREE.Group(),
    vehicles: new THREE.Group(),
    incidents: new THREE.Group()
  };
  Object.values(layers).forEach(g => scene.add(g));

  // --- Terrain ---
  const terrainSize = 200;
  const segments = 96;
  const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);
  terrainGeo.rotateX(-Math.PI / 2);
  const pos = terrainGeo.attributes.position;
  const colors = [];
  const colLow = new THREE.Color(0x0a3d2a);
  const colMid = new THREE.Color(0x2d5a27);
  const colHigh = new THREE.Color(0x8aa07a);
  const colPeak = new THREE.Color(0xe8f0f8);

  function noise(x, z) {
    return Math.sin(x * 0.08) * Math.cos(z * 0.07) * 8 +
           Math.sin(x * 0.18 + 1.7) * Math.cos(z * 0.15) * 4 +
           Math.sin(x * 0.35) * Math.sin(z * 0.3) * 2;
  }

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    let h = noise(x, z);
    // Himalayan-style ridge in the north
    h += Math.max(0, (z + 40) * 0.35) + Math.pow(Math.max(0, (z + 20) / 60), 2) * 28;
    // Valley near center (Brahmaputra-like)
    const valley = Math.exp(-(x * x + (z - 10) * (z - 10)) / 900) * -12;
    h += valley;
    pos.setY(i, h);
    const t = Math.max(0, Math.min(1, (h + 5) / 45));
    const c = new THREE.Color();
    if (t < 0.35) c.copy(colLow).lerp(colMid, t / 0.35);
    else if (t < 0.7) c.copy(colMid).lerp(colHigh, (t - 0.35) / 0.35);
    else c.copy(colHigh).lerp(colPeak, (t - 0.7) / 0.3);
    colors.push(c.r, c.g, c.b);
  }
  terrainGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  terrainGeo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.92,
    metalness: 0.05,
    flatShading: false
  });
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  layers.terrain.add(terrainMesh);

  // Grid helper subtle
  const grid = new THREE.GridHelper(terrainSize, 40, 0x00d4ff, 0x0a2035);
  grid.position.y = 0.2;
  grid.material.opacity = 0.15;
  grid.material.transparent = true;
  layers.terrain.add(grid);

  // --- Roads as elevated tubes along terrain samples ---
  const roadDefs = [
    { color: 0x00ff88, pts: [[-60, -20], [-30, -5], [0, 5], [30, 12], [55, 25]] },
    { color: 0xff9500, pts: [[-40, 30], [-10, 20], [20, 5], [45, -15]] },
    { color: 0x00d4ff, pts: [[-50, 10], [-20, 15], [10, 25], [40, 40]] },
    { color: 0xff3b3b, pts: [[10, -30], [25, -10], [40, 10], [50, 35]] }
  ];

  function heightAt(x, z) {
    let h = noise(x, z);
    h += Math.max(0, (z + 40) * 0.35) + Math.pow(Math.max(0, (z + 20) / 60), 2) * 28;
    h += Math.exp(-(x * x + (z - 10) * (z - 10)) / 900) * -12;
    return h + 1.2;
  }

  roadDefs.forEach(rd => {
    const vectors = rd.pts.map(p => new THREE.Vector3(p[0], heightAt(p[0], p[1]), p[1]));
    const curve = new THREE.CatmullRomCurve3(vectors);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 48, 0.45, 6, false),
      new THREE.MeshStandardMaterial({ color: rd.color, emissive: rd.color, emissiveIntensity: 0.35, roughness: 0.4, metalness: 0.3 })
    );
    tube.castShadow = true;
    layers.roads.add(tube);
  });

  // --- Vehicles as small boxes moving on first road ---
  const vehicleMeshes = [];
  const vCurve = new THREE.CatmullRomCurve3(
    roadDefs[0].pts.map(p => new THREE.Vector3(p[0], heightAt(p[0], p[1]) + 0.8, p[1]))
  );
  for (let i = 0; i < 5; i++) {
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.7, 2.2),
      new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0x664400, emissiveIntensity: 0.4 })
    );
    layers.vehicles.add(body);
    vehicleMeshes.push({ mesh: body, t: i * 0.18, speed: 0.02 + i * 0.003 });
  }

  // Incident markers
  [[-20, 20], [30, -10], [15, 35]].forEach(p => {
    const marker = new THREE.Mesh(
      new THREE.ConeGeometry(1.2, 3, 6),
      new THREE.MeshStandardMaterial({ color: 0xff3b3b, emissive: 0xff0000, emissiveIntensity: 0.6 })
    );
    marker.position.set(p[0], heightAt(p[0], p[1]) + 2, p[1]);
    layers.incidents.add(marker);
  });

  // Orbit controls (manual)
  let isDown = false, prevX = 0, prevY = 0;
  const spherical = { radius: 130, theta: 0.6, phi: 0.9 };
  const target = new THREE.Vector3(0, 5, 0);

  function updateCamera() {
    camera.position.x = target.x + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
    camera.position.y = target.y + spherical.radius * Math.cos(spherical.phi);
    camera.position.z = target.z + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
    camera.lookAt(target);
  }
  updateCamera();

  const dom = renderer.domElement;
  dom.addEventListener('mousedown', e => { isDown = true; prevX = e.clientX; prevY = e.clientY; });
  window.addEventListener('mouseup', () => { isDown = false; });
  window.addEventListener('mousemove', e => {
    if (!isDown) return;
    const dx = e.clientX - prevX;
    const dy = e.clientY - prevY;
    prevX = e.clientX; prevY = e.clientY;
    spherical.theta -= dx * 0.005;
    spherical.phi = Math.max(0.2, Math.min(1.4, spherical.phi + dy * 0.005));
    updateCamera();
  });
  dom.addEventListener('wheel', e => {
    e.preventDefault();
    spherical.radius = Math.max(40, Math.min(280, spherical.radius + e.deltaY * 0.08));
    updateCamera();
  }, { passive: false });

  function onResize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  let reqId = 0;
  let autoRotate = options.autoRotate !== false;
  function animate() {
    reqId = requestAnimationFrame(animate);
    if (autoRotate && !isDown) {
      spherical.theta += 0.002;
      updateCamera();
    }
    vehicleMeshes.forEach(v => {
      v.t = (v.t + v.speed * 0.01) % 1;
      const p = vCurve.getPointAt(v.t);
      const p2 = vCurve.getPointAt((v.t + 0.01) % 1);
      v.mesh.position.copy(p);
      v.mesh.lookAt(p2);
    });
    renderer.render(scene, camera);
  }
  animate();

  return {
    scene, camera, renderer, layers,
    setLayerVisibility(name, vis) {
      if (layers[name]) layers[name].visible = !!vis;
    },
    setPreset() {},
    destroy() {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (dom.parentNode) dom.parentNode.removeChild(dom);
    }
  };
}

if (window.MapEngine) {
  window.MapEngine.create3DScene = create3DScene;
} else {
  window.MapEngine = { create3DScene: create3DScene };
}
