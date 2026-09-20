/* Unique OSRM routes per source/destination for AI Route Prediction */
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

  async function fetchOsrm(from, to) {
    var url = 'https://router.project-osrm.org/route/v1/driving/' +
      from[1] + ',' + from[0] + ';' + to[1] + ',' + to[0] + '?overview=full&geometries=geojson';
    try {
      var res = await fetch(url);
      var json = await res.json();
      if (json && json.routes && json.routes[0] && json.routes[0].geometry) {
        return json.routes[0].geometry.coordinates.map(function (c) { return [c[1], c[0]]; });
      }
    } catch (e) {}
    var pts = [];
    for (var s = 0; s <= 40; s++) {
      var t = s / 40, offset = Math.sin(t * Math.PI) * 0.04;
      pts.push([from[0] + (to[0] - from[0]) * t + offset * 0.3, from[1] + (to[1] - from[1]) * t + offset]);
    }
    return pts;
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
    var coords = await fetchOsrm(from, to);
    var line = L.polyline(coords, { color: color, weight: 6, opacity: 0.92, lineCap: 'round', lineJoin: 'round' }).addTo(map);
    line.bindPopup('<b>' + sourceLabel + ' to ' + destLabel + '</b><br>Risk: ' + risk + '%');
    analysisLayers.push(line);
    var mid = coords[Math.floor(coords.length / 2)] || from;
    var via = [mid[0] + 0.12, mid[1] - 0.1];
    var a1 = await fetchOsrm(from, via), a2 = await fetchOsrm(via, to);
    var altLine = L.polyline(a1.concat(a2.slice(1)), { color: '#ff9500', weight: 4, opacity: 0.75, dashArray: '8 10' }).addTo(map);
    analysisLayers.push(altLine);
    analysisMarkers.push(
      L.circleMarker(from, { radius: 8, color: '#fff', fillColor: '#00d4ff', fillOpacity: 1, weight: 2 }).addTo(map).bindPopup('Source: ' + sourceLabel),
      L.circleMarker(to, { radius: 8, color: '#fff', fillColor: '#ff3b3b', fillOpacity: 1, weight: 2 }).addTo(map).bindPopup('Destination: ' + destLabel)
    );
    try { map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] }); } catch (e) { map.setView(from, 8); }
  }

  function colorFor(value) {
    if (value >= 70) return 'var(--status-danger)';
    if (value >= 40) return 'var(--status-warn)';
    return 'var(--status-safe)';
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

    await new Promise(function (r) { setTimeout(r, 500); });
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
    if (gaugeVal) gaugeVal.style.color = gaugeColor;

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

(function () {
  function generateRouteReport() {
    var srcEl = document.getElementById('source');
    var dstEl = document.getElementById('dest');
    var source = srcEl ? srcEl.options[srcEl.selectedIndex].text : 'Guwahati';
    var destination = dstEl ? dstEl.options[dstEl.selectedIndex].text : 'Shillong';
    var vehicle = (document.getElementById('vehicle-type') || {}).value || 'Medicine Truck';
    var priority = (document.getElementById('priority') || {}).value || 'Critical';
    var risk = (document.getElementById('risk-gauge-val') || {}).textContent || '-';
    var sev = (document.getElementById('risk-gauge-sub') || {}).textContent || '';
    var delay = (document.getElementById('val-delay') || {}).textContent || '-';
    var access = (document.getElementById('val-access') || {}).textContent || '-';
    var disrupt = (document.getElementById('val-disrupt') || {}).textContent || '-';
    var depart = (document.getElementById('val-departure') || {}).textContent || '-';
    var road = (document.getElementById('val-road') || {}).textContent || '-';
    var weather = (document.getElementById('val-weather') || {}).textContent || '-';
    var traffic = (document.getElementById('val-traffic') || {}).textContent || '-';
    var flood = (document.getElementById('val-flood') || {}).textContent || '-';
    var landslide = (document.getElementById('val-landslide') || {}).textContent || '-';
    var lines = [
      'SmartRoute NER - AI Route Risk Report',
      '=====================================',
      'Generated: ' + new Date().toLocaleString(),
      '',
      'Corridor: ' + source + ' to ' + destination,
      'Vehicle: ' + vehicle,
      'Priority: ' + priority,
      '',
      'Overall Risk: ' + risk + '%  ' + sev,
      'Est. Delay: ' + delay,
      'Road Accessibility: ' + access,
      'Disruption Probability: ' + disrupt,
      'Recommended Departure: ' + depart,
      '',
      'Risk Breakdown',
      '--------------',
      'Road Condition: ' + road,
      'Weather Risk: ' + weather,
      'Traffic Load: ' + traffic,
      'Flood Risk: ' + flood,
      'Landslide Risk: ' + landslide,
      '',
      'Recommendation: Prefer green/safe corridors; use orange alternate when primary is disrupted.',
      'Region: North Eastern Region (NER)'
    ];
    var blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'NER-Route-Report.txt';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 400);
    if (window.SmartRoute) SmartRoute.showToast('Route report downloaded', 'success');
    try {
      var list = JSON.parse(localStorage.getItem('sr_route_reports') || '[]');
      list.unshift({ id: 'RR-' + Date.now(), source: source, destination: destination, risk: risk, at: new Date().toISOString() });
      localStorage.setItem('sr_route_reports', JSON.stringify(list.slice(0, 50)));
    } catch (e) {}
  }

  function wireButtons() {
    document.querySelectorAll('a[href="alternate-routes.html"], a[href*="alternate-routes"]').forEach(function (a) {
      if (a._srAltWired) return;
      a._srAltWired = true;
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var src = document.getElementById('source');
        var dst = document.getElementById('dest');
        var q = '';
        if (src && dst) q = '?from=' + encodeURIComponent(src.value) + '&to=' + encodeURIComponent(dst.value);
        window.location.href = 'alternate-routes.html' + q;
      });
    });
    var btn = document.getElementById('btn-gen-report');
    if (btn && !btn._srWired) {
      btn._srWired = true;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        generateRouteReport();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireButtons);
  } else {
    wireButtons();
  }
  setTimeout(wireButtons, 1000);
})();
