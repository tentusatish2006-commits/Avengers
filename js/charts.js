/* ============================================================
   SMARTROUTE — CHART FACTORY
   Chart.js 3D-style chart helpers
   ============================================================ */

/* ── Global Chart.js Defaults ───────────────────────────────── */
function initChartDefaults() {
  if (typeof Chart === 'undefined') return;

  Chart.defaults.color = 'rgba(180,210,240,0.75)';
  Chart.defaults.font.family = "'Outfit', system-ui, sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.plugins.legend.labels.boxWidth = 10;
  Chart.defaults.plugins.legend.labels.boxHeight = 10;
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(5,12,28,0.95)';
  Chart.defaults.plugins.tooltip.borderColor = 'rgba(0,212,255,0.3)';
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.titleColor = '#e8f4ff';
  Chart.defaults.plugins.tooltip.bodyColor = 'rgba(180,210,240,0.8)';
  Chart.defaults.plugins.tooltip.padding = 12;
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
  Chart.defaults.scale.grid.color = 'rgba(255,255,255,0.05)';
  Chart.defaults.scale.border.color = 'rgba(255,255,255,0.1)';
  Chart.defaults.scale.ticks.color = 'rgba(180,210,240,0.5)';
}

/* ── Color Palettes ─────────────────────────────────────────── */
const CHART_COLORS = {
  cyan:     { main: '#00d4ff', bg: 'rgba(0,212,255,0.15)',  border: 'rgba(0,212,255,0.8)' },
  safe:     { main: '#00ff88', bg: 'rgba(0,255,136,0.15)',  border: 'rgba(0,255,136,0.8)' },
  warn:     { main: '#ff9500', bg: 'rgba(255,149,0,0.15)',  border: 'rgba(255,149,0,0.8)' },
  danger:   { main: '#ff3b3b', bg: 'rgba(255,59,59,0.15)',  border: 'rgba(255,59,59,0.8)' },
  moderate: { main: '#ffcc00', bg: 'rgba(255,204,0,0.15)',  border: 'rgba(255,204,0,0.8)' },
  info:     { main: '#4facfe', bg: 'rgba(79,172,254,0.15)', border: 'rgba(79,172,254,0.8)' },
  accent:   { main: '#7b61ff', bg: 'rgba(123,97,255,0.15)', border: 'rgba(123,97,255,0.8)' },
};


function resolveTarget(target) {
  if (!target) return { canvas: null, ctx: null };
  let canvas = null;
  if (typeof target === 'string') {
    canvas = document.getElementById(target);
  } else if (target instanceof HTMLElement) {
    canvas = target;
  } else if (target.canvas instanceof HTMLElement) {
    canvas = target.canvas;
  } else if (target.getContext) {
    canvas = target;
  }
  if (!canvas) return { canvas: null, ctx: null };
  const ctx = canvas.getContext ? canvas.getContext('2d') : canvas;
  return { canvas, ctx };
}

function makeGradient(ctx, color, alphaTop = 0.4, alphaBottom = 0.02) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, color.replace(')', `,${alphaTop})`).replace('rgb', 'rgba'));
  gradient.addColorStop(1, color.replace(')', `,${alphaBottom})`).replace('rgb', 'rgba'));
  return gradient;
}

/* ── Road Disruptions Bar Chart ─────────────────────────────── */
function createDisruptionsChart(canvasId) {
  const { canvas, ctx } = resolveTarget(canvasId);
  if (!canvas || !ctx) return;

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      datasets: [
        {
          label: 'Disruptions',
          data: [4, 7, 12, 8, 15, 6, 3],
          backgroundColor: [
            CHART_COLORS.safe.bg, CHART_COLORS.safe.bg,
            CHART_COLORS.warn.bg, CHART_COLORS.warn.bg,
            CHART_COLORS.danger.bg, CHART_COLORS.safe.bg,
            CHART_COLORS.safe.bg,
          ],
          borderColor: [
            CHART_COLORS.safe.border, CHART_COLORS.safe.border,
            CHART_COLORS.warn.border, CHART_COLORS.warn.border,
            CHART_COLORS.danger.border, CHART_COLORS.safe.border,
            CHART_COLORS.safe.border,
          ],
          borderWidth: 1.5,
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1200, easing: 'easeOutQuart' },
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, max: 20 },
      },
    },
  });
}

/* ── Accessibility Doughnut ─────────────────────────────────── */
function createAccessibilityChart(canvasId, accessible = 68, total = 100) {
  const { canvas, ctx } = resolveTarget(canvasId);
  if (!canvas || !ctx) return;

  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Accessible', 'Blocked', 'Partial'],
      datasets: [{
        data: [accessible, 100 - accessible - 15, 15],
        backgroundColor: [
          CHART_COLORS.safe.bg,
          CHART_COLORS.danger.bg,
          CHART_COLORS.moderate.bg,
        ],
        borderColor: [
          CHART_COLORS.safe.border,
          CHART_COLORS.danger.border,
          CHART_COLORS.moderate.border,
        ],
        borderWidth: 2,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      animation: { animateRotate: true, duration: 1500 },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 16 },
        },
      },
    },
  });
}

/* ── Rainfall vs Disruptions Line Chart ─────────────────────── */
function createRainfallChart(canvasId) {
  const { canvas, ctx } = resolveTarget(canvasId);
  if (!canvas || !ctx) return;

  const rainfallGrad = ctx.createLinearGradient(0,0,0,250);
  rainfallGrad.addColorStop(0, 'rgba(79,172,254,0.4)');
  rainfallGrad.addColorStop(1, 'rgba(79,172,254,0.02)');

  const disruptGrad = ctx.createLinearGradient(0,0,0,250);
  disruptGrad.addColorStop(0, 'rgba(255,59,59,0.4)');
  disruptGrad.addColorStop(1, 'rgba(255,59,59,0.02)');

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00'],
      datasets: [
        {
          label: 'Rainfall (mm)',
          data: [12, 18, 35, 48, 42, 55, 38, 25],
          borderColor: '#4facfe',
          backgroundColor: rainfallGrad,
          fill: true,
          tension: 0.45,
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: '#4facfe',
          pointBorderColor: 'rgba(5,12,28,1)',
          pointBorderWidth: 2,
        },
        {
          label: 'Disruptions',
          data: [1, 2, 5, 8, 7, 12, 9, 6],
          borderColor: '#ff3b3b',
          backgroundColor: disruptGrad,
          fill: true,
          tension: 0.45,
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: '#ff3b3b',
          pointBorderColor: 'rgba(5,12,28,1)',
          pointBorderWidth: 2,
          yAxisID: 'y1',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1500, easing: 'easeOutQuart' },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top' },
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' } },
        y: {
          type: 'linear', position: 'left',
          title: { display: true, text: 'Rainfall (mm)', color: '#4facfe' },
        },
        y1: {
          type: 'linear', position: 'right',
          title: { display: true, text: 'Disruptions', color: '#ff3b3b' },
          grid: { drawOnChartArea: false },
        },
      },
    },
  });
}

/* ── District Accessibility Bar ─────────────────────────────── */
function createDistrictChart(canvasId) {
  const { canvas, ctx } = resolveTarget(canvasId);
  if (!canvas || !ctx) return;

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Vizag', 'Alluri SR', 'Parvathipuram', 'Anakapalli', 'Eluru'],
      datasets: [{
        label: 'Accessibility %',
        data: [68, 42, 71, 91, 94],
        backgroundColor: [
          CHART_COLORS.warn.bg,
          CHART_COLORS.danger.bg,
          CHART_COLORS.moderate.bg,
          CHART_COLORS.safe.bg,
          CHART_COLORS.safe.bg,
        ],
        borderColor: [
          CHART_COLORS.warn.border,
          CHART_COLORS.danger.border,
          CHART_COLORS.moderate.border,
          CHART_COLORS.safe.border,
          CHART_COLORS.safe.border,
        ],
        borderWidth: 1.5,
        borderRadius: 8,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      animation: { duration: 1400, easing: 'easeOutQuart' },
      plugins: { legend: { display: false } },
      scales: {
        x: { min: 0, max: 100, title: { display: true, text: 'Accessibility (%)' } },
        y: { grid: { display: false } },
      },
    },
  });
}

/* ── Incident Frequency Polar ───────────────────────────────── */
function createIncidentTypeChart(canvasId) {
  const { canvas, ctx } = resolveTarget(canvasId);
  if (!canvas || !ctx) return;

  return new Chart(ctx, {
    type: 'polarArea',
    data: {
      labels: ['Landslide', 'Flood', 'Road Damage', 'Bridge Issue', 'Other'],
      datasets: [{
        data: [8, 6, 12, 3, 4],
        backgroundColor: [
          CHART_COLORS.warn.bg,
          CHART_COLORS.info.bg,
          CHART_COLORS.moderate.bg,
          CHART_COLORS.accent.bg,
          CHART_COLORS.danger.bg,
        ],
        borderColor: [
          CHART_COLORS.warn.border,
          CHART_COLORS.info.border,
          CHART_COLORS.moderate.border,
          CHART_COLORS.accent.border,
          CHART_COLORS.danger.border,
        ],
        borderWidth: 1.5,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { animateRotate: true, duration: 1500 },
      scales: {
        r: {
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { backdropColor: 'transparent', stepSize: 3 },
        },
      },
      plugins: {
        legend: { position: 'right', labels: { padding: 14 } },
      },
    },
  });
}

/* ── Vehicle Activity Line ──────────────────────────────────── */
function createVehicleActivityChart(canvasId) {
  const { canvas, ctx } = resolveTarget(canvasId);
  if (!canvas || !ctx) return;

  const grad = ctx.createLinearGradient(0,0,0,200);
  grad.addColorStop(0, 'rgba(0,212,255,0.35)');
  grad.addColorStop(1, 'rgba(0,212,255,0.02)');

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array.from({length: 24}, (_,i) => `${String(i).padStart(2,'0')}:00`),
      datasets: [{
        label: 'Active Vehicles',
        data: [45,38,32,28,30,42,68,95,112,126,118,110,105,98,112,120,115,108,92,78,65,58,52,48],
        borderColor: '#00d4ff',
        backgroundColor: grad,
        fill: true,
        tension: 0.5,
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 5,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1600 },
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } },
        y: { beginAtZero: true },
      },
    },
  });
}

/* ── Response Time Bar ──────────────────────────────────────── */
function createResponseTimeChart(canvasId) {
  const { canvas, ctx } = resolveTarget(canvasId);
  if (!canvas || !ctx) return;

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep'],
      datasets: [{
        label: 'Avg Response (min)',
        data: [42, 38, 35, 40, 28, 32, 25, 30, 22],
        backgroundColor: CHART_COLORS.cyan.bg,
        borderColor: CHART_COLORS.cyan.border,
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1300, easing: 'easeOutBounce' },
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, title: { display: true, text: 'Minutes' } },
      },
    },
  });
}

/* ── Risk Gauge (Arc) ───────────────────────────────────────── */
function createRiskGauge(canvasId, riskPct) {
  const { canvas, ctx } = resolveTarget(canvasId);
  if (!canvas || !ctx) return;

  const color = riskPct >= 75 ? '#ff3b3b' : riskPct >= 50 ? '#ff9500' : riskPct >= 25 ? '#ffcc00' : '#00ff88';
  const bgColor = riskPct >= 75 ? 'rgba(255,59,59,0.1)' : riskPct >= 50 ? 'rgba(255,149,0,0.1)' : riskPct >= 25 ? 'rgba(255,204,0,0.1)' : 'rgba(0,255,136,0.1)';

  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [riskPct, 100 - riskPct],
        backgroundColor: [color, 'rgba(255,255,255,0.05)'],
        borderColor: [color, 'transparent'],
        borderWidth: [2, 0],
        hoverOffset: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '78%',
      rotation: -90,
      circumference: 180,
      animation: { animateRotate: true, duration: 1500, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
    },
  });
}

/* ── Export ─────────────────────────────────────────────────── */
window.Charts = {
  initDefaults: initChartDefaults,
  createDisruptionsChart,
  createAccessibilityChart,
  createRainfallChart,
  createDistrictChart,
  createIncidentTypeChart,
  createVehicleActivityChart,
  createResponseTimeChart,
  createRiskGauge,
  CHART_COLORS,
};
