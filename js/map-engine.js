/* ============================================================
   SMARTROUTE — MAP ENGINE (NER)
   Curved multi-point roads, alternate routes, vehicle animation
   ============================================================ */

const MAP_CONFIG = {
  center: [25.60, 91.20],
  zoom: 7,
  minZoom: 5,
  maxZoom: 18,
  tileUrl: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
  darkTileUrl: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  tileAttr: '&copy; Google Maps Satellite | SmartRoute Emergency Command',
};

const ROAD_DATA = [
  { id: 'AH-1', name: 'AH-1 Siliguri–Guwahati–Kohima–Imphal', status: 'partial', risk: 'high',
    coords: [[26.72,88.42],[26.55,89.20],[26.45,90.10],[26.30,90.90],[26.14,91.73],[26.25,92.30],[26.35,92.68],[25.90,93.72],[25.67,94.10],[25.20,94.00],[24.81,93.93]],
    cause: 'Heavy Rain & Mountain Traffic' },
  { id: 'NH-27', name: 'NH-27 East-West Expressway', status: 'accessible', risk: 'low',
    coords: [[26.72,88.42],[26.60,89.10],[26.50,89.80],[26.44,91.00],[26.44,91.43],[26.14,91.73],[26.25,92.20],[26.35,92.68]],
    cause: null },
  { id: 'NH-13', name: 'NH-13 Trans-Arunachal (Tawang–Itanagar)', status: 'blocked', risk: 'critical',
    coords: [[27.58,91.86],[27.45,92.10],[27.26,92.41],[27.15,93.00],[27.10,93.60],[27.50,94.20],[27.90,94.80]],
    cause: 'Major Landslide & Rockfall' },
  { id: 'NH-2', name: 'NH-2 Kohima–Imphal–Churachandpur', status: 'blocked', risk: 'critical',
    coords: [[25.67,94.10],[25.50,94.05],[25.27,94.01],[25.00,93.95],[24.81,93.93],[24.55,93.80],[24.33,93.68]],
    cause: 'Slope Failure & Mudflow' },
  { id: 'NH-8', name: 'NH-8 Tripura Lifeline', status: 'accessible', risk: 'low',
    coords: [[24.86,92.35],[24.50,92.15],[24.20,92.00],[24.00,91.60],[23.83,91.28],[23.40,91.40],[23.10,91.50]],
    cause: null },
  { id: 'NH-306', name: 'NH-306 Silchar–Aizawl', status: 'partial', risk: 'moderate',
    coords: [[24.82,92.79],[24.50,92.75],[24.22,92.68],[24.00,92.70],[23.73,92.71]],
    cause: 'Waterlogging' },
  { id: 'NH-10', name: 'NH-10 Sikkim Lifeline', status: 'blocked', risk: 'critical',
    coords: [[26.72,88.42],[26.90,88.45],[27.06,88.47],[27.12,88.50],[27.18,88.53],[27.25,88.57],[27.33,88.61]],
    cause: 'Teesta River Flash Erosion' },
  { id: 'GS-1', name: 'GS-1 Guwahati–Shillong Expressway', status: 'accessible', risk: 'moderate',
    coords: [[26.14,91.73],[26.05,91.78],[25.95,91.85],[25.90,91.88],[25.75,91.90],[25.57,91.89]],
    cause: null }
];

const INCIDENT_DATA = [
  { id: 'INC-NE01', type: 'landslide', lat: 27.58, lng: 91.86, title: 'Landslide — Tawang Sector KM 62', severity: 'critical', time: '07:45', road: 'NH-13' },
  { id: 'INC-NE02', type: 'flood', lat: 26.15, lng: 91.75, title: 'Brahmaputra Flood Surge — Guwahati', severity: 'high', time: '08:20', road: 'AH-1' },
  { id: 'INC-NE03', type: 'landslide', lat: 25.67, lng: 94.10, title: 'Mountain Slope Slide — Kohima Pass', severity: 'critical', time: '09:10', road: 'NH-2' },
  { id: 'INC-NE04', type: 'flood', lat: 27.33, lng: 88.61, title: 'Teesta Flash Flood — Gangtok', severity: 'high', time: '06:30', road: 'NH-10' },
  { id: 'INC-NE05', type: 'damage', lat: 25.57, lng: 91.89, title: 'Waterlogging — Shillong', severity: 'medium', time: '10:15', road: 'GS-1' },
  { id: 'INC-NE06', type: 'damage', lat: 23.73, lng: 92.71, title: 'Culvert Settlement — Aizawl', severity: 'medium', time: '11:00', road: 'NH-306' }
];

const VEHICLE_DATA = [
  { id: 'VH-NE01', type: '🚑', name: 'MED-Convoy-NE1', cargo: 'Medicines & Blood', lat: 26.14, lng: 91.73, status: 'on-route', speed: 52, dest: 'Imphal Hospital', eta: '14:30', roadId: 'AH-1' },
  { id: 'VH-NE02', type: '🚚', name: 'FOOD-Truck-NE2', cargo: 'Relief Grain', lat: 26.72, lng: 88.42, status: 'delayed', speed: 36, dest: 'Gangtok Hub', eta: '17:15', roadId: 'NH-10' },
  { id: 'VH-NE03', type: '🚒', name: 'RESP-NDRF-NE3', cargo: 'NDRF Gear', lat: 25.57, lng: 91.89, status: 'on-route', speed: 58, dest: 'Cherrapunji', eta: '13:50', roadId: 'GS-1' },
  { id: 'VH-NE04', type: '🚛', name: 'CON-Rescue-NE4', cargo: 'Bailey Girders', lat: 24.82, lng: 92.79, status: 'on-route', speed: 48, dest: 'Agartala', eta: '18:00', roadId: 'NH-8' },
  { id: 'VH-NE05', type: '🚜', name: 'ENG-Dozer-NE5', cargo: 'Road Clearer', lat: 25.67, lng: 94.10, status: 'blocked', speed: 0, dest: 'Kohima Pass', eta: 'DELAYED', roadId: 'NH-2' },
  { id: 'VH-NE06', type: '🚛', name: 'FUEL-Tanker-NE6', cargo: 'Generator Fuel', lat: 23.83, lng: 91.28, status: 'on-route', speed: 50, dest: 'Silchar', eta: '16:00', roadId: 'NH-8' }
];

const ALT_ROUTE_DATA = [
  { id: 'ALT-A', name: 'Route A — GS-1 Guwahati–Shillong', color: '#00ff88', weight: 5,
    coords: [[26.14,91.73],[26.08,91.76],[26.00,91.82],[25.92,91.87],[25.80,91.90],[25.70,91.90],[25.57,91.89]] },
  { id: 'ALT-B', name: 'Route B — NH-306 Silchar–Aizawl', color: '#ff9500', weight: 4,
    coords: [[24.82,92.79],[24.60,92.76],[24.40,92.72],[24.20,92.68],[24.00,92.70],[23.85,92.71],[23.73,92.71]] },
  { id: 'ALT-C', name: 'Route C — AH-1 Guwahati–Imphal', color: '#ff3b3b', weight: 4,
    coords: [[26.14,91.73],[26.20,92.20],[26.30,92.60],[26.00,93.20],[25.90,93.72],[25.67,94.10],[25.20,94.00],[24.81,93.93]] }
];

const ROAD_STYLE = {
  accessible: { color: '#00ff88', weight: 4, opacity: 0.9, dashArray: null },
  partial:    { color: '#ffcc00', weight: 4, opacity: 0.9, dashArray: '10,5' },
  high:       { color: '#ff9500', weight: 4, opacity: 0.9, dashArray: null },
  blocked:    { color: '#ff3b3b', weight: 5, opacity: 1,   dashArray: '8,4' },
};

function makeVehicleIcon(vehicle) {
  const color = vehicle.status === 'on-route' ? '#00ff88' : vehicle.status === 'delayed' ? '#ff9500' : vehicle.status === 'blocked' ? '#ff3b3b' : '#00d4ff';
  return L.divIcon({
    className: '',
    html: `<div style="width:32px;height:32px;border-radius:6px;background:rgba(0,0,0,0.75);border:2px solid ${color};display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 0 12px ${color}88;">${vehicle.type}</div>`,
    iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -18]
  });
}

function makeIncidentIcon(incident) {
  const color = incident.severity === 'critical' ? '#ff3b3b' : incident.severity === 'high' ? '#ff9500' : '#00d4ff';
  const emoji = incident.type === 'flood' ? '🌊' : incident.type === 'landslide' ? '⛰' : '🚧';
  return L.divIcon({
    className: '',
    html: `<div style="width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,0.6);border:2px solid ${color};display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 0 14px ${color}66;">${emoji}</div>`,
    iconSize: [36, 36], iconAnchor: [18, 18]
  });
}

function initMap(containerId, options = {}) {
  const el = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!el || typeof L === 'undefined') return null;
  const center = options.center || MAP_CONFIG.center;
  const zoom = options.zoom != null ? options.zoom : MAP_CONFIG.zoom;
  const map = L.map(el, { zoomControl: options.zoomControl !== false, attributionControl: true }).setView(center, zoom);
  L.tileLayer(MAP_CONFIG.tileUrl, { maxZoom: MAP_CONFIG.maxZoom, attribution: MAP_CONFIG.tileAttr }).addTo(map);
  MapEngine.map = map;
  return map;
}

function addRoads(map, roads, onClick) {
  map = map || MapEngine.map;
  if (!map) return {};
  const layers = {};
  (roads || ROAD_DATA).forEach(road => {
    if (!road.coords || road.coords.length < 2) return;
    const style = ROAD_STYLE[road.status] || ROAD_STYLE.partial;
    const line = L.polyline(road.coords, { ...style, lineCap: 'round', lineJoin: 'round' }).addTo(map);
    line.bindPopup(`<b>${road.name}</b><br>Status: ${road.status}${road.cause ? '<br>' + road.cause : ''}`);
    if (onClick) line.on('click', () => onClick(road));
    layers[road.id] = line;
  });
  MapEngine.roadLayers = layers;
  return layers;
}

function addIncidents(map, incidents, onClick) {
  map = map || MapEngine.map;
  if (!map) return {};
  const markers = {};
  (incidents || INCIDENT_DATA).forEach(inc => {
    const m = L.marker([inc.lat, inc.lng], { icon: makeIncidentIcon(inc) }).addTo(map);
    m.bindPopup(`<b>${inc.title}</b><br>${inc.road || ''} · ${inc.time || ''}`);
    if (onClick) m.on('click', () => onClick(inc));
    markers[inc.id] = m;
  });
  MapEngine.incidentMarkers = markers;
  return markers;
}

function addVehicles(map, vehicles, onClick) {
  map = map || MapEngine.map;
  if (!map) return {};
  const markers = {};
  (vehicles || VEHICLE_DATA).forEach(v => {
    const m = L.marker([v.lat, v.lng], { icon: makeVehicleIcon(v) }).addTo(map);
    m.bindPopup(`<b>${v.name}</b><br>${v.cargo}<br>${v.status} · ${v.speed} km/h · ETA ${v.eta}`);
    if (onClick) m.on('click', () => onClick(v));
    markers[v.id] = m;
  });
  MapEngine.vehicleMarkers = markers;
  return markers;
}

function _calcDistKm(from, to) {
  const R = 6371;
  const dLat = (to[0] - from[0]) * Math.PI / 180;
  const dLng = (to[1] - from[1]) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(from[0] * Math.PI / 180) * Math.cos(to[0] * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function animateVehicles(map, vehicleMarkers) {
  map = map || MapEngine.map;
  vehicleMarkers = vehicleMarkers || MapEngine.vehicleMarkers;
  if (!map || !vehicleMarkers) return;
  const animStates = {};
  Object.entries(vehicleMarkers).forEach(([id, marker], idx) => {
    const vData = VEHICLE_DATA.find(v => v.id === id) || { id, speed: 45 };
    if (vData.status === 'blocked') return;
    let assignedRoad = ROAD_DATA.find(r => r.id === vData.roadId);
    if (!assignedRoad || !assignedRoad.coords || assignedRoad.coords.length < 2) assignedRoad = ROAD_DATA[idx % ROAD_DATA.length];
    if (!assignedRoad) return;
    const coords = assignedRoad.coords;
    const curPos = marker.getLatLng();
    let bestIdx = 0, minD = Infinity;
    coords.forEach((pt, pIdx) => {
      const d = Math.hypot(pt[0] - curPos.lat, pt[1] - curPos.lng);
      if (d < minD) { minD = d; bestIdx = pIdx; }
    });
    animStates[id] = { coords, index: bestIdx, progress: 0, direction: 1, speed: vData.speed || 45 };
  });
  let lastTime = performance.now();
  function step(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.08);
    lastTime = now;
    Object.entries(vehicleMarkers).forEach(([id, marker]) => {
      const state = animStates[id];
      if (!state) return;
      const coords = state.coords;
      const nextIdx = state.index + state.direction;
      if (nextIdx < 0 || nextIdx >= coords.length) { state.direction *= -1; state.progress = 0; return; }
      const from = coords[state.index], to = coords[nextIdx];
      const segKm = _calcDistKm(from, to);
      const fracPerSec = segKm > 0.0001 ? (state.speed / 3600) / segKm : 1;
      state.progress += fracPerSec * dt * 3.5;
      while (state.progress >= 1.0) {
        state.progress -= 1.0;
        state.index += state.direction;
        if (state.index + state.direction < 0 || state.index + state.direction >= coords.length) {
          state.direction *= -1; state.progress = 0; break;
        }
      }
      const pFrom = coords[state.index];
      const pTo = coords[Math.min(Math.max(0, state.index + state.direction), coords.length - 1)];
      const lat = pFrom[0] + (pTo[0] - pFrom[0]) * state.progress;
      const lng = pFrom[1] + (pTo[1] - pFrom[1]) * state.progress;
      marker.setLatLng([lat, lng]);
    });
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function drawAlternateRoutes(map) {
  map = map || MapEngine.map;
  if (!map) return [];
  return ALT_ROUTE_DATA.map(route => {
    const line = L.polyline(route.coords, {
      color: route.color, weight: route.weight || 4, opacity: 0.85,
      dashArray: route.id === 'ALT-A' ? null : '8,6', lineCap: 'round', lineJoin: 'round'
    }).addTo(map);
    line.bindPopup(`<b>${route.name}</b>`);
    return line;
  });
}

function addFloodZone(map, center, radiusDeg) {
  map = map || MapEngine.map;
  if (!map) return null;
  center = center || [26.15, 91.75];
  return L.circle(center, {
    radius: (radiusDeg || 0.12) * 111000,
    color: '#4facfe', fillColor: '#4facfe', fillOpacity: 0.15, weight: 1
  }).addTo(map);
}

const MapEngine = {
  map: null, roadLayers: {}, incidentMarkers: {}, vehicleMarkers: {},
  initMap, addRoads, addIncidents, addVehicles, animateVehicles, drawAlternateRoutes, addFloodZone,
  ROAD_DATA, INCIDENT_DATA, VEHICLE_DATA, ALT_ROUTE_DATA, MAP_CONFIG
};

window.MapEngine = MapEngine;
