/* AI Route Prediction — road geometry via backend OpenRouteService proxy */
(function () {
  var CITY_COORDS = {
    guwahati: [26.1445, 91.7362], shillong: [25.5788, 91.8933], imphal: [24.817, 93.9368],
    kohima: [25.6751, 94.1086], aizawl: [23.7271, 92.7176], agartala: [23.8315, 91.2868],
    itanagar: [27.0844, 93.6053], gangtok: [27.3389, 88.6065], silchar: [24.8333, 92.7789],
    tawang: [27.586, 91.859], dimapur: [25.9063, 93.7276]
  };
  var analysisLayers = [], analysisMarkers = [];

  function hashScore(a, b) {
    var s = String(a) + '|' + String(b), h = 0;
    for (var i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i) | 0;
    return Math.abs(h);
  }

  function localPredict(sourceLabel, destLabel, vehicleType, priority) {
    var h = hashScore(sourceLabel, destLabel);
    var highKeys = ['tawang', 'itanagar', 'shillong', 'kohima', 'aizawl', 'imphal', 'gangtok'];
    var srcL = sourceLabel.toLowerCase(), dstL = destLabel.toLowerCase();
    var isHigh = highKeys.some(function (k) { return srcL.indexOf(k) >= 0 || dstL.indexOf(k) >= 0; });
    var weather = isHigh ? 55 + (h % 35) : 15 + (h % 40);
    var slope = isHigh ? 50 + ((h >> 3) % 35) : 12 + ((h >> 3) % 30);
    var condition = 25 + ((h >> 5) % 50);
    var traffic = 20 + ((h >> 7) % 45);
    var risk = Math.round(0.35 * weather + 0.25 * slope + 0.20 * condition + 0.20 * traffic);
    risk = Math.max(12, Math.min(98, risk));
    if (priority && /crit/i.test(priority)) risk = Math.min(98, risk + 8);
    var sev = risk > 70 ? 'CRITICAL' : (risk > 45 ? 'HIGH' : (risk > 30 ? 'MODERATE' : 'LOW'));
    return {
      status: 'success', risk_score: risk, severity: sev,
      breakdown: {
        road_condition: condition, weather_risk: weather, traffic_load: traffic,
        flood_risk: Math.max(10, weather - 8), landslide_risk: Math.max(8, slope - 5)
      },
      metrics: {
        est_delay: '+' + Math.floor(risk / 25) + 'h ' + ((risk % 25) * 2) + 'm',
        road_accessibility_pct: Math.max(15, 100 - risk),
        disruption_probability: risk > 60 ? 'HIGH' : 'LOW',
        rec_departure: risk < 40 ? 'Immediate' : '06:00 AM'
      }
    };
  }

  async function fetchRoadGeometry(from, to, withAlts) {
    try {
      if (window.SmartRouteAPI && SmartRouteAPI.getRouteDirections) {
        var res = await SmartRouteAPI.getRouteDirections(from, to, { alternatives: !!withAlts, alternative_count: 2 });
        if (res && res.status === 'success' && res.primary && res.primary.coordinates && res.primary.coordinates.length > 1) {
          return {
            coordinates: res.primary.coordinates,
            distance_km: res.primary.distance_km,
            duration_min: res.primary.duration_min,
            alternates: (res.routes || []).slice(1),
            provider: 'openrouteservice'
          };
        }
      } else {
        var base = (window.SmartRouteAPI && SmartRouteAPI.baseUrl) || 'http://127.0.0.1:5000/api';
        var r = await fetch(base + '/routing/directions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            start: { lat: from[0], lng: from[1] },
            end: { lat: to[0], lng: to[1] },
            alternatives: !!withAlts
          })
        });
        var res2 = await r.json();
        if (res2 && res2.status === 'success' && res2.primary && res2.primary.coordinates && res2.primary.coordinates.length > 1) {
          return {
            coordinates: res2.primary.coordinates,
            distance_km: res2.primary.distance_km,
            duration_min: res2.primary.duration_min,
            alternates: (res2.routes || []).slice(1),
            provider: 'openrouteservice'
          };
        }
      }
    } catch (e) { console.warn('[routing] backend unavailable', e); }

    try {
      var url = 'https://router.project-osrm.org/route/v1/driving/' +
        from[1] + ',' + from[0] + ';' + to[1] + ',' + to[0] + '?overview=full&geometries=geojson';
      var res3 = await fetch(url);
      var json = await res3.json();
      if (json && json.routes && json.routes[0] && json.routes[0].geometry) {
        var coords = json.routes[0].geometry.coordinates.map(function (c) { return [c[1], c[0]]; });
        return {
          coordinates: coords,
          distance_km: json.routes[0].distance ? +(json.routes[0].distance / 1000).toFixed(2) : null,
          duration_min: json.routes[0].duration ? +(json.routes[0].duration / 60).toFixed(1) : null,
          alternates: [],
          provider: 'osrm-fallback'
        };
      }
    } catch (e2) {}

    var pts = [];
    for (var s = 0; s <= 40; s++) {
      var t = s / 40, offset = Math.sin(t * Math.PI) * 0.04;
      pts.push([from[0] + (to[0] - from[0]) * t + offset * 0.3, from[1] + (to[1] - from[1]) * t + offset]);
    }
    return { coordinates: pts, distance_km: null, duration_min: null, alternates: [], provider: 'offline' };
  }

  function clearAnalysis() {
    var map = window.MapEngine && MapEngine.map;
    if (!map) return;
    analysisLayers.forEach(function (l) { try { map.removeLayer(l); } catch (e) {} });
    analysisMarkers.forEach(function (m) { try { map.removeLayer(m); } catch (e) {} });
    analysisLayers = []; analysisMarkers = [];
  }

  async function drawPair(srcKey, dstKey, risk, sourceLabel, destLabel) {
    var map = window.MapEngine && MapEngine.map;
    if (!map || !window.L) return;
    clearAnalysis();
    var from = CITY_COORDS[srcKey] || CITY_COORDS.guwahati;
    var to = CITY_COORDS[dstKey] || CITY_COORDS.shillong;
    var color = risk > 70 ? '#ff3b3b' : (risk > 45 ? '#ff9500' : '#00ff88');
    var geom = await fetchRoadGeometry(from, to, true);
    var coords = geom.coordinates || [];
    var distLabel = geom.distance_km != null ? (geom.distance_km + ' km') : '';
    var durLabel = geom.duration_min != null ? (geom.duration_min + ' min') : '';
    var meta = [distLabel, durLabel, 'Risk: ' + risk + '%'].filter(Boolean).join(' · ');
    var line = L.polyline(coords, { color: color, weight: 6, opacity: 0.92, lineCap: 'round', lineJoin: 'round' }).addTo(map);
    line.bindPopup('<b>' + sourceLabel + ' → ' + destLabel + '</b><br>' + meta + '<br><small>via ' + (geom.provider || 'routing') + '</small>');
    analysisLayers.push(line);
    var alts = geom.alternates || [];
    if (alts.length) {
      alts.forEach(function (alt, i) {
        if (!alt.coordinates || alt.coordinates.length < 2) return;
        var altLine = L.polyline(alt.coordinates, {
          color: i === 0 ? '#ff9500' : '#ff3b3b', weight: 4, opacity: 0.75, dashArray: '8 10'
        }).addTo(map);
        var am = [];
        if (alt.distance_km != null) am.push(alt.distance_km + ' km');
        if (alt.duration_min != null) am.push(alt.duration_min + ' min');
        altLine.bindPopup('<b>Alternate ' + (i + 1) + '</b><br>' + am.join(' · '));
        analysisLayers.push(altLine);
      });
    } else {
      var mid = coords[Math.floor(coords.length / 2)] || from;
      var via = [mid[0] + 0.12, mid[1] - 0.1];
      var g2 = await fetchRoadGeometry(from, via, false);
      var g3 = await fetchRoadGeometry(via, to, false);
      var a1 = g2.coordinates || [], a2 = g3.coordinates || [];
      if (a1.length && a2.length) {
        var altLine = L.polyline(a1.concat(a2.slice(1)), { color: '#ff9500', weight: 4, opacity: 0.75, dashArray: '8 10' }).addTo(map);
        analysisLayers.push(altLine);
      }
    }
    analysisMarkers.push(
      L.circleMarker(from, { radius: 8, color: '#fff', fillColor: '#00d4ff', fillOpacity: 1, weight: 2 }).addTo(map).bindPopup('Source: ' + sourceLabel),
      L.circleMarker(to, { radius: 8, color: '#fff', fillColor: '#ff3b3b', fillOpacity: 1, weight: 2 }).addTo(map).bindPopup('Destination: ' + destLabel)
    );
    try { map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] }); } catch (e) {}
  }

  function colorFor(v) {
    return v > 70 ? '#ff3b3b' : (v > 45 ? '#ff9500' : '#00ff88');
  }
  function setBar(id, value) {
    var bar = document.getElementById('bar-' + id);
    var label = document.getElementById('val-' + id);
    if (bar) { bar.style.width = value + '%'; bar.style.background = colorFor(value); }
    if (label) label.textContent = value + '%';
  }

  window.analyzeRoute = async function analyzeRoute() {
    var scanner = document.getElementById('scanner');
    var initialState = document.getElementById('initial-state');
    var resultsState = document.getElementById('results-state');
    var srcEl = document.getElementById('source');
    var dstEl = document.getElementById('dest');
    var sourceKey = srcEl ? srcEl.value : 'guwahati';
    var destKey = dstEl ? dstEl.value : 'shillong';
    var source = srcEl ? srcEl.options[srcEl.selectedIndex].text : 'Guwahati';
    var destination = dstEl ? dstEl.options[dstEl.selectedIndex].text : 'Shillong';
    var vehicleType = (document.getElementById('vehicle-type') || {}).value || 'Medicine Truck';
    var priority = (document.getElementById('priority') || {}).value || 'Critical';

    if (sourceKey === destKey) {
      if (window.SmartRoute) SmartRoute.showToast('Source and destination must be different', 'warn');
      return;
    }

    if (scanner) scanner.classList.add('active');
    if (initialState) initialState.style.display = 'none';
    if (resultsState) resultsState.classList.add('active');

    var data = null;
    try {
      if (window.SmartRouteAPI && SmartRouteAPI.predictRouteRisk) {
        data = await SmartRouteAPI.predictRouteRisk(source, destination, vehicleType, priority);
      }
    } catch (e) {}

    await new Promise(function (r) { setTimeout(r, 400); });
    if (scanner) scanner.classList.remove('active');

    if (!data || data.status !== 'success' || data.risk_score == null) {
      data = localPredict(source, destination, vehicleType, priority);
    }

    var score = Math.round(data.risk_score || 0);
    var sev = (data.severity || 'HIGH').toUpperCase();
    var gaugeVal = document.getElementById('risk-gauge-val');
    var gaugeSub = document.getElementById('risk-gauge-sub');
    var gauge = document.getElementById('risk-gauge');
    if (gaugeVal) gaugeVal.textContent = score;
    if (gaugeSub) gaugeSub.textContent = '% RISK - ' + sev;
    var gaugeColor = score < 35 ? 'var(--status-safe)' : (score < 55 ? 'var(--status-warn)' : 'var(--status-danger)');
    if (gauge) gauge.style.background = 'conic-gradient(' + gaugeColor + ' ' + score + '%, rgba(255,255,255,0.1) 0)';

    var b = data.breakdown || {};
    setBar('road', Math.round(b.road_condition || 0));
    setBar('weather', Math.round(b.weather_risk || 0));
    setBar('traffic', Math.round(b.traffic_load || 0));
    setBar('flood', Math.round(b.flood_risk || 0));
    setBar('landslide', Math.round(b.landslide_risk || 0));

    var m = data.metrics || {};
    var delayEl = document.getElementById('val-delay');
    var accessEl = document.getElementById('val-access');
    var disruptEl = document.getElementById('val-disrupt');
    var departEl = document.getElementById('val-departure');
    if (delayEl) delayEl.textContent = m.est_delay || '-';
    if (accessEl) accessEl.textContent = (m.road_accessibility_pct || 0) + '%';
    if (disruptEl) disruptEl.textContent = m.disruption_probability || '-';
    if (departEl) departEl.textContent = m.rec_departure || '-';

    await drawPair(sourceKey, destKey, score, source, destination);
    if (window.SmartRoute) SmartRoute.showToast('Route: ' + source + ' to ' + destination + ' (' + sev + ')', 'success');
  };
})();
