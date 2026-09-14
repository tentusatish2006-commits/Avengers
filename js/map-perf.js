/** Fast map helpers: non-blocking route upgrade */
(function (g) {
  'use strict';
  g.SmartRouteMapPerf = {
    // Draw simple polylines immediately; optional OSRM upgrade later
    quickLine: function (map, points, style) {
      if (!map || !window.L || !points || points.length < 2) return null;
      return L.polyline(points, style || { color: '#00ff88', weight: 5, opacity: 0.9 }).addTo(map);
    }
  };
})(window);
