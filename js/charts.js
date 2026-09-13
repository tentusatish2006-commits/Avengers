/* SmartRoute charts — North Eastern Region */
(function (global) {
  'use strict';

  function barColors(n) {
    var palette = ['#00d4ff', '#00ff88', '#ff9500', '#ff3b3b', '#a78bfa', '#f472b6', '#38bdf8', '#fbbf24'];
    return Array.from({ length: n }, function (_, i) { return palette[i % palette.length]; });
  }

  function accessibilityByDistrict(canvasId) {
    var el = document.getElementById(canvasId);
    if (!el || typeof Chart === 'undefined') return null;
    return new Chart(el, {
      type: 'bar',
      data: {
        labels: ['Guwahati', 'Shillong', 'Imphal', 'Kohima', 'Agartala', 'Aizawl', 'Itanagar', 'Gangtok'],
        datasets: [{
          label: 'Accessibility %',
          data: [78, 64, 58, 52, 71, 49, 45, 68],
          backgroundColor: barColors(8)
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, max: 100, ticks: { color: '#8fa3b8' }, grid: { color: 'rgba(255,255,255,0.06)' } },
          x: { ticks: { color: '#8fa3b8' }, grid: { display: false } }
        }
      }
    });
  }

  function incidentTrend(canvasId) {
    var el = document.getElementById(canvasId);
    if (!el || typeof Chart === 'undefined') return null;
    return new Chart(el, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Incidents (NER)',
          data: [12, 15, 9, 18, 14, 11, 16],
          borderColor: '#00d4ff',
          backgroundColor: 'rgba(0,212,255,0.15)',
          fill: true,
          tension: 0.35
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#c8d8e8' } } },
        scales: {
          y: { ticks: { color: '#8fa3b8' }, grid: { color: 'rgba(255,255,255,0.06)' } },
          x: { ticks: { color: '#8fa3b8' }, grid: { display: false } }
        }
      }
    });
  }

  function riskPie(canvasId) {
    var el = document.getElementById(canvasId);
    if (!el || typeof Chart === 'undefined') return null;
    return new Chart(el, {
      type: 'doughnut',
      data: {
        labels: ['Safe', 'Moderate', 'Disrupted'],
        datasets: [{
          data: [52, 31, 17],
          backgroundColor: ['#00ff88', '#ff9500', '#ff3b3b'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom', labels: { color: '#c8d8e8' } } }
      }
    });
  }

  // Legacy helper used by analytics.html
  function districtAccessChart(canvasId) {
    return accessibilityByDistrict(canvasId);
  }

  global.SmartRouteCharts = {
    accessibilityByDistrict: accessibilityByDistrict,
    incidentTrend: incidentTrend,
    riskPie: riskPie,
    districtAccessChart: districtAccessChart
  };
})(window);
