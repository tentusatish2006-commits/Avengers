/* ============================================================
   SMARTROUTE — MAP ENGINE
   Shared Leaflet map initialization + helper utilities
   Centre: North-Eastern Region (Assam, Meghalaya, Arunachal Pradesh, Sikkim, Nagaland, Manipur, Mizoram, Tripura)
   Matching Satellite Topography View
   ============================================================ */

const MAP_CONFIG = {
  center: [25.60, 91.20],   // Centred on Meghalaya-Assam matching satellite photo frame
  zoom: 7,
  minZoom: 5,
  maxZoom: 18,
  tileUrl: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', // Google Satellite Hybrid with labels matching photo
  darkTileUrl: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  tileAttr: '&copy; Google Maps Satellite | SmartRoute Emergency Command',
};

/* ── North-Eastern Region Road Network (Matching Uploaded Satellite Photo) ── */
const ROAD_DATA = [
  {
    id: 'AH-1', name: 'AH-1 (Asian Highway: Siliguri–Guwahati–Kohima–Imphal)',
    status: 'partial', risk: 'high',
    coords: [[26.72, 88.42], [26.45, 90.10], [26.14, 91.73], [26.35, 92.68], [25.90, 93.72], [25.67, 94.10], [24.81, 93.93]],
    cause: 'Heavy Rain & Mountain Traffic'
  },
  {
    id: 'NH-27', name: 'NH-27 East-West Expressway (Siliguri–Nalbari–Guwahati)',
    status: 'accessible', risk: 'low',
    coords: [[26.72, 88.42], [26.50, 89.80], [26.44, 91.43], [26.14, 91.73], [26.35, 92.68]],
    cause: null
  },
  {
    id: 'NH-13', name: 'NH-13 Trans-Arunachal Highway (Tawang–Bomdila–Itanagar)',
    status: 'blocked', risk: 'critical',
    coords: [[27.58, 91.86], [27.26, 92.41], [27.10, 93.60], [27.90, 94.80]],
    cause: 'Major Landslide & Rockfall'
  },
  {
    id: 'NH-2', name: 'NH-2 (Kohima–Senapati–Imphal–Churachandpur)',
    status: 'blocked', risk: 'critical',
    coords: [[25.67, 94.10], [25.27, 94.01], [24.81, 93.93], [24.33, 93.68]],
    cause: 'Slope Failure & Mudflow'
  },
  {
    id: 'NH-8', name: 'NH-8 Tripura Lifeline (Karimganj–Agartala–Sabroom)',
    status: 'accessible', risk: 'low',
    coords: [[24.86, 92.35], [24.20, 92.00], [23.83, 91.28], [23.10, 91.50]],
    cause: null
  },
  {
    id: 'NH-306', name: 'NH-306 Mizoram Gateway (Silchar–Kolasib–Aizawl)',
    status: 'partial', risk: 'moderate',
    coords: [[24.82, 92.79], [24.22, 92.68], [23.73, 92.71]],
    cause: 'Waterlogging'
  },
  {
    id: 'NH-10', name: 'NH-10 Sikkim Lifeline (Siliguri–Rangpo–Gangtok)',
    status: 'blocked', risk: 'critical',
    coords: [[26.72, 88.42], [27.06, 88.47], [27.18, 88.53], [27.33, 88.61]],
    cause: 'Teesta River Flash Erosion'
  },
  {
    id: 'GS-1', name: 'GS-1 Guwahati–Shillong Expressway (Guwahati–Nongpoh–Shillong)',
    status: 'accessible', risk: 'moderate',
    coords: [[26.14, 91.73], [25.90, 91.88], [25.57, 91.89]],
    cause: null
  },
  {
    id: 'SH-39', name: 'SH-39 (Narsipatnam–Paderu)',
    status: 'blocked', risk: 'critical',
    coords: [[17.67,82.61],[17.82,82.63],[18.07,82.74],[18.22,82.80]],
    cause: 'Landslide'
  },
  {
    id: 'NH-516E', name: 'NH-516E (Vizag–Araku)',
    status: 'partial', risk: 'high',
    coords: [[17.72,83.10],[17.89,82.99],[18.12,82.87],[18.32,82.86]],
    cause: 'Heavy Rain'
  }
];

const INCIDENT_DATA = [
  { id: 'INC-NE01', type: 'landslide', lat: 27.58, lng: 91.86, title: 'Landslide — Tawang Sector KM 62', severity: 'critical', time: '07:45', road: 'NH-13' },
  { id: 'INC-NE02', type: 'flood',     lat: 26.15, lng: 91.75, title: 'Brahmaputra Flood Surge — Guwahati', severity: 'high',     time: '08:20', road: 'AH-1' },
  { id: 'INC-NE03', type: 'landslide', lat: 25.67, lng: 94.10, title: 'Mountain Slope Slide — Kohima Pass', severity: 'critical', time: '09:10', road: 'NH-2' },
  { id: 'INC-NE04', type: 'flood',     lat: 27.33, lng: 88.61, title: 'Teesta River Flash Flood — Gangtok', severity: 'high',     time: '06:30', road: 'NH-10' },
  { id: 'INC-NE05', type: 'damage',    lat: 25.57, lng: 91.89, title: 'Excess Rain Waterlogging — Shillong', severity: 'medium',   time: '10:15', road: 'GS-1' },
  { id: 'INC-NE06', type: 'damage',    lat: 23.73, lng: 92.71, title: 'Culvert Settlement — Aizawl Route', severity: 'medium',   time: '11:00', road: 'NH-306' },
  { id: 'INC-001',  type: 'landslide', lat: 18.07, lng: 82.74, title: 'Landslide — SH-39 KM 48', severity: 'critical', time: '08:32', road: 'SH-39' },
  { id: 'INC-002',  type: 'flood',     lat: 17.89, lng: 82.99, title: 'Flash Flood — NH-516E',   severity: 'high',     time: '09:15', road: 'NH-516E' }
];

const VEHICLE_DATA = [
  { id: 'VH-NE01', type: '🚛', name: 'MED-Convoy-NE1',   cargo: 'Medicines & Blood Units', lat: 26.14, lng: 91.73, status: 'on-route',  speed: 48, dest: 'Itanagar PHC',       eta: '14:30' },
  { id: 'VH-NE02', type: '🚚', name: 'FOOD-Truck-NE2',   cargo: 'Relief Grain Supply',     lat: 26.72, lng: 88.42, status: 'delayed',   speed: 24, dest: 'Gangtok Central Hub', eta: '17:15' },
  { id: 'VH-NE03', type: '🚑', name: 'EMG-Ambulance-NE3', cargo: 'Critical Patients',      lat: 25.67, lng: 94.10, status: 'at-risk',   speed: 42, dest: 'Imphal Base Hospital',eta: '15:40' },
  { id: 'VH-NE04', type: '🚒', name: 'RESP-NDRF-NE4',    cargo: 'NDRF Rescue Gear',        lat: 25.57, lng: 91.89, status: 'on-route',  speed: 55, dest: 'Cherrapunji Station', eta: '13:50' },
  { id: 'VH-NE05', type: '🚜', name: 'ENG-Dozer-NE5',     cargo: 'Heavy Road Clearer',      lat: 27.10, lng: 93.60, status: 'blocked',   speed: 0,  dest: 'Tawang Pass KM 62',   eta: 'DELAYED' },
  { id: 'VH-NE06', type: '🚛', name: 'FUEL-Tanker-NE6',   cargo: 'Generator Fuel Supply',   lat: 23.83, lng: 91.28, status: 'on-route',  speed: 50, dest: 'Silchar Distribution', eta: '16:00' },
  { id: 'VH-001',  type: '🚛', name: 'MED-Truck-01',     cargo: 'Emergency Kits',          lat: 17.75, lng: 83.05, status: 'on-route',  speed: 42, dest: 'Paderu PHC',          eta: '14:30' }
];

const DISTRICT_DATA = [
  { name: 'Assam (Guwahati)', risk: 'high', accessibility: 74, incidents: 6, roads: 48, lat: 26.14, lng: 91.73, color: '#ff9500' },
  { name: 'Arunachal Pradesh (Itanagar)', risk: 'critical', accessibility: 46, incidents: 9, roads: 32, lat: 27.10, lng: 93.60, color: '#ff3b3b' },
  { name: 'Meghalaya (Shillong)', risk: 'high', accessibility: 68, incidents: 5, roads: 24, lat: 25.57, lng: 91.89, color: '#ff9500' },
  { name: 'Nagaland (Kohima)', risk: 'critical', accessibility: 52, incidents: 7, roads: 22, lat: 25.67, lng: 94.10, color: '#ff3b3b' },
  { name: 'Manipur (Imphal)', risk: 'moderate', accessibility: 72, incidents: 3, roads: 26, lat: 24.81, lng: 93.93, color: '#ffcc00' },
  { name: 'Mizoram (Aizawl)', risk: 'moderate', accessibility: 76, incidents: 4, roads: 20, lat: 23.73, lng: 92.71, color: '#ffcc00' },
  { name: 'Tripura (Agartala)', risk: 'low', accessibility: 91, incidents: 1, roads: 28, lat: 23.83, lng: 91.28, color: '#00ff88' },
  { name: 'Sikkim (Gangtok)', risk: 'critical', accessibility: 58, incidents: 5, roads: 18, lat: 27.33, lng: 88.61, color: '#ff3b3b' },
  { name: 'Visakhapatnam', risk: 'high', accessibility: 68, incidents: 5, roads: 42, lat: 17.70, lng: 83.20, color: '#ff9500' }
];

/* ── Road status style map ──────────────────────────────────── */
const ROAD_STYLE = {
  accessible: { color: '#00ff88', weight: 4, opacity: 0.9, dashArray: null },
  partial:    { color: '#ffcc00', weight: 4, opacity: 0.9, dashArray: '10,5' },
  high:       { color: '#ff9500', weight: 4, opacity: 0.9, dashArray: null },
  blocked:    { color: '#ff3b3b', weight: 5, opacity: 1,   dashArray: '8,4' },
};

/* ── Custom DivIcon factory ─────────────────────────────────── */
function makeVehicleIcon(vehicle) {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:32px;height:32px;">
        <div style="
          width:32px;height:32px;
          border-radius:6px;
          background:${vehicle.status === 'on-route' ? 'linear-gradient(135deg,#001a0d,#00ff88)' :
                      vehicle.status === 'delayed'   ? 'linear-gradient(135deg,#1a0d00,#ff9500)' :
                      vehicle.status === 'at-risk'   ? 'linear-gradient(135deg,#1a0800,#ff6b00)' :
                      vehicle.status === 'blocked'   ? 'linear-gradient(135deg,#1a0000,#ff3b3b)' :
                                                       'linear-gradient(135deg,#001a0d,#00d4ff)'};
          border:1.5px solid ${vehicle.status === 'on-route' ? '#00ff88' :
                               vehicle.status === 'delayed'  ? '#ff9500' :
                               vehicle.status === 'at-risk'  ? '#ff6b00' :
                               vehicle.status === 'blocked'  ? '#ff3b3b' : '#00d4ff'};
          display:flex;align-items:center;justify-content:center;
          font-size:14px;
          box-shadow:0 4px 12px rgba(0,0,0,0.5);
          position:relative;z-index:2;
        ">${vehicle.type}</div>
        <div style="
          position:absolute;inset:-6px;
          border-radius:50%;
          border:1.5px solid #00d4ff;
          animation:pulseRing 2.5s ease-out infinite;
          z-index:1;
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });
}

function makeIncidentIcon(incident) {
  const cfg = {
    landslide: { emoji: '⛰', color: '#ff9500', bg: 'rgba(255,149,0,0.15)' },
    flood:     { emoji: '🌊', color: '#4facfe', bg: 'rgba(79,172,254,0.15)' },
    damage:    { emoji: '🚧', color: '#ffcc00', bg: 'rgba(255,204,0,0.15)' },
    critical:  { emoji: '🔴', color: '#ff3b3b', bg: 'rgba(255,59,59,0.15)' },
  };
  const c = cfg[incident.type] || cfg.critical;
  const isCritical = incident.severity === 'critical';
  const animStyle = isCritical ? 'animation:criticalAlert 1.5s ease-in-out infinite;' : '';

  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:40px;height:40px;">
        <div style="
          width:40px;height:40px;border-radius:50%;
          background:${c.bg};
          border:2px solid ${c.color};
          display:flex;align-items:center;justify-content:center;
          font-size:16px;position:relative;z-index:2;
          box-shadow:0 0 16px ${c.color}55;
          ${animStyle}
        ">${c.emoji}</div>
        <div style="
          position:absolute;inset:-8px;border-radius:50%;
          border:1.5px solid ${c.color};
          animation:pulseRing 2s ease-out infinite;
        "></div>
        ${isCritical ? `
        <div style="
          position:absolute;inset:-16px;border-radius:50%;
          border:1px solid ${c.color};
          animation:pulseRing 2s ease-out 0.5s infinite;
        "></div>` : ''}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -24],
  });
}

/* ── North-Eastern Region Geographic Labels (Matching Uploaded Satellite Photo) ── */
const REGION_NAMES_NE = [
  { name: 'SIKKIM', sub: 'Gangtok / Teesta Sector', lat: 27.53, lng: 88.51, type: 'state' },
  { name: 'BHUTAN', sub: 'Himalayan Ridge', lat: 27.51, lng: 90.43, type: 'country' },
  { name: 'ARUNACHAL PRADESH', sub: 'Tawang / Itanagar Corridor', lat: 27.90, lng: 94.20, type: 'state' },
  { name: 'ASSAM', sub: 'Guwahati / Brahmaputra Lifeline', lat: 26.25, lng: 92.50, type: 'state' },
  { name: 'MEGHALAYA', sub: 'Shillong Plateau', lat: 25.47, lng: 91.37, type: 'state' },
  { name: 'NAGALAND', sub: 'Kohima / Dimapur Corridor', lat: 26.15, lng: 94.56, type: 'state' },
  { name: 'MANIPUR', sub: 'Imphal Valley Highway', lat: 24.81, lng: 93.93, type: 'state' },
  { name: 'MIZORAM', sub: 'Aizawl Hills', lat: 23.30, lng: 92.85, type: 'state' },
  { name: 'TRIPURA', sub: 'Agartala Lifeline', lat: 23.84, lng: 91.50, type: 'state' },
  { name: 'BANGLADESH', sub: 'International Border', lat: 24.15, lng: 90.10, type: 'country' },
];

/* ── City & Town data matching photo ─────────────────────────── */
const CITY_DATA_NE = [
  // Major cities (bold, larger dot)
  { name: 'Guwahati',    subname: '\u0997\u09c1\u09f1\u09be\u09b9\u09be\u099f\u09bf',      lat: 26.14, lng: 91.73, size: 'major' },
  { name: 'Shillong',   subname: '\u09b6\u09bf\u09b2\u0982',        lat: 25.57, lng: 91.89, size: 'major' },
  { name: 'Kohima',     subname: '\u0995\u09cb\u09b9\u09bf\u09ae\u09be',        lat: 25.67, lng: 94.10, size: 'major' },
  { name: 'Imphal',     subname: '\u0987\u09ae\u09ab\u09be\u09b2',        lat: 24.81, lng: 93.93, size: 'major' },
  { name: 'Agartala',   subname: '\u0986\u0997\u09b0\u09a4\u09b2\u09be',      lat: 23.83, lng: 91.28, size: 'major' },
  { name: 'Aizawl',     subname: '\u0986\u0987\u099c\u09b2',        lat: 23.73, lng: 92.71, size: 'major' },
  { name: 'Gangtok',    subname: '\u0997\u09cd\u09af\u09be\u0982\u099f\u0995',      lat: 27.33, lng: 88.61, size: 'major' },
  { name: 'Dibrugarh',  subname: '\u09a1\u09bf\u09ac\u09cd\u09b0\u09c1\u0997\u09dc',    lat: 27.47, lng: 94.91, size: 'major' },
  { name: 'Dimapur',    subname: '\u09a1\u09bf\u09ae\u09be\u09aa\u09c1\u09b0',      lat: 25.90, lng: 93.72, size: 'major' },
  { name: 'Dhaka',      subname: '\u09a2\u09be\u0995\u09be',          lat: 23.72, lng: 90.40, size: 'major' },
  // Minor towns
  { name: 'Nalbari',    subname: '\u09a8\u09b2\u09ac\u09be\u09dc\u09bf',      lat: 26.44, lng: 91.43, size: 'minor' },
  { name: 'Jorhat',     subname: '\u09af\u09cb\u09b0\u09b9\u09be\u099f',        lat: 26.74, lng: 94.20, size: 'minor' },
  { name: 'Tawagar',    subname: '\u0987\u099f\u09be\u09a8\u0997\u09b0',      lat: 27.10, lng: 93.60, size: 'minor' },
  { name: 'Siliguri',   subname: '',             lat: 26.72, lng: 88.42, size: 'minor' },
  { name: 'Rajshahi',   subname: '\u09b0\u09be\u099c\u09b6\u09be\u09b9\u09c0',      lat: 24.37, lng: 88.60, size: 'minor' },
  { name: 'Bogura',     subname: '\u09ac\u0997\u09dc\u09be',          lat: 24.85, lng: 89.37, size: 'minor' },
  { name: 'Jessore',    subname: '',             lat: 23.16, lng: 89.21, size: 'minor' },
  { name: 'Kishangan',  subname: '\u0995\u09bf\u09b6\u09a8\u0997\u099e\u09cd\u099c',  lat: 26.10, lng: 87.95, size: 'minor' },
  { name: 'Darjeeling', subname: '\u09a6\u09be\u09b0\u09cd\u099c\u09bf\u09b2\u09bf\u0982',  lat: 27.03, lng: 88.26, size: 'minor' },
];

/* ── Highway badge markers (yellow) matching photo ────────────── */
const HIGHWAY_DATA_NE = [
  { id: 'AH1', lat: 26.40, lng: 88.80 },
  { id: 'AH1', lat: 26.25, lng: 90.25 },
  { id: 'AH1', lat: 26.14, lng: 91.73 },
  { id: 'AH1', lat: 25.27, lng: 94.01 },
  { id: '27',  lat: 26.50, lng: 89.25 },
  { id: '2',   lat: 25.10, lng: 93.80 },
  { id: '8',   lat: 23.95, lng: 91.40 },
  { id: '306', lat: 24.00, lng: 92.70 },
];

function addRegionLabels(map) {
  map = map || MapEngine.map;
  if (!map) return [];
  const markers = [];

  // 1. State / Country name labels — Google Maps white bold style
  REGION_NAMES_NE.forEach(reg => {
    const isCountry = reg.type === 'country';
    const fontSize  = isCountry ? '15px' : '13px';
    const fontWt    = isCountry ? '700'  : '800';
    const spacing   = isCountry ? '1.5px': '2px';
    const opacity   = isCountry ? '0.85' : '0.95';

    const icon = L.divIcon({
      className: '',
      html: `<div style="
        pointer-events:none;
        transform:translate(-50%,-50%);
        text-align:center;
        white-space:nowrap;
        font-family:'Outfit',Arial,sans-serif;
        font-size:${fontSize};
        font-weight:${fontWt};
        letter-spacing:${spacing};
        color:#ffffff;
        text-shadow:
          1px 1px 3px rgba(0,0,0,0.95),
          -1px -1px 3px rgba(0,0,0,0.95),
          0 0 8px rgba(0,0,0,0.8);
        opacity:${opacity};
        text-transform:uppercase;
        line-height:1.2;
      ">${reg.name.replace(' ', '<br>')}</div>`,
      iconSize: [1,1],
      iconAnchor: [0,0]
    });
    markers.push(L.marker([reg.lat, reg.lng], { icon, interactive: false }).addTo(map));
  });

  // 2. City/town markers with dot + label
  CITY_DATA_NE.forEach(city => {
    const isMajor = city.size === 'major';
    const dotSize  = isMajor ? 7 : 5;
    const fontSize = isMajor ? '11px' : '9.5px';
    const fontWt   = isMajor ? '600' : '500';

    const icon = L.divIcon({
      className: '',
      html: `<div style="pointer-events:none;transform:translate(-50%,-50%);text-align:center;">
        <div style="
          width:${dotSize}px;height:${dotSize}px;
          background:#ffffff;
          border:1.5px solid rgba(0,0,0,0.5);
          border-radius:50%;
          margin:0 auto 2px auto;
          box-shadow:0 0 4px rgba(0,0,0,0.6);
        "></div>
        <div style="
          font-family:'Outfit',Arial,sans-serif;
          font-size:${fontSize};
          font-weight:${fontWt};
          color:#ffffff;
          text-shadow:1px 1px 2px rgba(0,0,0,0.95),-1px -1px 2px rgba(0,0,0,0.95);
          white-space:nowrap;
          line-height:1.1;
        ">${city.name}${city.subname ? `<br><span style="font-size:8px;opacity:0.75;">${city.subname}</span>` : ''}</div>
      </div>`,
      iconSize: [1,1],
      iconAnchor: [0,0]
    });
    markers.push(L.marker([city.lat, city.lng], { icon, interactive: false }).addTo(map));
  });

  // 3. Yellow highway badge markers
  HIGHWAY_DATA_NE.forEach(hw => {
    const isLong = hw.id.length > 2;
    const icon = L.divIcon({
      className: '',
      html: `<div style="
        pointer-events:none;
        transform:translate(-50%,-50%);
        background:#f9d71c;
        border:1.5px solid #b8a000;
        border-radius:${isLong ? '4px':'5px'};
        padding:${isLong ? '1px 4px':'2px 5px'};
        font-family:Arial,sans-serif;
        font-size:${isLong ? '8px':'9px'};
        font-weight:900;
        color:#000;
        white-space:nowrap;
        box-shadow:0 1px 4px rgba(0,0,0,0.6);
        line-height:1.2;
      ">${hw.id}</div>`,
      iconSize: [1,1],
      iconAnchor: [0,0]
    });
    markers.push(L.marker([hw.lat, hw.lng], { icon, interactive: false }).addTo(map));
  });

  return markers;
}

/* ── Init Map ───────────────────────────────────────────────── */
function initMap(containerId, opts = {}) {
  const el = document.getElementById(containerId);
  if (!el) return null;

  const map = L.map(containerId, {
    center: opts.center || MAP_CONFIG.center,
    zoom:   opts.zoom   || MAP_CONFIG.zoom,
    minZoom: MAP_CONFIG.minZoom,
    maxZoom: MAP_CONFIG.maxZoom,
    zoomControl: opts.zoomControl !== undefined ? opts.zoomControl : true,
    attributionControl: false,
  });

  // Satellite Topography Layer (Google Satellite Hybrid matching photo)
  const satelliteLayer = L.tileLayer(MAP_CONFIG.tileUrl, {
    attribution: MAP_CONFIG.tileAttr,
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
  });

  // Dark Tactical Layer
  const darkLayer = L.tileLayer(MAP_CONFIG.darkTileUrl, {
    attribution: '&copy; CARTO & OpenStreetMap',
    maxZoom: 19
  });

  satelliteLayer.addTo(map);

  if (opts.layersControl !== false) {
    try {
      L.control.layers({
        '🛰️ Satellite Terrain (Photo View)': satelliteLayer,
        '🌑 Dark Tactical View': darkLayer
      }, null, { position: 'topright' }).addTo(map);
    } catch(e) {}
  }

  // Add North-East Region Name Badges matching satellite topography photo
  if (opts.regionLabels !== false) {
    addRegionLabels(map);
  }

  MapEngine.map = map;
  return map;
}

/* ── Add Roads ──────────────────────────────────────────────── */
function addRoads(map, roads, onClick) {
  map = map || MapEngine.map;
  if (!map) return {};
  const layers = {};

  (roads || ROAD_DATA).forEach(road => {
    const style = ROAD_STYLE[road.status] || ROAD_STYLE.accessible;

    // Glow underline (wider, more transparent)
    const glowLine = L.polyline(road.coords, {
      color: style.color,
      weight: style.weight + 6,
      opacity: 0.18,
      interactive: false,
    }).addTo(map);

    // Main road line
    const line = L.polyline(road.coords, {
      color: style.color,
      weight: style.weight,
      opacity: style.opacity,
      dashArray: style.dashArray,
    }).addTo(map);

    line.bindPopup(`
      <div style="font-family:'Outfit',sans-serif;min-width:200px;">
        <div style="font-weight:800;font-size:14px;color:#e8f4ff;margin-bottom:8px;">${road.name}</div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span style="color:#6ab0d4;font-size:12px;">STATUS</span>
          <span style="color:${style.color};font-weight:700;font-size:12px;">${road.status.toUpperCase()}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span style="color:#6ab0d4;font-size:12px;">RISK</span>
          <span style="color:${style.color};font-weight:700;font-size:12px;">${(road.risk||'').toUpperCase()}</span>
        </div>
        ${road.cause ? `<div style="display:flex;justify-content:space-between;">
          <span style="color:#6ab0d4;font-size:12px;">CAUSE</span>
          <span style="color:#e8f4ff;font-weight:600;font-size:12px;">${road.cause}</span>
        </div>` : ''}
      </div>
    `);

    if (onClick) {
      line.on('click', () => onClick(road));
    }

    layers[road.id] = { glowLine, line };
  });

  return layers;
}

/* ── Add Incidents ──────────────────────────────────────────── */
function addIncidents(map, incidents, onClick) {
  map = map || MapEngine.map;
  if (!map) return {};
  const markers = {};

  (incidents || INCIDENT_DATA).forEach(inc => {
    const icon = makeIncidentIcon(inc);
    const marker = L.marker([inc.lat, inc.lng], { icon }).addTo(map);

    marker.bindPopup(`
      <div style="font-family:'Outfit',sans-serif;min-width:220px;">
        <div style="font-weight:800;font-size:14px;color:#e8f4ff;margin-bottom:8px;">${inc.title}</div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span style="color:#6ab0d4;font-size:12px;">SEVERITY</span>
          <span style="color:${inc.severity === 'critical' ? '#ff3b3b' : inc.severity === 'high' ? '#ff9500' : '#ffcc00'};font-weight:700;font-size:12px;">${inc.severity.toUpperCase()}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="color:#6ab0d4;font-size:12px;">REPORTED</span>
          <span style="color:#e8f4ff;font-size:12px;font-family:'JetBrains Mono',monospace;">${inc.time}</span>
        </div>
      </div>
    `);

    if (onClick) marker.on('click', () => onClick(inc));

    markers[inc.id] = marker;
  });

  return markers;
}

/* ── Add Vehicles ───────────────────────────────────────────── */
function addVehicles(map, vehicles, onClick) {
  map = map || MapEngine.map;
  if (!map) return {};
  const markers = {};

  (vehicles || VEHICLE_DATA).forEach(v => {
    const icon = makeVehicleIcon(v);
    const marker = L.marker([v.lat, v.lng], { icon }).addTo(map);

    marker.bindPopup(`
      <div style="font-family:'Outfit',sans-serif;min-width:200px;">
        <div style="font-weight:800;font-size:14px;color:#e8f4ff;margin-bottom:8px;">${v.name}</div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span style="color:#6ab0d4;font-size:12px;">CARGO</span>
          <span style="color:#e8f4ff;font-size:12px;font-weight:600;">${v.cargo}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span style="color:#6ab0d4;font-size:12px;">STATUS</span>
          <span style="color:${v.status === 'on-route' ? '#00ff88' : v.status === 'delayed' ? '#ff9500' : v.status === 'blocked' ? '#ff3b3b' : '#ff6b00'};font-weight:700;font-size:12px;">${v.status.toUpperCase().replace('-',' ')}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span style="color:#6ab0d4;font-size:12px;">SPEED</span>
          <span style="color:#e8f4ff;font-size:12px;font-family:'JetBrains Mono',monospace;">${v.speed} km/h</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="color:#6ab0d4;font-size:12px;">ETA</span>
          <span style="color:#00d4ff;font-size:12px;font-family:'JetBrains Mono',monospace;">${v.eta}</span>
        </div>
      </div>
    `);

    if (onClick) marker.on('click', () => onClick(v));

    markers[v.id] = marker;
  });

  MapEngine.vehicleMarkers = markers;
  return markers;
}

/* ── Animate Vehicles ───────────────────────────────────────── */
function animateVehicles(map, vehicleMarkers) {
  map = map || MapEngine.map;
  vehicleMarkers = vehicleMarkers || MapEngine.vehicleMarkers || {};
  if (!map) return;
  // Subtle position movement to simulate real-time fleet telemetry
  Object.entries(vehicleMarkers).forEach(([id, marker]) => {
    const vehicle = VEHICLE_DATA.find(v => v.id === id);
    if (!vehicle || vehicle.status === 'blocked') return;

    let angle = Math.random() * Math.PI * 2;
    const speed = (vehicle.speed || 35) / 18000;

    setInterval(() => {
      if (!map || !marker) return;
      try {
        const pos = marker.getLatLng();
        angle += (Math.random() - 0.5) * 0.15;
        const newLat = pos.lat + Math.cos(angle) * speed;
        const newLng = pos.lng + Math.sin(angle) * speed;
        marker.setLatLng([newLat, newLng]);
      } catch(e) {}
    }, 1800);
  });
}

/* ── Flood Zone ─────────────────────────────────────────────── */
function addFloodZone(map, center, radius = 0.08) {
  map = map || MapEngine.map;
  if (!map) return null;
  // Animated flood polygon
  const points = [];
  for (let i = 0; i <= 32; i++) {
    const angle = (i / 32) * Math.PI * 2;
    const r = radius * (0.85 + Math.random() * 0.3);
    points.push([
      center[0] + Math.cos(angle) * r,
      center[1] + Math.sin(angle) * r * 1.5
    ]);
  }

  const flood = L.polygon(points, {
    color: '#4facfe',
    weight: 2,
    opacity: 0.7,
    fillColor: '#4facfe',
    fillOpacity: 0.15,
    dashArray: '6,4',
    className: 'flood-zone'
  }).addTo(map);

  flood.bindPopup(`
    <div style="font-family:'Outfit',sans-serif;">
      <div style="font-weight:800;color:#4facfe;margin-bottom:4px;">🌊 FLOOD ZONE</div>
      <div style="font-size:12px;color:#b4d2f0;">Active flooding detected in this area.<br>Roads may be submerged.</div>
    </div>
  `);

  return flood;
}

/* ── Alternate Route Paths ──────────────────────────────────── */
function drawAlternateRoutes(map) {
  map = map || MapEngine.map;
  if (!map) return [];
  const routes = [
    {
      label: 'Route A — Via Chintapalle',
      coords: [[17.72,83.10],[17.95,82.95],[18.15,82.78],[18.33,82.87]],
      color: '#00ff88', recommended: true,
    },
    {
      label: 'Route B — Via Koyyuru',
      coords: [[17.72,83.10],[17.80,82.85],[18.05,82.70],[18.33,82.87]],
      color: '#ffcc00', recommended: false,
    },
    {
      label: 'Route C — Via Paderu North',
      coords: [[17.72,83.10],[18.00,82.80],[18.22,82.55],[18.33,82.87]],
      color: '#ff9500', recommended: false,
    },
  ];

  return routes.map(route => {
    // Glow
    L.polyline(route.coords, {
      color: route.color, weight: route.recommended ? 14 : 10,
      opacity: 0.12, interactive: false
    }).addTo(map);

    // Main
    const line = L.polyline(route.coords, {
      color: route.color, weight: route.recommended ? 5 : 3.5,
      opacity: 0.95, dashArray: route.recommended ? null : '12,6',
    }).addTo(map);

    line.bindPopup(`
      <div style="font-family:'Outfit',sans-serif;min-width:180px;">
        <div style="font-weight:800;color:${route.color};margin-bottom:4px;">${route.label}</div>
        ${route.recommended ? '<div style="color:#00ff88;font-size:12px;font-weight:700;">✓ AI RECOMMENDED</div>' : ''}
      </div>
    `);

    return line;
  });
}

/* ── Export ─────────────────────────────────────────────────── */

/* ============================================================
   SMARTROUTE — 3D GIS TERRAIN ENGINE (Three.js)
   Realistic mountain terrain, elevated roads, bridges,
   3D moving vehicles, floating incident markers, and flood zones
   ============================================================ */

function create3DScene(containerId, options = {}) {
  const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!container || typeof THREE === 'undefined') return null;

  // Clear existing content
  container.innerHTML = '';

  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030814);
  scene.fog = new THREE.FogExp2(0x030814, 0.005);

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 2500);
  camera.position.set(0, 65, 110);
  camera.lookAt(0, 5, -5);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  container.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x406085, 1.2);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0x00d4ff, 1.8);
  sunLight.position.set(60, 100, 50);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  scene.add(sunLight);

  const warmRimLight = new THREE.DirectionalLight(0xff9500, 0.8);
  warmRimLight.position.set(-60, 40, -50);
  scene.add(warmRimLight);

  // Groups for layer toggling
  const layers = {
    terrain: new THREE.Group(),
    rivers: new THREE.Group(),
    roads: new THREE.Group(),
    bridges: new THREE.Group(),
    vehicles: new THREE.Group(),
    incidents: new THREE.Group(),
    flood: new THREE.Group(),
        boundaries: new THREE.Group(),
  };

  Object.values(layers).forEach(group => scene.add(group));

  // --- North-Eastern 3D Satellite Topography (Matching Uploaded Photo) ---
  const terrainSize = 220;
  const segments = 90;
  const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);
  terrainGeo.rotateX(-Math.PI / 2);

  const posAttr = terrainGeo.attributes.position;
  const vertexColors = [];

  // Satellite Topography Color Grading matching uploaded photo
  const colSnowPeak = new THREE.Color(0xffffff);     // Himalayan glacier / snow
  const colSnowRock = new THREE.Color(0xd6ebfc);     // High altitude snow-rock crest
  const colHighRidge = new THREE.Color(0x2f5233);    // Dense Himalayan pine & fir forest
  const colMidSlope  = new THREE.Color(0x194d24);    // Subtropical mountain slope
  const colAssamValley = new THREE.Color(0x256632);  // Lush Brahmaputra alluvial plains
  const colRiverBank = new THREE.Color(0x184824);    // River wetland
  const colBanglaPlain = new THREE.Color(0x123d1d);  // Bangladesh lowlands

  // Elevation function for North-East India Topography matching photo:
  // North (-Z): High snow-capped Himalayas (Sikkim, Bhutan, Arunachal Pradesh)
  // Center (Z: -25 to +15): Brahmaputra river valley (Assam)
  // South-Center (Z: +15 to +45, X: -40 to +15): Meghalaya plateau (Shillong tableland)
  // East & South-East (X: +15 to +90, Z: -15 to +85): Naga, Manipur & Mizo folded ridges
  // South-West (X: -90 to -25, Z: +15 to +90): Bangladesh lowlands
  function getElevation(x, z) {
    let h = 0;

    // 1. Northern Himalayan Ridge (-Z)
    if (z < -10) {
      const himalayanFactor = Math.min(1.0, Math.pow(Math.abs(z + 10) / 75, 1.3));
      let peaks = Math.sin(x * 0.08) * 6 + Math.cos(z * 0.09) * 5;
      peaks += Math.sin((x + z) * 0.14) * 4 + Math.sin(x * 0.22) * 2.5;
      h += himalayanFactor * (22 + peaks);
    }

    // 2. Central Brahmaputra Valley (Assam)
    const valleyCenterZ = -5 + Math.sin(x * 0.03) * 8;
    const distToValley = Math.abs(z - valleyCenterZ);
    const valleyFactor = Math.exp(-(distToValley * distToValley) / 320);
    h -= valleyFactor * 8.5;

    // 3. Meghalaya Plateau (South-Central tableland)
    if (x > -40 && x < 15 && z > 10 && z < 45) {
      const distToPlateau = Math.hypot((x + 12) / 25, (z - 26) / 16);
      if (distToPlateau < 1.0) {
        const pFactor = Math.cos(distToPlateau * Math.PI / 2);
        h += pFactor * 13 + Math.sin(x * 0.15) * Math.cos(z * 0.15) * 2;
      }
    }

    // 4. Eastern Mountain Folds (Nagaland, Manipur, Mizoram)
    if (x > 15) {
      const eastFactor = Math.min(1.0, (x - 15) / 50);
      const ridges = Math.sin(x * 0.25) * 5 + Math.cos(z * 0.07) * 4.5 + Math.sin((x + z * 0.5) * 0.12) * 3;
      h += eastFactor * (10 + ridges);
    }

    // 5. Bangladesh Lowlands (South-West)
    if (x < -25 && z > 15) {
      const swFactor = Math.min(1.0, Math.hypot((x + 25) / 50, (z - 15) / 50));
      h = h * (1 - swFactor * 0.7) + 1.5;
    }

    return Math.max(0.5, h + 3.5);
  }

  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const y = getElevation(x, z);
    posAttr.setY(i, y);

    const col = new THREE.Color();
    // Northern snow peaks & glaciers
    if (z < -15 && y > 19) {
      const snowT = THREE.MathUtils.clamp((y - 19) / 9, 0, 1);
      col.lerpColors(colSnowRock, colSnowPeak, snowT);
    } else if (z < -5 && y > 13) {
      const rockT = THREE.MathUtils.clamp((y - 13) / 6, 0, 1);
      col.lerpColors(colHighRidge, colSnowRock, rockT);
    } else if (y > 10) {
      const slopeT = THREE.MathUtils.clamp((y - 10) / 6, 0, 1);
      col.lerpColors(colMidSlope, colHighRidge, slopeT);
    } else if (Math.abs(z - (-5)) < 18) {
      const vT = THREE.MathUtils.clamp(y / 9, 0, 1);
      col.lerpColors(colRiverBank, colAssamValley, vT);
    } else if (x < -20 && z > 20) {
      col.copy(colBanglaPlain);
    } else {
      const hT = THREE.MathUtils.clamp(y / 10, 0, 1);
      col.lerpColors(colAssamValley, colMidSlope, hT);
    }

    vertexColors.push(col.r, col.g, col.b);
  }
  terrainGeo.setAttribute('color', new THREE.Float32BufferAttribute(vertexColors, 3));
  terrainGeo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.75,
    metalness: 0.15,
    flatShading: true,
  });
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  layers.terrain.add(terrainMesh);

  // Wireframe cyber overlay
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x00d4ff,
    wireframe: true,
    transparent: true,
    opacity: 0.07,
  });
  const wireMesh = new THREE.Mesh(terrainGeo, wireMat);
  wireMesh.position.y += 0.05;
  layers.terrain.add(wireMesh);

  // --- 3D Brahmaputra Braided River System ---
  const riverPoints = [
    new THREE.Vector3(95, getElevation(95, -20) - 0.6, -20),
    new THREE.Vector3(60, getElevation(60, -14) - 0.6, -14),
    new THREE.Vector3(25, getElevation(25, -6) - 0.6, -6),
    new THREE.Vector3(-10, getElevation(-10, -3) - 0.6, -3),
    new THREE.Vector3(-45, getElevation(-45, 0) - 0.6, 0),
    new THREE.Vector3(-75, getElevation(-75, 18) - 0.6, 18),
    new THREE.Vector3(-95, getElevation(-95, 45) - 0.6, 45),
  ];
  const riverCurve = new THREE.CatmullRomCurve3(riverPoints);
  const riverGeo = new THREE.TubeGeometry(riverCurve, 80, 3.2, 8, false);
  const riverMat = new THREE.MeshStandardMaterial({
    color: 0x0088b3,
    emissive: 0x003b4f,
    roughness: 0.12,
    metalness: 0.85,
    transparent: true,
    opacity: 0.8,
  });
  const riverMesh = new THREE.Mesh(riverGeo, riverMat);
  layers.rivers.add(riverMesh);

  // --- 3D Floating North Region Labels (Matching Uploaded Photo) ---
  const region3DLabels = [
    { name: 'SIKKIM', sub: 'Gangtok', x: -62, z: -62, isCountry: false },
    { name: 'BHUTAN', sub: 'Himalayan Ridge', x: -12, z: -65, isCountry: true },
    { name: 'ARUNACHAL PRADESH', sub: 'Tawang / Itanagar', x: 55, z: -55, isCountry: false },
    { name: 'ASSAM', sub: 'Guwahati / Brahmaputra', x: -5, z: -5, isCountry: false },
    { name: 'MEGHALAYA', sub: 'Shillong Plateau', x: -14, z: 26, isCountry: false },
    { name: 'NAGALAND', sub: 'Kohima / Dimapur', x: 58, z: -2, isCountry: false },
    { name: 'MANIPUR', sub: 'Imphal Valley', x: 54, z: 32, isCountry: false },
    { name: 'MIZORAM', sub: 'Aizawl Hills', x: 22, z: 66, isCountry: false },
    { name: 'TRIPURA', sub: 'Agartala Lifeline', x: -26, z: 58, isCountry: false },
    { name: 'BANGLADESH', sub: 'Dhaka Sector', x: -68, z: 38, isCountry: true },
  ];

  function make3DTextSprite(title, subtitle, isCountry) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');

    // Card background
    ctx.fillStyle = 'rgba(3, 12, 28, 0.88)';
    if (ctx.roundRect) ctx.roundRect(12, 12, 488, 136, 16);
    else ctx.rect(12, 12, 488, 136);
    ctx.fill();

    ctx.lineWidth = 4;
    ctx.strokeStyle = isCountry ? '#00d4ff' : '#00ff88';
    ctx.stroke();

    // Title
    ctx.font = '900 46px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = isCountry ? '#00d4ff' : '#00ff88';
    ctx.shadowBlur = 12;
    ctx.fillText(title, 256, 75);

    // Subtitle
    ctx.font = 'bold 24px JetBrains Mono, monospace';
    ctx.shadowBlur = 4;
    ctx.fillStyle = isCountry ? '#7ce8ff' : '#a8e6cf';
    ctx.fillText(subtitle, 256, 120);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(24, 7.5, 1);
    return sprite;
  }

  region3DLabels.forEach(reg => {
    const y = getElevation(reg.x, reg.z) + 7;
    const sprite = make3DTextSprite(reg.name, reg.sub, reg.isCountry);
    sprite.position.set(reg.x, y, reg.z);
    layers.boundaries.add(sprite);

    // Subtle holographic beacon tether line connecting label to ground
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(reg.x, y - 3.5, reg.z),
      new THREE.Vector3(reg.x, getElevation(reg.x, reg.z), reg.z)
    ]);
    const lineMat = new THREE.LineBasicMaterial({
      color: reg.isCountry ? 0x00d4ff : 0x00ff88,
      transparent: true,
      opacity: 0.5
    });
    const tether = new THREE.Line(lineGeo, lineMat);
    layers.boundaries.add(tether);
  });

  // --- 3D North-Eastern Road Network ---
  const road3DConfigs = [
    {
      id: 'AH-1', name: 'AH-1 (Siliguri–Guwahati–Kohima–Imphal)', status: 'partial', color: 0xff9500,
      pts: [[-75, 5], [-40, -2], [-10, -5], [20, 5], [58, -2], [54, 32]],
    },
    {
      id: 'NH-27', name: 'NH-27 East-West (Siliguri–Nalbari–Guwahati)', status: 'accessible', color: 0x00ff88,
      pts: [[-75, 5], [-50, -4], [-25, -8], [-10, -5], [15, -12]],
    },
    {
      id: 'NH-13', name: 'NH-13 Trans-Arunachal (Tawang–Itanagar)', status: 'blocked', color: 0xff3b3b,
      pts: [[-10, -5], [10, -25], [35, -45], [55, -55]],
    },
    {
      id: 'NH-2', name: 'NH-2 (Kohima–Senapati–Imphal)', status: 'blocked', color: 0xff3b3b,
      pts: [[58, -2], [56, 15], [54, 32]],
    },
    {
      id: 'GS-1', name: 'GS-1 (Guwahati–Nongpoh–Shillong)', status: 'accessible', color: 0x00d4ff,
      pts: [[-10, -5], [-12, 10], [-14, 26]],
    },
    {
      id: 'NH-8', name: 'NH-8 (Tripura Lifeline: Silchar–Agartala)', status: 'accessible', color: 0x00ff88,
      pts: [[10, 25], [-5, 45], [-26, 58]],
    },
    {
      id: 'NH-10', name: 'NH-10 (Siliguri–Rangpo–Gangtok)', status: 'blocked', color: 0xff3b3b,
      pts: [[-75, 5], [-68, -30], [-62, -62]],
    },
  ];

  const roadCurves = {};
  const interactiveObjects = [];

  road3DConfigs.forEach(rc => {
    const points3D = rc.pts.map(([x, z]) => {
      const y = getElevation(x, z) + 0.8;
      return new THREE.Vector3(x, y, z);
    });
    const curve = new THREE.CatmullRomCurve3(points3D);
    roadCurves[rc.id] = curve;

    // Road ribbon tube
    const roadTubeGeo = new THREE.TubeGeometry(curve, 60, 0.9, 8, false);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x0a1628,
      emissive: rc.color,
      emissiveIntensity: 0.35,
      roughness: 0.4,
      metalness: 0.6,
    });
    const roadMesh = new THREE.Mesh(roadTubeGeo, roadMat);
    roadMesh.userData = { type: 'road', data: rc };
    layers.roads.add(roadMesh);
    interactiveObjects.push(roadMesh);

    // Glowing energy line running along the center
    const energyLineGeo = new THREE.TubeGeometry(curve, 60, 0.22, 6, false);
    const energyLineMat = new THREE.MeshBasicMaterial({
      color: rc.color,
      transparent: true,
      opacity: 0.9,
    });
    const energyMesh = new THREE.Mesh(energyLineGeo, energyLineMat);
    layers.roads.add(energyMesh);
  });

  // --- 3D Brahmaputra Strategic Bridges ---
  const bridge1 = new THREE.Group();
  const bridgeDeckGeo = new THREE.BoxGeometry(18, 0.7, 2.5);
  const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x22364d, metalness: 0.7, roughness: 0.3 });
  const bridgeDeck = new THREE.Mesh(bridgeDeckGeo, bridgeMat);
  bridgeDeck.position.set(-10, getElevation(-10, -5) + 1.2, -5);
  bridgeDeck.rotation.y = 0.5;
  bridge1.add(bridgeDeck);

  // Bridge piers
  for (let px of [-6, 0, 6]) {
    const pierGeo = new THREE.CylinderGeometry(0.4, 0.5, 6, 8);
    const pier = new THREE.Mesh(pierGeo, bridgeMat);
    pier.position.set(-10 + px, getElevation(-10, -5) - 1.5, -5);
    bridge1.add(pier);
  }
  layers.bridges.add(bridge1);

  // --- 3D Moving Vehicles with GPS Pulse Rings ---
  const vehicleMeshes = [];
  const vehiclesData = [
    { id: 'VH-NE01', name: 'MED-Convoy-NE1', cargo: 'Blood & Meds', roadId: 'AH-1', speed: 0.08, color: 0x00ff88, t: 0.2 },
    { id: 'VH-NE02', name: 'FOOD-Truck-NE2', cargo: 'Relief Grain', roadId: 'NH-27', speed: 0.05, color: 0xff9500, t: 0.45 },
    { id: 'VH-NE03', name: 'EMG-Ambulance-NE3', cargo: 'Patients', roadId: 'NH-2', speed: 0.03, color: 0xff3b3b, t: 0.65 },
    { id: 'VH-NE04', name: 'RESP-NDRF-NE4', cargo: 'Rescue Gear', roadId: 'GS-1', speed: 0.09, color: 0x00d4ff, t: 0.3 },
    { id: 'VH-NE05', name: 'ENG-Dozer-NE5', cargo: 'Road Clearance', roadId: 'NH-13', speed: 0.02, color: 0xff3b3b, t: 0.8 },
  ];

  vehiclesData.forEach(vd => {
    const vehGroup = new THREE.Group();

    // Chassis & Cab
    const cabGeo = new THREE.BoxGeometry(1.6, 1.2, 2.8);
    const cabMat = new THREE.MeshStandardMaterial({ color: 0x0d2238, metalness: 0.8, roughness: 0.2 });
    const cab = new THREE.Mesh(cabGeo, cabMat);
    cab.position.y = 0.8;
    vehGroup.add(cab);

    // Cargo Container
    const cargoGeo = new THREE.BoxGeometry(1.5, 1.1, 1.8);
    const cargoMat = new THREE.MeshStandardMaterial({ color: vd.color, emissive: vd.color, emissiveIntensity: 0.4 });
    const cargo = new THREE.Mesh(cargoGeo, cargoMat);
    cargo.position.set(0, 0.85, -0.4);
    vehGroup.add(cargo);

    // Headlights
    const lightL = new THREE.PointLight(0xffffff, 0.8, 15);
    lightL.position.set(0.6, 0.6, 1.5);
    vehGroup.add(lightL);

    // Ground GPS Pulse Ring
    const ringGeo = new THREE.RingGeometry(1.2, 1.6, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: vd.color, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.05;
    vehGroup.add(ring);

    vehGroup.userData = { type: 'vehicle', data: vd, ring, ringScale: 1 };
    layers.vehicles.add(vehGroup);
    interactiveObjects.push(cab); // allow clicking
    cab.userData = { type: 'vehicle', data: vd, parentGroup: vehGroup };

    vehicleMeshes.push({ group: vehGroup, cfg: vd });
  });

  // --- 3D Regional Incident Floating Markers ---
  const incidentMarkers = [
    { id: 'INC-NE01', type: 'landslide', title: 'Landslide — Tawang Sector KM 62', pos: [35, getElevation(35, -45) + 3.5, -45], color: 0xff3b3b },
    { id: 'INC-NE02', type: 'flood', title: 'Brahmaputra Flood Surge — Guwahati', pos: [-10, getElevation(-10, -5) + 3.5, -5], color: 0x00d4ff },
    { id: 'INC-NE03', type: 'landslide', title: 'Mountain Slope Slide — Kohima Pass', pos: [57, getElevation(57, 10) + 3.5, 10], color: 0xff3b3b },
    { id: 'INC-NE04', type: 'flood', title: 'Teesta Flash Flood — Gangtok', pos: [-62, getElevation(-62, -62) + 3.5, -62], color: 0xff9500 },
    { id: 'INC-NE05', type: 'damage', title: 'Rain Waterlogging — Shillong', pos: [-14, getElevation(-14, 26) + 3.5, 26], color: 0xffcc00 },
  ];

  incidentMarkers.forEach(inc => {
    const incGroup = new THREE.Group();
    incGroup.position.set(...inc.pos);

    // Floating diamond/octahedron beacon
    const beaconGeo = new THREE.OctahedronGeometry(1.4, 0);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: inc.color,
      emissive: inc.color,
      emissiveIntensity: 0.7,
      roughness: 0.1,
      metalness: 0.9,
    });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    beaconMesh.userData = { type: 'incident', data: inc };
    incGroup.add(beaconMesh);
    interactiveObjects.push(beaconMesh);

    // Vertical holographic beam
    const beamGeo = new THREE.CylinderGeometry(0.08, 0.08, 7, 8);
    const beamMat = new THREE.MeshBasicMaterial({ color: inc.color, transparent: true, opacity: 0.35 });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = -3.5;
    incGroup.add(beam);

    // Concentric pulse wave rings
    const waveRingGeo = new THREE.RingGeometry(1.0, 1.4, 20);
    waveRingGeo.rotateX(-Math.PI / 2);
    const waveMat = new THREE.MeshBasicMaterial({ color: inc.color, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
    const waveRing = new THREE.Mesh(waveRingGeo, waveMat);
    waveRing.position.y = -6.8;
    incGroup.add(waveRing);

    incGroup.userData = { beacon: beaconMesh, waveRing, initialY: inc.pos[1] };
    layers.incidents.add(incGroup);
  });

  // --- 3D Flood Zone in Guwahati / Brahmaputra ---
  const floodGeo = new THREE.CircleGeometry(18, 32);
  floodGeo.rotateX(-Math.PI / 2);
  const floodMat = new THREE.MeshStandardMaterial({
    color: 0x00d4ff,
    emissive: 0x005577,
    emissiveIntensity: 0.5,
    roughness: 0.2,
    metalness: 0.8,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide,
  });
  const floodMesh = new THREE.Mesh(floodGeo, floodMat);
  floodMesh.position.set(-10, getElevation(-10, -5) + 0.4, -5);
  layers.flood.add(floodMesh);

  // --- 3D Regional Boundary Grid ---
  const boundaryCoords = [
    [-85, -85], [85, -85], [85, 85], [-85, 85], [-85, -85]
  ];
  for (let i = 0; i < boundaryCoords.length - 1; i++) {
    const p1 = boundaryCoords[i];
    const p2 = boundaryCoords[i+1];
    const dist = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const wallGeo = new THREE.PlaneGeometry(dist, 4);
    const wallMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      wireframe: true,
    });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set((p1[0] + p2[0]) / 2, 4, (p1[1] + p2[1]) / 2);
    wall.rotation.y = -Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
    layers.boundaries.add(wall);
  }

  // --- Interactive Orbit & Tilt Camera Controls ---
  let isDragging = false;
  let isPanning = false;
  let prevMousePos = { x: 0, y: 0 };
  let spherical = { radius: 120, theta: 0.3, phi: 0.85 }; // spherical coordinates
  const target = new THREE.Vector3(0, 4, 0);

  function updateCamera() {
    spherical.phi = THREE.MathUtils.clamp(spherical.phi, 0.15, Math.PI / 2 - 0.05); // allow tilt up to 85 degrees
    spherical.radius = THREE.MathUtils.clamp(spherical.radius, 30, 240);

    camera.position.x = target.x + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
    camera.position.y = target.y + spherical.radius * Math.cos(spherical.phi);
    camera.position.z = target.z + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
    camera.lookAt(target);
  }
  updateCamera();

  const dom = renderer.domElement;

  dom.addEventListener('mousedown', (e) => {
    if (e.button === 2 || e.shiftKey) isPanning = true;
    else isDragging = true;
    prevMousePos = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('mousemove', (e) => {
    const dx = e.clientX - prevMousePos.x;
    const dy = e.clientY - prevMousePos.y;
    prevMousePos = { x: e.clientX, y: e.clientY };

    if (isDragging) {
      spherical.theta -= dx * 0.007;
      spherical.phi -= dy * 0.006;
      updateCamera();
    } else if (isPanning) {
      const panSpeed = spherical.radius * 0.001;
      target.x -= dx * panSpeed * Math.cos(spherical.theta);
      target.z += dx * panSpeed * Math.sin(spherical.theta);
      target.y += dy * panSpeed;
      updateCamera();
    }
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
    isPanning = false;
  });

  dom.addEventListener('contextmenu', e => e.preventDefault());

  dom.addEventListener('wheel', (e) => {
    e.preventDefault();
    spherical.radius += e.deltaY * 0.08;
    updateCamera();
  }, { passive: false });

  // Touch controls for tablet/mobile
  let touchStartDist = 0;
  dom.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      isDragging = false;
      touchStartDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  });

  dom.addEventListener('touchmove', (e) => {
    if (isDragging && e.touches.length === 1) {
      const dx = e.touches[0].clientX - prevMousePos.x;
      const dy = e.touches[0].clientY - prevMousePos.y;
      prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      spherical.theta -= dx * 0.008;
      spherical.phi -= dy * 0.007;
      updateCamera();
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      spherical.radius -= (dist - touchStartDist) * 0.2;
      touchStartDist = dist;
      updateCamera();
    }
  });

  dom.addEventListener('touchend', () => { isDragging = false; });

  // --- Raycasting for 3D Item Selection ---
  const raycaster = new THREE.Raycaster();
  const mouseVec = new THREE.Vector2();

  dom.addEventListener('click', (e) => {
    const rect = dom.getBoundingClientRect();
    mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouseVec, camera);
    const intersects = raycaster.intersectObjects(interactiveObjects, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const data = hit.userData.data || (hit.userData.parentGroup && hit.userData.parentGroup.userData.data);
      const type = hit.userData.type || (hit.userData.parentGroup && hit.userData.parentGroup.userData.type);
      if (options.onSelect) {
        options.onSelect({ type, data, hit });
      }
    }
  });

  // --- Animation Loop ---
  let reqId = null;
  let clock = new THREE.Clock();

  function animate() {
    reqId = requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    // 1. Move vehicles along road curves
    vehicleMeshes.forEach(vm => {
      const curve = roadCurves[vm.cfg.roadId];
      if (curve) {
        vm.cfg.t = (vm.cfg.t + delta * vm.cfg.speed * 0.4) % 1.0;
        const pt = curve.getPointAt(vm.cfg.t);
        const tangent = curve.getTangentAt(vm.cfg.t);
        vm.group.position.copy(pt);
        vm.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

        // Animate GPS Pulse Ring
        const ring = vm.group.userData.ring;
        if (ring) {
          vm.group.userData.ringScale = (vm.group.userData.ringScale + delta * 1.5) % 2.5;
          const s = 1 + vm.group.userData.ringScale;
          ring.scale.set(s, s, s);
          ring.material.opacity = Math.max(0, 1 - (vm.group.userData.ringScale / 2.5));
        }
      }
    });

    // 2. Animate Incident Beacons (hover & spin) & pulse rings
    layers.incidents.children.forEach((group, idx) => {
      const beacon = group.userData.beacon;
      if (beacon) {
        beacon.rotation.y += 0.02;
        beacon.rotation.z += 0.01;
        beacon.position.y = Math.sin(elapsedTime * 2 + idx) * 0.4;
      }
      const waveRing = group.userData.waveRing;
      if (waveRing) {
        const pulse = (elapsedTime * 1.8 + idx * 0.5) % 2.0;
        const s = 1 + pulse * 1.8;
        waveRing.scale.set(s, s, s);
        waveRing.material.opacity = Math.max(0, 0.9 - pulse / 2.0);
      }
    });

    // 3. Undulate Flood Mesh
    if (floodMesh) {
      floodMesh.position.y = 2.2 + Math.sin(elapsedTime * 1.5) * 0.3;
      floodMesh.rotation.z = Math.sin(elapsedTime * 0.4) * 0.05;
    }

    // 4. Subtle auto-rotation if idle
    if (options.autoRotate && !isDragging && !isPanning) {
      spherical.theta += 0.0008;
      updateCamera();
    }

    renderer.render(scene, camera);
  }
  animate();

  // Resize handler
  function onResize() {
    const nw = container.clientWidth || window.innerWidth;
    const nh = container.clientHeight || window.innerHeight;
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    renderer.setSize(nw, nh);
  }
  window.addEventListener('resize', onResize);

  // Layer control API
  function setLayerVisibility(layerName, visible) {
    if (layers[layerName]) {
      layers[layerName].visible = visible;
    }
  }

  // Camera presets
  function setPreset(name) {
    if (name === 'default' || name === 'overview') {
      target.set(0, 4, 0);
      spherical.radius = 120; spherical.theta = 0.3; spherical.phi = 0.85;
    } else if (name === 'risk' || name === 'sh39') {
      target.set(-10, 6, 5);
      spherical.radius = 50; spherical.theta = -0.6; spherical.phi = 0.45;
    } else if (name === 'traffic' || name === 'araku') {
      target.set(30, 8, 30);
      spherical.radius = 55; spherical.theta = 1.1; spherical.phi = 0.55;
    }
    updateCamera();
  }

  return {
    scene,
    camera,
    renderer,
    layers,
    setLayerVisibility,
    setPreset,
    destroy: () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (dom.parentNode) dom.parentNode.removeChild(dom);
    }
  };
}

window.MapEngine = {
  create3DScene,
  initMap,
  addRoads,
  addIncidents,
  addVehicles,
  animateVehicles,
  addFloodZone,
  drawAlternateRoutes,
  addRegionLabels,
  REGION_NAMES_NE,
  CITY_DATA_NE,
  HIGHWAY_DATA_NE,
  ROAD_DATA,
  INCIDENT_DATA,
  VEHICLE_DATA,
  DISTRICT_DATA,
  MAP_CONFIG,
};
