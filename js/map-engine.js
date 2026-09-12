/* ============================================================
   SMARTROUTE — MAP ENGINE (NER)
   Curved multi-point roads, safest & alternate routes, vehicles
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

const ALT_ROUTE_DATA = [
  { id: 'SAFE-GS1', name: 'Safest — GS-1 Guwahati → Shillong Expressway', color: '#00ff88', weight: 6, kind: 'safest',
    coords: [[26.14,91.73],[26.10,91.75],[26.05,91.78],[26.00,91.82],[25.95,91.85],[25.90,91.88],[25.85,91.89],[25.80,91.90],[25.72,91.90],[25.65,91.90],[25.57,91.89]] },
  { id: 'SAFE-NH27', name: 'Safest — NH-27 East-West (Siliguri → Guwahati)', color: '#00ff88', weight: 5, kind: 'safest',
    coords: [[26.72,88.42],[26.65,88.80],[26.58,89.20],[26.52,89.60],[26.48,90.00],[26.45,90.40],[26.44,90.90],[26.44,91.30],[26.30,91.55],[26.14,91.73]] },
  { id: 'ALT-NH306', name: 'Alternate — NH-306 Silchar → Aizawl detour', color: '#00d4ff', weight: 4, kind: 'alternate',
    coords: [[24.82,92.79],[24.70,92.77],[24.55,92.75],[24.40,92.72],[24.28,92.70],[24.15,92.68],[24.00,92.70],[23.90,92.71],[23.80,92.71],[23.73,92.71]] },
  { id: 'ALT-AH1', name: 'Alternate — AH-1 Guwahati → Imphal via Dimapur', color: '#ff9500', weight: 4, kind: 'alternate',
    coords: [[26.14,91.73],[26.18,92.00],[26.25,92.30],[26.32,92.55],[26.35,92.68],[26.20,93.10],[26.00,93.40],[25.90,93.72],[25.75,93.95],[25.67,94.10],[25.40,94.05],[25.10,94.00],[24.81,93.93]] },
  { id: 'ALT-NH8', name: 'Alternate — NH-8 Tripura lifeline (Silchar → Agartala)', color: '#00d4ff', weight: 4, kind: 'alternate',
    coords: [[24.82,92.79],[24.70,92.55],[24.55,92.30],[24.40,92.10],[24.20,91.90],[24.00,91.60],[23.90,91.40],[23.83,91.28],[23.60,91.35],[23.40,91.40],[23.20,91.45],[23.10,91.50]] }
];

const INCIDENT_DATA = [
  { id: 'INC-01', title: 'Landslide NH-13', lat: 27.26, lng: 92.41, severity: 'critical' },
  { id: 'INC-02', title: 'Mudflow NH-2', lat: 25.00, lng: 93.95, severity: 'high' },
  { id: 'INC-03', title: 'Teesta Erosion NH-10', lat: 27.12, lng: 88.50, severity: 'critical' },
  { id: 'INC-04', title: 'Waterlogging NH-306', lat: 24.22, lng: 92.68, severity: 'medium' }
];

const VEHICLE_DATA = [
  { id: 'V-01', name: 'Convoy Alpha', routeId: 'GS-1', progress: 0.2, color: '#00ff88' },
  { id: 'V-02', name: 'Relief Truck 12', routeId: 'NH-27', progress: 0.45, color: '#00d4ff' },
  { id: 'V-03', name: 'Medical Unit', routeId: 'NH-8', progress: 0.6, color: '#ffcc00' },
  { id: 'V-04', name: 'BRO Patrol', routeId: 'AH-1', progress: 0.3, color: '#ff9500' }
];

const ROAD_STYLE = {
  accessible: { color: '#00ff88', weight: 5, opacity: 0.85 },
  partial: { color: '#ff9500', weight: 4, opacity: 0.85 },
  blocked: { color: '#ff3b3b', weight: 5, opacity: 0.9 },
  delayed: { color: '#b050ff', weight: 4, opacity: 0.8 }
};

function initMap(containerId, options) {
  options = options || {};
  const el = document.getElementById(containerId);
  if (!el || typeof L === 'undefined') return null;
  const map = L.map(containerId, {
    zoomControl: options.zoomControl !== false,
    attributionControl: true
  }).setView(MAP_CONFIG.center, MAP_CONFIG.zoom);
  L.tileLayer(MAP_CONFIG.tileUrl, {
    maxZoom: MAP_CONFIG.maxZoom,
    attribution: MAP_CONFIG.tileAttr
  }).addTo(map);
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
    line.bindPopup('<b>' + road.name + '</b><br>Status: ' + road.status + (road.cause ? '<br>' + road.cause : ''));
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
    const color = inc.severity === 'critical' ? '#ff3b3b' : (inc.severity === 'high' ? '#ff9500' : '#00d4ff');
    const m = L.circleMarker([inc.lat, inc.lng], {
      radius: 8, color: color, fillColor: color, fillOpacity: 0.85, weight: 2
    }).addTo(map);
    m.bindPopup('<b>' + inc.title + '</b><br>Severity: ' + inc.severity);
    if (onClick) m.on('click', () => onClick(inc));
    markers[inc.id] = m;
  });
  MapEngine.incidentMarkers = markers;
  return markers;
}

function addVehicles(map) {
  map = map || MapEngine.map;
  if (!map) return {};
  const markers = {};
  const roadIndex = {};
  ROAD_DATA.forEach(r => { roadIndex[r.id] = r; });
  VEHICLE_DATA.forEach(v => {
    const road = roadIndex[v.routeId];
    if (!road || !road.coords || road.coords.length < 2) return;
    const idx = Math.min(road.coords.length - 1, Math.floor(v.progress * (road.coords.length - 1)));
    const pt = road.coords[idx];
    const icon = L.divIcon({
      className: '',
      html: '<div style="width:14px;height:14px;border-radius:4px;background:' + v.color + ';border:2px solid #fff;box-shadow:0 0 8px ' + v.color + ';"></div>',
      iconSize: [14, 14], iconAnchor: [7, 7]
    });
    const m = L.marker(pt, { icon: icon }).addTo(map);
    m.bindPopup('<b>' + v.name + '</b><br>Route: ' + v.routeId);
    markers[v.id] = { marker: m, vehicle: v, road: road };
  });
  MapEngine.vehicleMarkers = markers;
  return markers;
}

function animateVehicles() {
  const markers = MapEngine.vehicleMarkers || {};
  Object.keys(markers).forEach(id => {
    const entry = markers[id];
    if (!entry || !entry.road) return;
    setInterval(() => {
      entry.vehicle.progress = (entry.vehicle.progress + 0.005) % 1;
      const coords = entry.road.coords;
      const f = entry.vehicle.progress * (coords.length - 1);
      const i = Math.floor(f);
      const t = f - i;
      const a = coords[i];
      const b = coords[Math.min(i + 1, coords.length - 1)];
      const lat = a[0] + (b[0] - a[0]) * t;
      const lng = a[1] + (b[1] - a[1]) * t;
      entry.marker.setLatLng([lat, lng]);
    }, 400);
  });
}

function drawAlternateRoutes(map) {
  map = map || MapEngine.map;
  if (!map) return [];
  return ALT_ROUTE_DATA.map(route => {
    const isSafe = route.kind === 'safest' || (route.color === '#00ff88');
    const line = L.polyline(route.coords, {
      color: route.color,
      weight: route.weight || (isSafe ? 6 : 4),
      opacity: 0.9,
      dashArray: isSafe ? null : '10,7',
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);
    line.bindPopup('<b>' + route.name + '</b><br>' + (isSafe ? 'Safest corridor — preferred for relief convoys' : 'Alternate detour — use when primary is disrupted'));
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
