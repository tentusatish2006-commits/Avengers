/* SmartRoute — stable sidebar, working hamburger, topbar LIVE+clock+alerts+settings */
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

function brandLogoHtml(size) {
  size = size || 36;
  return '<div class="sr-logo-mark" style="width:' + size + 'px;height:' + size + 'px;border-radius:10px;background:linear-gradient(135deg,#00d4ff,#00ff88);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:' + Math.round(size * 0.38) + 'px;color:#031018;box-shadow:0 0 16px rgba(0,212,255,0.45);flex-shrink:0;">SR</div>';
}

var SR_SIDEBAR_SECTIONS = [
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

function buildSidebar(active) {
  var page = currentPage();
  var html = '';
  html += '<aside class="sidebar" id="sidebar" data-sr-stable="1">';
  html += '<div class="sidebar-brand" style="display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid rgba(0,212,255,0.15);flex-shrink:0;">';
  html += brandLogoHtml(36);
  html += '<div><div class="brand-title" style="font-weight:800;font-size:0.95rem;color:#e8f4ff;">SmartRoute</div>';
  html += '<div class="brand-sub" style="font-size:9px;letter-spacing:0.1em;color:#6a8ea8;text-transform:uppercase;">NER Command</div></div></div>';
  html += '<nav class="sidebar-nav" id="sr-sidebar-nav" style="flex:1;overflow-y:auto;padding:8px 0 12px;">';

  SR_SIDEBAR_SECTIONS.forEach(function (sec) {
    html += '<div class="nav-section-label" style="font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#6a8ea8;padding:10px 16px 4px;opacity:0.85;">' + sec.label + '</div>';
    sec.items.forEach(function (it) {
      var on = page === it.href || active === it.href;
      html += '<a class="nav-item' + (on ? ' active' : '') + '" href="' + it.href + '" data-page="' + it.href + '" title="' + it.label + '">';
      html += '<span class="nav-ico" aria-hidden="true" style="width:28px;height:28px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;background:rgba(0,212,255,0.08);border:1px solid rgba(0,212,255,0.2);font-size:14px;flex-shrink:0;">' + it.icon + '</span>';
      html += '<span class="nav-label" data-i18n="' + it.key + '">' + it.label + '</span>';
      html += '</a>';
    });
  });

  html += '</nav>';
  html += '<div class="sidebar-footer" style="border-top:1px solid rgba(0,212,255,0.15);padding:10px 8px;flex-shrink:0;">';
  html += '<button type="button" class="nav-item" id="sr-signout" style="width:100%;border:none;background:transparent;cursor:pointer;text-align:left;">';
  html += '<span class="nav-ico" style="width:28px;height:28px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;background:rgba(255,59,59,0.12);border:1px solid rgba(255,59,59,0.3);font-size:14px;">⏻</span>';
  html += '<span class="nav-label">Sign Out</span></button></div>';
  html += '</aside>';
  return html;
}

function highlightSidebarActive() {
  var page = currentPage();
  var root = document.getElementById('sidebar');
  if (!root) return;
  root.querySelectorAll('a.nav-item[data-page]').forEach(function (a) {
    if (a.getAttribute('data-page') === page) a.classList.add('active');
    else a.classList.remove('active');
  });
}

function ensureStableSidebar(active) {
  var shell = document.querySelector('.app-shell');
  if (!shell) return;
  shell.querySelectorAll('aside.sidebar, #sidebar, .sidebar').forEach(function (el) {
    if (el.parentNode) el.parentNode.removeChild(el);
  });
  shell.insertAdjacentHTML('afterbegin', buildSidebar(active));
  highlightSidebarActive();
  shell.setAttribute('data-sr-sidebar-locked', '1');
}

function injectSidebarCss() {
  if (document.getElementById('sr-sidebar-css')) return;
  var style = document.createElement('style');
  style.id = 'sr-sidebar-css';
  style.textContent =
    '.sidebar{display:flex;flex-direction:column;width:260px;min-height:100vh;position:fixed;left:0;top:0;bottom:0;z-index:200;background:rgba(4,11,26,0.96);border-right:1px solid rgba(0,212,255,0.18);}' +
    '.main-content{margin-left:260px;min-height:100vh;}' +
    '.nav-item{display:flex;align-items:center;gap:10px;padding:8px 12px;margin:2px 8px;border-radius:8px;text-decoration:none;color:#c5d8ec;font-size:0.88rem;font-weight:500;}' +
    '.nav-item:hover{background:rgba(0,212,255,0.08);color:#fff;}' +
    '.nav-item.active{background:linear-gradient(90deg,rgba(0,212,255,0.18),rgba(0,212,255,0.05));color:#00d4ff;}' +
    '#sr-sidebar-backdrop{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:150;}' +
    'body.sidebar-open #sr-sidebar-backdrop{display:block;}' +
    '@media(max-width:900px){' +
      '.sidebar{transform:translateX(-105%);transition:transform 0.25s ease;}' +
      'body.sidebar-open .sidebar{transform:translateX(0);box-shadow:8px 0 32px rgba(0,0,0,0.5);}' +
      '.main-content{margin-left:0;}' +
    '}';
  document.head.appendChild(style);
}

function buildTopbarRightHtml() {
  return '' +
    '<div class="topbar-right" style="display:flex;align-items:center;gap:10px;margin-left:auto;">' +
      '<span class="live-pill" style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;background:rgba(0,255,136,0.12);border:1px solid rgba(0,255,136,0.35);color:#00ff88;font-size:0.75rem;font-weight:800;letter-spacing:0.06em;">● LIVE</span>' +
      '<span id="sr-clock" class="clock-pill" style="font-family:JetBrains Mono,monospace;font-size:0.85rem;font-weight:600;color:#e8f4ff;background:rgba(0,212,255,0.1);border:1px solid rgba(0,212,255,0.3);padding:6px 12px;border-radius:8px;min-width:88px;text-align:center;">--:--:--</span>' +
      '<a href="alerts.html" id="sr-alerts-btn" title="Alerts" style="position:relative;width:40px;height:40px;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;background:rgba(255,149,0,0.12);border:1px solid rgba(255,149,0,0.4);text-decoration:none;font-size:1.15rem;">' +
        '🔔' +
        '<span style="position:absolute;top:4px;right:4px;width:9px;height:9px;border-radius:50%;background:#ff3b3b;border:1.5px solid #0a1628;box-shadow:0 0 6px #ff3b3b;"></span>' +
      '</a>' +
      '<a href="settings.html" id="sr-settings-btn" title="Settings" style="width:40px;height:40px;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;background:rgba(0,212,255,0.1);border:1px solid rgba(0,212,255,0.35);text-decoration:none;font-size:1.15rem;">' +
        '⚙' +
      '</a>' +
    '</div>';
}

function ensureTopbar(opts) {
  opts = opts || {};
  var main = document.getElementById('main-content') || document.querySelector('.main-content');
  if (!main) return;

  var existing = document.querySelector('.topbar');
  if (existing) {
    var right = existing.querySelector('.topbar-right');
    if (!document.getElementById('sr-alerts-btn') || !document.getElementById('sr-settings-btn')) {
      if (right) right.outerHTML = buildTopbarRightHtml();
      else existing.insertAdjacentHTML('beforeend', buildTopbarRightHtml());
    }
    return;
  }

  var top = document.createElement('div');
  top.className = 'topbar';
  top.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-bottom:1px solid rgba(0,212,255,0.15);background:rgba(5,12,28,0.9);position:sticky;top:0;z-index:40;';
  top.innerHTML =
    '<div class="topbar-left" style="display:flex;align-items:center;gap:12px;">' +
      '<button type="button" class="icon-btn" id="sr-menu" aria-label="Menu" style="width:36px;height:36px;border-radius:8px;border:1px solid rgba(0,212,255,0.25);background:rgba(0,212,255,0.08);color:#e8f4ff;cursor:pointer;font-size:1.1rem;">☰</button>' +
      '<div><div class="topbar-title" style="font-weight:700;color:#e8f4ff;">' + (opts.title || document.title) + '</div>' +
      '<div class="topbar-sub" style="font-size:0.78rem;color:#8fa3b8;">' + (opts.subtitle || '') + '</div></div>' +
    '</div>' +
    buildTopbarRightHtml();
  main.insertBefore(top, main.firstChild);
}

function initSharedComponents(opts) {
  opts = opts || {};
  if (!requireAuth()) return;

  injectSidebarCss();
  ensureStableSidebar(opts.active);
  ensureTopbar(opts);

  // Backdrop for mobile menu
  if (!document.getElementById('sr-sidebar-backdrop')) {
    var bd = document.createElement('div');
    bd.id = 'sr-sidebar-backdrop';
    bd.onclick = function () { document.body.classList.remove('sidebar-open'); };
    document.body.appendChild(bd);
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
  if (menu) {
    menu.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      document.body.classList.toggle('sidebar-open');
      var sb = document.getElementById('sidebar');
      if (sb && window.innerWidth > 900) {
        // Desktop: also allow collapse toggle
        sb.classList.toggle('collapsed');
      }
    };
  }

  function tick() {
    var el = document.getElementById('sr-clock');
    if (!el) return;
    el.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  tick();
  if (!window._srClockTimer) {
    window._srClockTimer = setInterval(tick, 1000);
  }

  applySidebarLabels();
  ensureI18n();
}

function applySidebarLabels() {
  var root = document.getElementById('sidebar');
  if (!root || !window.SmartRouteI18n) return;
  var code = currentLang();
  if (code === 'en') return;
  root.querySelectorAll('[data-i18n]').forEach(function (el) {
    var key = el.getAttribute('data-i18n');
    var t = SmartRouteI18n.t(key, code);
    if (t && t !== key) el.textContent = t;
  });
}

function loadScript(src, next) {
  if (document.querySelector('script[src*="' + src.split('?')[0] + '"]')) {
    if (next) next();
    return;
  }
  var s = document.createElement('script');
  s.src = src + (src.indexOf('?') >= 0 ? '&' : '?') + 'v=nav7';
  s.async = true;
  s.onload = function () { if (next) next(); };
  s.onerror = function () { if (next) next(); };
  document.head.appendChild(s);
}

function ensureI18n(cb) {
  function afterI18n() {
    applySidebarLabels();
    if (cb) cb();
  }
  if (window.SmartRouteI18n) { afterI18n(); return; }
  loadScript('js/i18n.js', afterI18n);
}

function applyFullLanguage(code) {
  code = code || currentLang();
  try { localStorage.setItem('sr_language', code); } catch (e) {}
  applySidebarLabels();
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
  buildSidebar: buildSidebar,
  ensureStableSidebar: ensureStableSidebar,
  highlightSidebarActive: highlightSidebarActive
};
