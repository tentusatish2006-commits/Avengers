/* VIEW ALTERNATE ROUTES + GENERATE REPORT (PDF) */
(function () {
  'use strict';

  var CITY = {
    guwahati: [26.1445, 91.7362], shillong: [25.5788, 91.8933], imphal: [24.817, 93.9368],
    kohima: [25.6751, 94.1086], aizawl: [23.7271, 92.7176], agartala: [23.8315, 91.2868],
    itanagar: [27.0844, 93.6053], gangtok: [27.3389, 88.6065], silchar: [24.8333, 92.7789],
    tawang: [27.586, 91.859], dimapur: [25.9063, 93.7276], tezpur: [26.6338, 92.8], nagaon: [26.3464, 92.684]
  };

  async function osrm(a, b) {
    try {
      var url = 'https://router.project-osrm.org/route/v1/driving/' + a[1] + ',' + a[0] + ';' + b[1] + ',' + b[0] + '?overview=full&geometries=geojson';
      var res = await fetch(url);
      var json = await res.json();
      if (json.routes && json.routes[0]) return json.routes[0].geometry.coordinates.map(function (c) { return [c[1], c[0]]; });
    } catch (e) {}
    return [a, b];
  }

  async function showSafestRoutesOnMap() {
    var map = (window.MapEngine && MapEngine.map) || window._srPredMap || null;
    var srcEl = document.getElementById('source');
    var dstEl = document.getElementById('dest');
    var sourceKey = srcEl ? srcEl.value : 'guwahati';
    var destKey = dstEl ? dstEl.value : 'shillong';
    var source = srcEl && srcEl.options[srcEl.selectedIndex] ? srcEl.options[srcEl.selectedIndex].text : 'Guwahati';
    var destination = dstEl && dstEl.options[dstEl.selectedIndex] ? dstEl.options[dstEl.selectedIndex].text : 'Shillong';
    var from = CITY[sourceKey] || CITY.guwahati;
    var to = CITY[destKey] || CITY.shillong;

    if (!map || !window.L) {
      window.location.href = 'alternate-routes.html?from=' + encodeURIComponent(sourceKey) + '&to=' + encodeURIComponent(destKey);
      return;
    }

    if (window._srAltLayers) {
      window._srAltLayers.forEach(function (l) { try { map.removeLayer(l); } catch (e) {} });
    }
    window._srAltLayers = [];

    var primary = await osrm(from, to);
    var safeLine = L.polyline(primary, { color: '#00ff88', weight: 7, opacity: 0.95 }).addTo(map);
    safeLine.bindPopup('<b>Safest route</b><br>' + source + ' \u2192 ' + destination);
    window._srAltLayers.push(safeLine);

    var vias = [[26.35, 92.7], [24.83, 92.78], [25.9, 93.73]];
    for (var i = 0; i < vias.length; i++) {
      var leg1 = await osrm(from, vias[i]);
      var leg2 = await osrm(vias[i], to);
      var alt = L.polyline(leg1.concat(leg2.slice(1)), { color: '#ff9500', weight: 5, opacity: 0.8, dashArray: '10 8' }).addTo(map);
      alt.bindPopup('<b>Moderate alternate ' + (i + 1) + '</b>');
      window._srAltLayers.push(alt);
    }

    try { map.fitBounds(L.latLngBounds(primary), { padding: [50, 50] }); } catch (e) {}
    if (window.SmartRoute) SmartRoute.showToast('Safest (green) + moderate (orange) routes on map', 'success');
  }

  function generateRouteReport() {
    var srcEl = document.getElementById('source');
    var dstEl = document.getElementById('dest');
    var source = srcEl && srcEl.options[srcEl.selectedIndex] ? srcEl.options[srcEl.selectedIndex].text : 'Guwahati';
    var destination = dstEl && dstEl.options[dstEl.selectedIndex] ? dstEl.options[dstEl.selectedIndex].text : 'Shillong';
    var risk = (document.getElementById('risk-gauge-val') || {}).textContent || '-';
    var sev = (document.getElementById('risk-gauge-sub') || {}).textContent || '';
    var delay = (document.getElementById('val-delay') || {}).textContent || '-';
    var access = (document.getElementById('val-access') || {}).textContent || '-';
    var disrupt = (document.getElementById('val-disrupt') || {}).textContent || '-';
    var fname = 'NER-Route-Report.pdf';
    try {
      var JsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
      if (JsPDF) {
        var doc = new JsPDF();
        doc.setFontSize(16);
        doc.text('SmartRoute NER - AI Route Risk Report', 14, 18);
        doc.setFontSize(10);
        doc.text('Generated: ' + new Date().toLocaleString(), 14, 28);
        doc.text('Region: North Eastern Region (NER)', 14, 36);
        doc.setFontSize(12);
        doc.text('Corridor: ' + source + ' -> ' + destination, 14, 48);
        doc.setFontSize(11);
        doc.text('Risk score: ' + risk + '%  ' + sev, 14, 58);
        doc.text('Delay: ' + delay, 14, 66);
        doc.text('Accessibility: ' + access, 14, 74);
        doc.text('Disruption: ' + disrupt, 14, 82);
        doc.setFontSize(10);
        doc.text('Recommendation: Prefer green/safe corridors; use orange', 14, 96);
        doc.text('moderate alternates when primary is disrupted.', 14, 102);
        doc.save(fname);
        if (window.SmartRoute) SmartRoute.showToast('PDF report downloaded', 'success');
        return;
      }
    } catch (e) {}
    var w = window.open('', '_blank');
    if (!w) {
      if (window.SmartRoute) SmartRoute.showToast('Allow pop-ups to download PDF', 'warn');
      return;
    }
    w.document.write('<html><body style="font-family:Arial;padding:24px"><h1>SmartRoute NER Report</h1><p>' + new Date().toLocaleString() + '</p><p>' + source + ' to ' + destination + '</p><p>Risk: ' + risk + '%</p></body></html>');
    w.document.close();
    setTimeout(function () { w.print(); }, 300);
    if (window.SmartRoute) SmartRoute.showToast('Print - Save as PDF', 'success');
  }

  window.srViewAlternateRoutes = showSafestRoutesOnMap;
  window.srGenerateRouteReport = generateRouteReport;

  function bind() {
    var alt = document.getElementById('btn-view-alt');
    if (alt) {
      alt.setAttribute('href', 'javascript:void(0)');
      alt.onclick = function (e) { e.preventDefault(); e.stopPropagation(); showSafestRoutesOnMap(); return false; };
    }
    var alt2 = document.getElementById('btn-view-alt-2');
    if (alt2) {
      alt2.onclick = function (e) { e.preventDefault(); showSafestRoutesOnMap(); return false; };
    }
    document.querySelectorAll('a[href="alternate-routes.html"], a[href*="alternate-routes"]').forEach(function (a) {
      if (a.id === 'btn-view-alt' || a.id === 'btn-view-alt-2') return;
      a.onclick = function (e) { e.preventDefault(); showSafestRoutesOnMap(); return false; };
    });
    ['btn-gen-report', 'btn-gen-report-2'].forEach(function (id) {
      var btn = document.getElementById(id);
      if (btn) {
        btn.onclick = function (e) { e.preventDefault(); e.stopPropagation(); generateRouteReport(); return false; };
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
  setTimeout(bind, 400);
  setTimeout(bind, 1200);
})();
