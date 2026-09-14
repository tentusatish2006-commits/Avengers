/* SmartRoute shared UI + auth + i18n — full sidebar with page logos */
const SR_PUBLIC_PAGES = ['index.html', 'login.html', 'signup.html', ''];

function isLoggedIn() {
  try {
    if (window.SmartRouteAuth && SmartRouteAuth.isLoggedIn) return SmartRouteAuth.isLoggedIn();
    return localStorage.getItem('sr_logged_in') === '1' ||
      !!localStorage.getItem('sr_user') ||
      !!sessionStorage.getItem('sr_user') ||
      !!localStorage.getItem('sr_username');
  } catch (e) {
    return false;
  }
}

function currentPage() {
  return (location.pathname || '').split('/').pop() || 'index.html';
}

function requireAuth() {
  var page = currentPage();
  if (SR_PUBLIC_PAGES.indexOf(page) >= 0) return true;
  if (!isLoggedIn()) {
    try { localStorage.setItem('sr_return_to', page); } catch (e) {}
    location.replace('login.html');
    return false;
  }
  return true;
}

function currentLang() {
  try { return localStorage.getItem('sr_language') || 'en'; } catch (e) { return 'en'; }
}

function showToast(msg, type, ms) {
  type = type || 'info';
  ms = ms || 2500;
  var el = document.getElementById('sr-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'sr-toast';
    el.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:10000;padding:12px 16px;border-radius:10px;font:600 13px Outfit,sans-serif;max-width:320px;box-shadow:0 8px 24px rgba(0,0,0,0.35);transition:opacity 0.2s;';
    document.body.appendChild(el);
  }
  var bg = type === 'success' ? '#0a3d2a' : type === 'danger' || type === 'warn' ? '#3d1a0a' : '#0a1e3d';
  var border = type === 'success' ? '#00ff88' : type === 'danger' ? '#ff3b3b' : type === 'warn' ? '#ff9500' : '#00d4ff';
  el.style.background = bg;
  el.style.border = '1px solid ' + border;
  el.style.color = '#e8f4ff';
  el.textContent = msg;
  el.style.opacity = '1';
  clearTimeout(el._t);
  el._t = setTimeout(function () { el.style.opacity = '0'; }, ms);
}

function tr(key, fallback) {
  if (window.SmartRouteI18n && SmartRouteI18n.t) {
    var v = SmartRouteI18n.t(key, currentLang());
    if (v && v !== key) return v;
  }
  return fallback || key;
}

/** Brand logo mark used in sidebar, login, signup */
function brandLogoHtml(size) {
  size = size || 36;
  return '<div class="sr-logo-mark" style="width:' + size + 'px;height:' + size + 'px;border-radius:10px;background:linear-gradient(135deg,#00d4ff,#00ff88);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:' + Math.round(size * 0.38) + 'px;color:#031018;box-shadow:0 0 16px rgba(0,212,255,0.45);flex-shrink:0;letter-spacing:-0.02em;">SR</div>';
}

function buildSidebar(active) {
  // ALL app pages on left sidebar only — with logos/icons
  var sections = [
    {
      label: 'Command',
      items: [
        { href: 'dashboard.html', key: 'nav_dashboard', label: 'Dashboard', icon: '▣' },
        { href: 'map.html', key: 'nav_map', label: 'Live Map', icon: '🗺' },
        { href: 'emergency.html', key: 'nav_emergency', label: 'Emergency Response', icon: '🚨' },
        { href: 'ai-command.html', key: 'nav_ai_command', label: 'AI Command Center', icon: '🧠' }
      ]
    },
    {
      label: 'Operations',
      items: [
        { href: 'incidents.html', key: 'nav_incidents', label: 'Incidents', icon: '⚠' },
        { href: 'alerts.html', key: 'nav_alerts', label: 'Alerts', icon: '🔔' },
        { href: 'vehicle-tracking.html', key: 'nav_vehicle_tracking', label: 'Vehicle Tracking', icon: '🚛' },
        { href: 'deliveries.html', key: 'nav_deliveries', label: 'Deliveries', icon: '📦' },
        { href: 'simulation.html', key: 'nav_simulation', label: 'Live Simulation', icon: '▶' },
        { href: 'field-report.html', key: 'nav_field_report', label: 'Field Report', icon: '📋' }
      ]
    },
    {
      label: 'Intelligence',
      items: [
        { href: 'route-prediction.html', key: 'nav_route_prediction', label: 'AI Route Prediction', icon: '🤖' },
        { href: 'alternate-routes.html', key: 'nav_alternate_routes', label: 'Alternate Routes', icon: '⇄' },
        { href: 'photo-analysis.html', key: 'nav_photo_analysis', label: 'AI Photo Analysis', icon: '📷' },
        { href: 'weather.html', key: 'nav_weather', label: 'Weather', icon: '☁' },
        { href: 'analytics.html', key: 'nav_analytics', label: 'Analytics', icon: '📊' },
        { href: 'reports.html', key: 'nav_reports', label: 'Reports', icon: '📑' }
      ]
    },
    {
      label: 'Network',
      items: [
        { href: 'corridors.html', key: 'nav_corridors', label: 'Corridors', icon: '🛣' },
        { href: 'districts.html', key: 'nav_districts', label: 'Districts', icon: '🏙' },
        { href: 'infrastructure.html', key: 'nav_infrastructure', label: 'Infrastructure', icon: '🏗' },
        { href: 'officers.html', key: 'nav_officers', label: 'Officers', icon: '👮' },
        { href: 'officer-dashboard.html', key: 'nav_officer_dashboard', label: 'Officer Dashboard', icon: '👤' }
      ]
    },
    {
      label: 'System',
      items: [
        { href: 'language.html', key: 'nav_language', label: 'Language & Region', icon: '🌐' },
        { href: 'admin.html', key: 'nav_admin', label: 'Admin Panel', icon: '🛡' },
        { href: 'settings.html', key: 'nav_settings', label: 'Settings', icon: '⚙' }
      ]
    }
  ];

  var page = currentPage();
  var html = '';
  html += '<aside class="sidebar" id="sidebar">';
  html += '<div class="sidebar-brand" style="display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid rgba(0,212,255,0.15);">';
  html += brandLogoHtml(36);
  html += '<div><div class="brand-title" style="font-weight:800;font-size:0.95rem;color:#e8f4ff;">SmartRoute</div>';
  html += '<div class="brand-sub" style="font-size:9px;letter-spacing:0.1em;color:#6a8ea8;text-transform:uppercase;">NER Command</div></div></div>';
  html += '<nav class="sidebar-nav" style="flex:1;overflow-y:auto;padding:8px 0 12px;">';

  sections.forEach(function (sec) {
    html += '<div class="nav-section-label" style="font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#6a8ea8;padding:10px 16px 4px;opacity:0.85;">' + sec.label + '</div>';
    sec.items.forEach(function (it) {
      var on = page === it.href || active === it.href;
      html += '<a class="nav-item' + (on ? ' active' : '') + '" href="' + it.href + '" title="' + it.label + '">';
      html += '<span class="nav-ico" style="width:28px;height:28px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;background:rgba(0,212,255,0.08);border:1px solid rgba(0,212,255,0.2);font-size:14px;flex-shrink:0;">' + it.icon + '</span>';
      html += '<span class="nav-label" data-i18n="' + it.key + '">' + tr(it.key, it.label) + '</span>';
      html += '</a>';
    });
  });

  html += '</nav>';
  html += '<div class="sidebar-footer" style="border-top:1px solid rgba(0,212,255,0.15);padding:10px 8px;">';
  html += '<button type="button" class="nav-item" id="sr-signout" style="width:100%;border:none;background:transparent;cursor:pointer;text-align:left;">';
  html += '<span class="nav-ico" style="width:28px;height:28px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;background:rgba(255,59,59,0.12);border:1px solid rgba(255,59,59,0.3);font-size:14px;">⏻</span>';
  html += '<span class="nav-label">Sign Out</span></button></div>';
  html += '</aside>';
  return html;
}

function initSharedComponents(opts) {
  opts = opts || {};
  if (!requireAuth()) return;

  var shell = document.querySelector('.app-shell');
  if (shell && !document.getElementById('sidebar')) {
    shell.insertAdjacentHTML('afterbegin', buildSidebar(opts.active));
  }

  var main = document.getElementById('main-content') || document.querySelector('.main-content');
  if (main && !document.querySelector('.topbar')) {
    var top = document.createElement('div');
    top.className = 'topbar';
    top.innerHTML = '<div class="topbar-left"><button type="button" class="icon-btn" id="sr-menu" aria-label="Menu">☰</button><div><div class="topbar-title">' + (opts.title || document.title) + '</div><div class="topbar-sub">' + (opts.subtitle || '') + '</div></div></div><div class="topbar-right"><span class="live-pill">● LIVE</span><span id="sr-clock" class="clock-pill"></span></div>';
    main.insertBefore(top, main.firstChild);
  }

  var so = document.getElementById('sr-signout');
  if (so) {
    so.onclick = function () {
      if (window.SmartRouteAuth && SmartRouteAuth.clearSession) SmartRouteAuth.clearSession();
      try {
        localStorage.removeItem('sr_user');
        sessionStorage.removeItem('sr_user');
        localStorage.removeItem('sr_logged_in');
        localStorage.removeItem('sr_username');
      } catch (e) {}
      location.href = 'login.html';
    };
  }

  var menu = document.getElementById('sr-menu');
  if (menu) menu.onclick = function () { document.body.classList.toggle('sidebar-open'); };

  function tick() {
    var el = document.getElementById('sr-clock');
    if (el) el.textContent = new Date().toLocaleTimeString();
  }
  tick();
  setInterval(tick, 1000);
  ensureI18n();
}

function loadScript(src, next) {
  if (document.querySelector('script[src*="' + src.split('?')[0] + '"]')) {
    if (next) next();
    return;
  }
  var s = document.createElement('script');
  s.src = src + (src.indexOf('?') >= 0 ? '&' : '?') + 'v=nav3';
  s.async = true;
  s.onload = function () { if (next) next(); };
  s.onerror = function () { if (next) next(); };
  document.head.appendChild(s);
}

function ensureI18n(cb) {
  function afterI18n() {
    var left = 3;
    function doneOne() { left--; if (left <= 0 && cb) cb(); }
    loadScript('js/i18n-enhance.js', doneOne);
    loadScript('js/force-i18n.js', doneOne);
    loadScript('js/i18n-runtime.js', doneOne);
  }
  if (window.SmartRouteI18n) { afterI18n(); return; }
  loadScript('js/i18n.js', afterI18n);
}

function applyFullLanguage(code) {
  code = code || currentLang();
  try { localStorage.setItem('sr_language', code); } catch (e) {}
  if (window.SmartRouteForceI18n && SmartRouteForceI18n.apply) SmartRouteForceI18n.apply(code);
  try {
    window.dispatchEvent(new CustomEvent('smartroute:language-changed', { detail: { language: code } }));
  } catch (e) {}
}

window.SmartRoute = {
  initSharedComponents: initSharedComponents,
  showToast: showToast,
  isLoggedIn: isLoggedIn,
  requireAuth: requireAuth,
  applyFullLanguage: applyFullLanguage,
  tr: tr,
  currentLang: currentLang,
  brandLogoHtml: brandLogoHtml,
  buildSidebar: buildSidebar
};
