/* ============================================================
   SMARTROUTE — MAP ENGINE (NER)
   Real road routing via OSRM (OpenStreetMap) + vehicle animation
   ============================================================ */

const MAP_CONFIG = {
  center: [25.80, 91.60],
  zoom: 7,
  minZoom: 5,
  maxZoom: 18,
  tileUrl: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
  tileAttr: '&copy; Google Maps Satellite | SmartRoute Emergency Command',
  osrmBase: 'https://router.project-osrm.org/route/v1/driving/'
};

/** City anchors used as route endpoints (lat, lng) */
const CITIES = {
  Siliguri: [26.7271, 88.3953],
  Guwahati: [26.1445, 91.7362],
  Shillong: [25.5788, 91.8933],
  Itanagar: [27.0844, 93.6053],
  Tezpur: [26.6338, 92.8000],
  Dibrugarh: [27.4728, 94.9120],
  Tinsukia: [27.4922, 95.3468],
  Kohima: [25.6751, 94.1086],
  Dimapur: [25.9063, 93.7279],
  Imphal: [24.8170, 93.9368],
  Silchar: [24.8333, 92.7789],
  Aizawl: [23.7271, 92.7176],
  Agartala: [23.8315, 91.2868],
  Gangtok: [27.3389, 88.6065],
  Tawang: [27.5860, 91.8590],
  Churachandpur: [24.3330, 93.6830]
};

/**
 * Route definitions: status colors match command-center legend
 * waypoints = ordered city keys — OSRM traces REAL roads between them
 */
const ROUTE_DEFS = [
  {
    id: 'SAFE-NH27', name: 'Safe — NH-27 Siliguri → Guwahati',
    status: 'accessible', color: '#00ff88', weight: 6,
    waypoints: ['Siliguri', 'Guwahati']
  },
  {
    id: 'SAFE-GS1', name: 'Safe — Guwahati → Shillong',
    status: 'accessible', color: '#00ff88', weight: 5,
    waypoints: ['Guwahati', 'Shillong']
  },
  {
    id: 'SAFE-NH8', name: 'Safe — Silchar → Agartala',
    status: 'accessible', color: '#00ff88', weight: 5,
    waypoints: ['Silchar', 'Agartala']
  },
  {
    id: 'MOD-AH1', name: 'Moderate — Guwahati → Dimapur → Kohima',
    status: 'partial', color: '#ff9500', weight: 5,
    waypoints: ['Guwahati', 'Dimapur', 'Kohima']
  },
  {
    id: 'MOD-IMP', name: 'Moderate — Kohima → Imphal',
    status: 'partial', color: '#ff9500', weight: 5,
    waypoints: ['Kohima', 'Imphal']
  },
  {
    id: 'MOD-TEZ', name: 'Moderate — Guwahati → Tezpur → Itanagar',
    status: 'partial', color: '#ff9500', weight: 4,
    waypoints: ['Guwahati', 'Tezpur', 'Itanagar']
  },
  {
    id: 'RISK-EAST', name: 'Disrupted — Itanagar → Dibrugarh → Tinsukia',
    status: 'blocked', color: '#ff3b3b', weight: 5,
    waypoints: ['Itanagar', 'Dibrugarh', 'Tinsukia']
  },
  {
    id: 'RISK-SIKKIM', name: 'Disrupted — Siliguri → Gangtok',
    status: 'blocked', color: '#ff3b3b', weight: 5,
    waypoints: ['Siliguri', 'Gangtok']
  },
  {
    id: 'RISK-NH2', name: 'Disrupted — Imphal → Churachandpur',
    status: 'blocked', color: '#ff3b3b', weight: 4,
    waypoints: ['Imphal', 'Churachandpur']
  }
];

const INCIDENT_DATA = [
  { id: 'INC-01', title: 'Landslide near Gangtok corridor', lat: 27.15, lng: 88.52, severity: 'critical' },
  { id: 'INC-02', title: 'Road disruption Itanagar sector', lat: 27.20, lng: 93.70, severity: 'critical' },
  { id: 'INC-03', title: 'Moderate risk Kohima–Imphal', lat: 25.35, lng: 94.05, severity: 'high' },
  { id: 'INC-04', title: 'Waterlogging Silchar approach', lat: 24.85, lng: 92.80, severity: 'medium' }
];

const VEHICLE_DEFS = [
  { id: 'V-01', name: 'Convoy Alpha', routeId: 'SAFE-NH27', progress: 0.15, color: '#00ff88', speed: 0.00035 },
  { id: 'V-02', name: 'Relief Truck 12', routeId: 'SAFE-GS1', progress: 0.40, color: '#00d4ff', speed: 0.00045 },
  { id: 'V-03', name: 'Medical Unit', routeId: 'SAFE-NH8', progress: 0.25, color: '#00ff88', speed: 0.00040 },
  { id: 'V-04', name: 'BRO Patrol', routeId: 'MOD-AH1', progress: 0.55, color: '#ff9500', speed: 0.00030 }
];

// Resolved route geometry cache: id -> [[lat,lng], ...]
const _routeCoords = {};
const _routeLayers = {};
const _vehicleMarkers = {};
let _animRunning = false;

function initMap(containerId, options) {
  options = options || {};
  const el = document.getElementById(containerId);
  if (!el || typeof L === 'undefined') return null;
  const map = L.map(containerId, {
    zoomControl: options.zoomControl !== false,
    attributionControl: true
  }).setView(options.center || MAP_CONFIG.center, options.zoom || MAP_CONFIG.zoom);
  L.tileLayer(MAP_CONFIG.tileUrl, {
    maxZoom: MAP_CONFIG.maxZoom,
    attribution: MAP_CONFIG.tileAttr
  }).addTo(map);
  MapEngine.map = map;
  return map;
}

/** OSRM expects lon,lat — returns [[lat,lng], ...] along real roads */
async function fetchOsrmCoords(waypointsLatLng) {
  if (!waypointsLatLng || waypointsLatLng.length < 2) return null;
  const path = waypointsLatLng.map(function (p) {
    return p[1].toFixed(5) + ',' + p[0].toFixed(5);
  }).join(';');
  const url = MAP_CONFIG.osrmBase + path + '?overview=full&geometries=geojson&steps=false';
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('OSRM HTTP ' + res.status);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes || !data.routes[0]) throw new Error('OSRM ' + (data.code || 'fail'));
    // geojson coordinates are [lon, lat]
    return data.routes[0].geometry.coordinates.map(function (c) {
      return [c[1], c[0]];
    });
  } catch (err) {
    console.warn('OSRM routing failed, using densified fallback', err);
    return densifyFallback(waypointsLatLng);
  }
}

/** Fallback densification if OSRM unavailable (still multi-point, not single straight line) */
function densifyFallback(waypoints) {
  const out = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i], b = waypoints[i + 1];
    const steps = 24;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
}

function cityPoint(name) {
  return CITIES[name] || null;
}

async function resolveRoute(def) {
  if (_routeCoords[def.id] && _routeCoords[def.id].length > 2) return _routeCoords[def.id];
  const pts = def.waypoints.map(cityPoint).filter(Boolean);
  if (pts.length < 2) return null;
  const coords = await fetchOsrmCoords(pts);
  if (coords && coords.length) {
    _routeCoords[def.id] = coords;
    return coords;
  }
  return null;
}

async function loadAllRoutes(map) {
  map = map || MapEngine.map;
  if (!map) return {};

  const loading = document.createElement('div');
  loading.id = 'sr-route-loading';
  loading.style.cssText = 'position:absolute;top:12px;left:50%;transform:translateX(-50%);z-index:800;background:rgba(5,12,28,0.92);border:1px solid rgba(0,212,255,0.35);color:#00d4ff;padding:8px 14px;border-radius:8px;font:600 12px Outfit,sans-serif;';
  loading.textContent = 'Calculating road routes (OSRM)…';
  const stage = map.getContainer().parentElement;
  if (stage) stage.appendChild(loading);

  for (let i = 0; i < ROUTE_DEFS.length; i++) {
    const def = ROUTE_DEFS[i];
    try {
      const coords = await resolveRoute(def);
      if (!coords || coords.length < 2) continue;
      const line = L.polyline(coords, {
        color: def.color,
        weight: def.weight || 5,
        opacity: 0.92,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
      line.bindPopup('<b>' + def.name + '</b><br>Status: ' + def.status + '<br>Points: ' + coords.length + ' (road geometry)');
      _routeLayers[def.id] = line;
      if (loading) loading.textContent = 'Routed ' + (i + 1) + '/' + ROUTE_DEFS.length + ' corridors…';
    } catch (e) {
      console.warn(def.id, e);
    }
  }

  if (loading) {
    loading.textContent = 'Road routes ready';
    setTimeout(function () { loading.remove(); }, 1200);
  }
  MapEngine.roadLayers = _routeLayers;
  return _routeLayers;
}

function addIncidents(map) {
  map = map || MapEngine.map;
  if (!map) return {};
  const markers = {};
  INCIDENT_DATA.forEach(function (inc) {
    const color = inc.severity === 'critical' ? '#ff3b3b' : (inc.severity === 'high' ? '#ff9500' : '#00d4ff');
    const icon = L.divIcon({
      className: '',
      html: '<div style="width:22px;height:22px;border-radius:50%;background:' + color + ';border:2px solid #fff;box-shadow:0 0 10px ' + color + ';display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#fff;">!</div>',
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });
    const m = L.marker([inc.lat, inc.lng], { icon: icon }).addTo(map);
    m.bindPopup('<b>' + inc.title + '</b><br>Severity: ' + inc.severity);
    markers[inc.id] = m;
  });
  MapEngine.incidentMarkers = markers;
  return markers;
}

function bearingDeg(a, b) {
  const lat1 = a[0] * Math.PI / 180, lat2 = b[0] * Math.PI / 180;
  const dLng = (b[1] - a[1]) * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function pointAlong(coords, t) {
  if (!coords || coords.length < 2) return null;
  t = Math.max(0, Math.min(0.9999, t));
  const f = t * (coords.length - 1);
  const i = Math.floor(f);
  const frac = f - i;
  const a = coords[i];
  const b = coords[Math.min(i + 1, coords.length - 1)];
  return {
    latlng: [a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac],
    bearing: bearingDeg(a, b)
  };
}

function vehicleIcon(color, bearing) {
  return L.divIcon({
    className: '',
    html: '<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;transform:rotate(' + (bearing || 0) + 'deg);">' +
      '<div style="width:16px;height:10px;background:' + color + ';border:2px solid #fff;border-radius:3px;box-shadow:0 0 8px ' + color + ';"></div></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
}

function addVehicles(map) {
  map = map || MapEngine.map;
  if (!map) return {};
  VEHICLE_DEFS.forEach(function (v) {
    const coords = _routeCoords[v.routeId];
    if (!coords || coords.length < 2) return;
    const pos = pointAlong(coords, v.progress);
    if (!pos) return;
    const m = L.marker(pos.latlng, { icon: vehicleIcon(v.color, pos.bearing) }).addTo(map);
    m.bindPopup('<b>' + v.name + '</b><br>Route: ' + v.routeId);
    _vehicleMarkers[v.id] = { marker: m, vehicle: v, coords: coords };
  });
  MapEngine.vehicleMarkers = _vehicleMarkers;
  return _vehicleMarkers;
}

function animateVehicles() {
  if (_animRunning) return;
  _animRunning = true;
  function tick() {
    Object.keys(_vehicleMarkers).forEach(function (id) {
      const entry = _vehicleMarkers[id];
      if (!entry || !entry.coords) return;
      entry.vehicle.progress += entry.vehicle.speed || 0.00035;
      if (entry.vehicle.progress >= 1) entry.vehicle.progress = 0;
      const pos = pointAlong(entry.coords, entry.vehicle.progress);
      if (!pos) return;
      entry.marker.setLatLng(pos.latlng);
      entry.marker.setIcon(vehicleIcon(entry.vehicle.color, pos.bearing));
    });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/** Public: load roads via OSRM then vehicles */
async function addRoads(map) {
  map = map || MapEngine.map;
  await loadAllRoutes(map);
  return _routeLayers;
}

function drawAlternateRoutes(map) {
  // Alternates already included as MOD-* routes with road geometry
  map = map || MapEngine.map;
  return Object.keys(_routeLayers).filter(function (id) {
    return id.indexOf('MOD') === 0 || id.indexOf('SAFE') === 0;
  }).map(function (id) { return _routeLayers[id]; });
}

async function bootstrapMap(containerId) {
  const map = initMap(containerId);
  if (!map) return null;
  await loadAllRoutes(map);
  addIncidents(map);
  addVehicles(map);
  animateVehicles();
  setTimeout(function () { map.invalidateSize(); }, 200);
  return map;
}

const MapEngine = {
  map: null,
  roadLayers: {},
  incidentMarkers: {},
  vehicleMarkers: {},
  initMap: initMap,
  addRoads: addRoads,
  loadAllRoutes: loadAllRoutes,
  addIncidents: addIncidents,
  addVehicles: addVehicles,
  animateVehicles: animateVehicles,
  drawAlternateRoutes: drawAlternateRoutes,
  bootstrapMap: bootstrapMap,
  resolveRoute: resolveRoute,
  fetchOsrmCoords: fetchOsrmCoords,
  ROUTE_DEFS: ROUTE_DEFS,
  ROAD_DATA: ROUTE_DEFS,
  INCIDENT_DATA: INCIDENT_DATA,
  VEHICLE_DATA: VEHICLE_DEFS,
  CITIES: CITIES,
  MAP_CONFIG: MAP_CONFIG,
  getRouteCoords: function (id) { return _routeCoords[id]; }
};

window.MapEngine = MapEngine;
