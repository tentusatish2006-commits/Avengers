/* SMARTROUTE MAP ENGINE (NER) — OSRM road routes first (green/orange/red on roads) */
(function (global) {
  'use strict';

  var CITIES = {
    Guwahati: [26.1445, 91.7362],
    Shillong: [25.5788, 91.8933],
    Tawang: [27.586, 91.859],
    Imphal: [24.817, 93.9368],
    Kohima: [25.6751, 94.1086],
    Dimapur: [25.9063, 93.7276],
    Silchar: [24.8333, 92.7789],
    Aizawl: [23.7271, 92.7176],
    Agartala: [23.8315, 91.2868],
    Itanagar: [27.0844, 93.6053],
    Tezpur: [26.6338, 92.8],
    Nagaon: [26.3464, 92.684],
    Jorhat: [26.7465, 94.2026],
    Bomdila: [27.2647, 92.424],
    Nongpoh: [25.903, 91.88]
  };

  // Intermediate towns approximate real highway corridors when OSRM is slow
  var ROUTE_DEFS = [
    { id: 'SAFE-1', name: 'Guwahati → Shillong (Safe)', status: 'safe', color: '#00ff88', weight: 6,
      waypoints: ['Guwahati', 'Nongpoh', 'Shillong'] },
    { id: 'MOD-1', name: 'Guwahati → Silchar → Aizawl (Alternate)', status: 'moderate', color: '#ff9500', weight: 5,
      waypoints: ['Guwahati', 'Nagaon', 'Silchar', 'Aizawl'] },
    { id: 'CRIT-1', name: 'Guwahati → Tawang (Critical)', status: 'critical', color: '#ff3b3b', weight: 5,
      waypoints: ['Guwahati', 'Tezpur', 'Bomdila', 'Tawang'] },
    { id: 'SAFE-2', name: 'Agartala → Silchar (Safe)', status: 'safe', color: '#00ff88', weight: 5,
      waypoints: ['Agartala', 'Silchar'] },
    { id: 'MOD-2', name: 'Dimapur → Kohima (Alternate)', status: 'moderate', color: '#ff9500', weight: 5,
      waypoints: ['Dimapur', 'Kohima'] },
    { id: 'CRIT-2', name: 'Jorhat → Itanagar (Critical)', status: 'critical', color: '#ff3b3b', weight: 5,
      waypoints: ['Jorhat', 'Itanagar'] }
  ];

  var INCIDENTS = [
    { id: 'I1', title: 'Landslide', lat: 27.58, lng: 91.86, severity: 'critical' },
    { id: 'I2', title: 'Flood watch', lat: 26.18, lng: 91.75, severity: 'high' },
    { id: 'I3', title: 'Road damage', lat: 25.58, lng: 91.89, severity: 'moderate' }
  ];

  var VEHICLES = [
    { id: 'VH-NE01', color: '#00d4ff', routeId: 'SAFE-1', progress: 0.1, speed: 0.00035 },
    { id: 'VH-NE02', color: '#00ff88', routeId: 'MOD-1', progress: 0.25, speed: 0.00028 },
    { id: 'VH-NE03', color: '#ff9500', routeId: 'CRIT-1', progress: 0.4, speed: 0.0003 },
    { id: 'VH-NE04', color: '#b050ff', routeId: 'SAFE-2', progress: 0.15, speed: 0.00032 }
  ];

  var MAP_CONFIG = {
    tileUrl: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    center: [26.2, 92.0],
    zoom: 7
  };

  var _routeLayers = {};
  var _routeCoords = {};
  var _vehicleMarkers = {};
  var _animRunning = false;
  var MapEngine = { map: null };

  function initMap(containerId, opts) {
    opts = opts || {};
    if (!global.L) return null;
    var el = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!el) return null;
    var map = L.map(el, { zoomControl: opts.zoomControl !== false }).setView(
      opts.center || MAP_CONFIG.center,
      opts.zoom || MAP_CONFIG.zoom
    );
    L.tileLayer(MAP_CONFIG.tileUrl, { maxZoom: 18, attribution: 'SmartRoute NER' }).addTo(map);
    MapEngine.map = map;
    setTimeout(function () { try { map.invalidateSize(); } catch (e) {} }, 200);
    return map;
  }

  async function fetchOsrmCoords(waypoints) {
    if (!waypoints || waypoints.length < 2) return null;
    try {
      var path = waypoints.map(function (p) { return p[1] + ',' + p[0]; }).join(';');
      var url = 'https://router.project-osrm.org/route/v1/driving/' + path + '?overview=full&geometries=geojson';
      var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var to = setTimeout(function () { if (ctrl) ctrl.abort(); }, 12000);
      var res = await fetch(url, ctrl ? { signal: ctrl.signal } : undefined);
      clearTimeout(to);
      if (!res.ok) return null;
      var data = await res.json();
      if (!data.routes || !data.routes[0]) return null;
      return data.routes[0].geometry.coordinates.map(function (x) { return [x[1], x[0]]; });
    } catch (e) {
      return null;
    }
  }

  /** Highway-style fallback (not pure straight): slight corridor bends */
  function densifyRoadLike(waypoints) {
    var out = [];
    for (var i = 0; i < waypoints.length - 1; i++) {
      var a = waypoints[i], b = waypoints[i + 1];
      var steps = 24;
      var latSpan = b[0] - a[0];
      var lngSpan = b[1] - a[1];
      for (var s = 0; s <= steps; s++) {
        var t = s / steps;
        // mild sine offset so path is not a single straight cut across terrain
        var offset = Math.sin(t * Math.PI) * 0.035 * (i % 2 === 0 ? 1 : -1);
        var lat = a[0] + latSpan * t + offset * (lngSpan === 0 ? 0.2 : 0);
        var lng = a[1] + lngSpan * t + offset * (latSpan === 0 ? 0.2 : 0.15);
        out.push([lat, lng]);
      }
    }
    return out;
  }

  function cityPoint(name) {
    return CITIES[name] || null;
  }

  function drawRouteLine(map, def, coords) {
    if (!map || !coords || coords.length < 2) return null;
    try { if (_routeLayers[def.id]) map.removeLayer(_routeLayers[def.id]); } catch (e) {}
    var line = L.polyline(coords, {
      color: def.color,
      weight: def.weight || 5,
      opacity: 0.92,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);
    line.bindPopup('<b>' + def.name + '</b><br>Status: ' + def.status);
    _routeLayers[def.id] = line;
    _routeCoords[def.id] = coords;
    return line;
  }

  async function resolveRoute(def) {
    var pts = def.waypoints.map(cityPoint).filter(Boolean);
    if (pts.length < 2) return null;
    var coords = await fetchOsrmCoords(pts);
    if (coords && coords.length > 2) {
      _routeCoords[def.id] = coords;
      return coords;
    }
    // Pairwise OSRM if multi-stop full request fails
    var merged = [];
    for (var i = 0; i < pts.length - 1; i++) {
      var seg = await fetchOsrmCoords([pts[i], pts[i + 1]]);
      if (seg && seg.length) {
        if (merged.length) seg = seg.slice(1);
        merged = merged.concat(seg);
      }
    }
    if (merged.length > 2) {
      _routeCoords[def.id] = merged;
      return merged;
    }
    var fb = densifyRoadLike(pts);
    _routeCoords[def.id] = fb;
    return fb;
  }

  async function loadAllRoutes(map) {
    map = map || MapEngine.map;
    if (!map) return {};

    // Wait for OSRM road geometry first (preferred)
    for (var i = 0; i < ROUTE_DEFS.length; i++) {
      var def = ROUTE_DEFS[i];
      try {
        var coords = await resolveRoute(def);
        if (coords) drawRouteLine(map, def, coords);
      } catch (e) {}
    }
    return _routeLayers;
  }

  function addRoads(map) {
    map = map || MapEngine.map;
    loadAllRoutes(map);
    return _routeLayers;
  }

  function addIncidents(map) {
    map = map || MapEngine.map;
    if (!map) return;
    INCIDENTS.forEach(function (inc) {
      var color = inc.severity === 'critical' ? '#ff3b3b' : (inc.severity === 'high' ? '#ff9500' : '#00d4ff');
      var icon = L.divIcon({
        className: '',
        html: '<div style="width:28px;height:28px;border-radius:50%;background:' + color + ';border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:14px;">⚠</div>',
        iconSize: [28, 28], iconAnchor: [14, 14]
      });
      L.marker([inc.lat, inc.lng], { icon: icon }).addTo(map).bindPopup('<b>' + inc.title + '</b>');
    });
  }

  function vehicleIcon(color) {
    return L.divIcon({
      className: '',
      html: '<div style="font-size:20px;filter:drop-shadow(0 0 4px ' + (color || '#00d4ff') + ')">🚛</div>',
      iconSize: [24, 24], iconAnchor: [12, 12]
    });
  }

  function pointAlong(coords, t) {
    if (!coords || coords.length < 2) return null;
    var total = coords.length - 1;
    var f = Math.max(0, Math.min(0.999, t)) * total;
    var i = Math.floor(f);
    var frac = f - i;
    var a = coords[i], b = coords[Math.min(i + 1, coords.length - 1)];
    return { latlng: [a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac] };
  }

  function addVehicles(map) {
    map = map || MapEngine.map;
    if (!map) return;
    VEHICLES.forEach(function (v) {
      var def = ROUTE_DEFS.find(function (d) { return d.id === v.routeId; });
      var pts = def ? def.waypoints.map(cityPoint).filter(Boolean) : [CITIES.Guwahati, CITIES.Shillong];
      var coords = _routeCoords[v.routeId] || densifyRoadLike(pts);
      var pos = pointAlong(coords, v.progress || 0) || { latlng: CITIES.Guwahati };
      var m = L.marker(pos.latlng, { icon: vehicleIcon(v.color) }).addTo(map);
      _vehicleMarkers[v.id] = { marker: m, vehicle: v, coords: coords };
    });
    animateVehicles();
  }

  function animateVehicles() {
    if (_animRunning) return;
    _animRunning = true;
    var last = 0;
    function tick(ts) {
      if (ts - last < 50) {
        requestAnimationFrame(tick);
        return;
      }
      last = ts;
      Object.keys(_vehicleMarkers).forEach(function (id) {
        var entry = _vehicleMarkers[id];
        if (!entry || !entry.coords) return;
        // keep path in sync when OSRM upgrades route
        if (_routeCoords[entry.vehicle.routeId]) entry.coords = _routeCoords[entry.vehicle.routeId];
        entry.vehicle.progress += entry.vehicle.speed || 0.0003;
        if (entry.vehicle.progress >= 1) entry.vehicle.progress = 0;
        var pos = pointAlong(entry.coords, entry.vehicle.progress);
        if (pos) entry.marker.setLatLng(pos.latlng);
      });
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  async function bootstrapMap(containerId) {
    var map = initMap(containerId);
    if (!map) return null;
    await loadAllRoutes(map);
    addIncidents(map);
    addVehicles(map);
    return map;
  }

  MapEngine.initMap = initMap;
  MapEngine.addRoads = addRoads;
  MapEngine.addIncidents = addIncidents;
  MapEngine.addVehicles = addVehicles;
  MapEngine.bootstrapMap = bootstrapMap;
  MapEngine.fetchOsrmCoords = fetchOsrmCoords;
  MapEngine.loadAllRoutes = loadAllRoutes;
  MapEngine.CITIES = CITIES;
  MapEngine.ROUTE_DEFS = ROUTE_DEFS;

  global.MapEngine = MapEngine;
})(window);
