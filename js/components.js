/* SmartRoute shared UI + auth + i18n */
const SR_PUBLIC_PAGES = ['index.html', 'login.html', 'signup.html', ''];

function isLoggedIn() {
  try {
    return localStorage.getItem('sr_logged_in') === '1';
  } catch (e) { return false; }
}

function enforceAuthIfNeeded() {
  try {
    const path = (window.location.pathname || '').split('/').pop() || '';
    if (SR_PUBLIC_PAGES.includes(path)) return;
    if (!isLoggedIn()) {
      try { localStorage.setItem('sr_return_to', path); } catch (e) {}
      window.location.replace('login.html');
    }
  } catch (e) {}
}
enforceAuthIfNeeded();

const SMARTROUTE_NAV = [
  { section: 'OPERATIONS', secKey: 'nav_sec_operations', items: [
    { id: 'dashboard', label: 'Dashboard', i18n: 'nav_dashboard', icon: '⊞', href: 'dashboard.html' },
    { id: 'map', label: 'Live Map', i18n: 'nav_map', icon: '🗺', href: 'map.html' },
    { id: 'incidents', label: 'Incidents', i18n: 'nav_incidents', icon: '⚠', href: 'incidents.html', badge: '18' },
    { id: 'alerts', label: 'Alerts', i18n: 'nav_alerts', icon: '🔔', href: 'alerts.html', badge: '7' },
    { id: 'emergency', label: 'Emergency Response', i18n: 'nav_emergency', icon: '🚨', href: 'emergency.html' },
  ]},
  { section: 'INTELLIGENCE', secKey: 'nav_sec_intelligence', items: [
    { id: 'route-prediction', label: 'AI Route Prediction', i18n: 'nav_route_prediction', icon: '🤖', href: 'route-prediction.html' },
    { id: 'alternate-routes', label: 'Alternate Routes', i18n: 'nav_alternate_routes', icon: '↔', href: 'alternate-routes.html' },
    { id: 'ai-command', label: 'AI Command Center', i18n: 'nav_ai_command', icon: '⚡', href: 'ai-command.html' },
    { id: 'photo-analysis', label: 'AI Photo Analysis', i18n: 'nav_photo_analysis', icon: '📷', href: 'photo-analysis.html' },
    { id: 'weather', label: 'Weather & Risk', i18n: 'nav_weather', icon: '🌧', href: 'weather.html' },
  ]},
  { section: 'TRANSPORT', secKey: 'nav_sec_transport', items: [
    { id: 'vehicle-tracking', label: 'Vehicle Tracking', i18n: 'nav_vehicle_tracking', icon: '🚛', href: 'vehicle-tracking.html' },
    { id: 'deliveries', label: 'Deliveries', i18n: 'nav_deliveries', icon: '📦', href: 'deliveries.html' },
    { id: 'corridors', label: 'Risk Corridors', i18n: 'nav_corridors', icon: '🛣', href: 'corridors.html' },
  ]},
  { section: 'MONITORING', secKey: 'nav_sec_monitoring', items: [
    { id: 'districts', label: 'Districts', i18n: 'nav_districts', icon: '🗂', href: 'districts.html' },
    { id: 'infrastructure', label: 'Infrastructure', i18n: 'nav_infrastructure', icon: '🌉', href: 'infrastructure.html' },
    { id: 'officers', label: 'Field Officers', i18n: 'nav_officers', icon: '👮', href: 'officers.html' },
    { id: 'reports', label: 'Reports', i18n: 'nav_reports', icon: '📋', href: 'reports.html' },
  ]},
  { section: 'ANALYTICS', secKey: 'nav_sec_analytics', items: [
    { id: 'analytics', label: 'Analytics', i18n: 'nav_analytics', icon: '📊', href: 'analytics.html' },
    { id: 'simulation', label: 'Live Simulation', i18n: 'nav_simulation', icon: '▶', href: 'simulation.html' },
  ]},
  { section: 'FIELD', secKey: 'nav_sec_field', items: [
    { id: 'field-report', label: 'Field Report', i18n: 'nav_field_report', icon: '📝', href: 'field-report.html' },
    { id: 'officer-dashboard', label: 'Officer Dashboard', i18n: 'nav_officer_dashboard', icon: '🎖', href: 'officer-dashboard.html' },
  ]},
  { section: 'SYSTEM', secKey: 'nav_sec_system', items: [
    { id: 'language', label: 'Language & Region', i18n: 'nav_language', icon: '🌐', href: 'language.html' },
    { id: 'admin', label: 'Admin Panel', i18n: 'nav_admin', icon: '⚙', href: 'admin.html' },
    { id: 'settings', label: 'Settings', i18n: 'nav_settings', icon: '🔧', href: 'settings.html' },
  ]}
];

function currentLang() {
  try { return localStorage.getItem('sr_language') || 'en'; } catch (e) { return 'en'; }
}

function tr(key, fallback) {
  var code = currentLang();
  if (window.SmartRouteI18n && SmartRouteI18n.t) {
    var v = SmartRouteI18n.t(key, code);
    if (v && v !== key) return v;
  }
  return fallback || key;
}

function getPageId() {
  return ((window.location.pathname || '').split('/').pop() || 'dashboard.html').replace('.html', '');
}

function buildSidebar() {
  const activeId = getPageId();
  const collapsed = localStorage.getItem('sr-sidebar-collapsed') === '1';
  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar' + (collapsed ? ' collapsed' : '');
  sidebar.id = 'sidebar';
  sidebar.innerHTML =
    '<a href="dashboard.html" class="sidebar-logo">' +
      '<div class="sidebar-logo-icon">SR</div>' +
      '<div class="sidebar-logo-text">' +
        '<div class="sidebar-logo-title" data-i18n="app_title">' + tr('app_title', 'SmartRoute') + '</div>' +
        '<div class="sidebar-logo-sub">' + tr('app_sub', 'Emergency Mgmt') + '</div>' +
      '</div></a>' +
    '<nav class="sidebar-section" id="sidebar-nav"></nav>' +
    '<div class="sidebar-bottom">' +
      '<div class="sidebar-user">' +
        '<div class="user-avatar" id="sidebar-user-avatar">NE</div>' +
        '<div>' +
          '<div class="user-name" id="sidebar-user-name">Admin Officer</div>' +
          '<div class="user-role" id="sidebar-user-role">Command HQ · NER</div>' +
        '</div></div>' +
      '<a href="login.html" class="nav-item" id="sr-sign-out">' +
        '<span class="nav-icon">⏻</span>' +
        '<span class="nav-label" data-i18n="sign_out">' + tr('sign_out', 'Sign Out') + '</span>' +
      '</a></div>';

  const nav = sidebar.querySelector('#sidebar-nav');
  SMARTROUTE_NAV.forEach(function (section) {
    const label = document.createElement('div');
    label.className = 'sidebar-section-label';
    label.setAttribute('data-i18n', section.secKey);
    // CRITICAL: translate at build time (not only English)
    label.textContent = tr(section.secKey, section.section);
    nav.appendChild(label);

    section.items.forEach(function (item) {
      const a = document.createElement('a');
      a.href = item.href;
      a.className = 'nav-item' + (item.id === activeId ? ' active' : '');
      a.innerHTML =
        '<span class="nav-icon">' + item.icon + '</span>' +
        '<span class="nav-label" data-i18n="' + item.i18n + '">' + tr(item.i18n, item.label) + '</span>' +
        (item.badge ? '<span class="nav-badge">' + item.badge + '</span>' : '');
      nav.appendChild(a);
    });
  });

  try {
    const user = localStorage.getItem('sr_username');
    const role = localStorage.getItem('sr_user_role');
    if (user) {
      const nameEl = sidebar.querySelector('#sidebar-user-name');
      const avEl = sidebar.querySelector('#sidebar-user-avatar');
      if (nameEl) nameEl.textContent = user;
      if (avEl) avEl.textContent = user.slice(0, 2).toUpperCase();
    }
    if (role) {
      const roleEl = sidebar.querySelector('#sidebar-user-role');
      if (roleEl) roleEl.textContent = role + ' · NER';
    }
  } catch (e) {}
  return sidebar;
}

function buildNavbar(title, subtitle) {
  const nav = document.createElement('header');
  nav.className = 'navbar';
  nav.innerHTML =
    '<div class="navbar-left">' +
      '<button class="collapse-btn" id="sidebar-toggle">☰</button>' +
      '<div><div class="navbar-title">' + (title || 'SmartRoute') + '</div>' +
      '<div class="page-subtitle" style="margin:0;font-size:12px;color:var(--text-muted)">' + (subtitle || '') + '</div></div></div>' +
    '<div class="navbar-right">' +
      '<span class="status-indicator"><span class="status-dot"></span> LIVE</span>' +
      '<span class="navbar-clock" id="navbar-clock">--:--:--</span>' +
      '<a href="alerts.html" class="navbar-alert-btn">🔔</a>' +
      '<a href="settings.html" class="navbar-alert-btn">⚙</a></div>';
  return nav;
}

function initClock() {
  const el = document.getElementById('navbar-clock');
  if (!el) return;
  const tick = function () {
    el.textContent = new Date().toLocaleTimeString('en-IN', { hour12: false });
  };
  tick();
  setInterval(tick, 1000);
}

function initSidebarToggle() {
  const btn = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('main-content');
  if (!btn || !sidebar) return;
  btn.addEventListener('click', function () {
    const isCollapsed = sidebar.classList.toggle('collapsed');
    if (mainContent) mainContent.classList.toggle('sidebar-collapsed', isCollapsed);
    localStorage.setItem('sr-sidebar-collapsed', isCollapsed ? '1' : '0');
  });
}

function ensureI18nLoaded(cb) {
  function loadScript(src, next) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = function () { if (next) next(); };
    s.onerror = function () { if (next) next(); };
    document.head.appendChild(s);
  }
  function afterI18n() {
    loadScript('js/i18n-enhance.js', function () {
      loadScript('js/force-i18n.js', function () {
        loadScript('js/i18n-runtime.js', function () {
          if (cb) cb();
        });
      });
    });
  }
  if (window.SmartRouteI18n) {
    afterI18n();
    return;
  }
  loadScript('js/i18n.js', afterI18n);
}

function loadAndApplyI18n() {
  ensureI18nLoaded(function () {
    var code = currentLang();
    if (window.SmartRouteI18n) {
      SmartRouteI18n._currentLang = code;
      try {
        if (SmartRouteI18n.applyLanguage) SmartRouteI18n.applyLanguage(code);
      } catch (e) {}
    }
    if (window.SmartRouteI18nRuntime) SmartRouteI18nRuntime.applyAll(code);
    if (window.SmartRouteForceI18n) SmartRouteForceI18n.apply(code);
    document.documentElement.lang = code;
  });
}

function refreshLanguage(code) {
  code = code || currentLang();
  try { localStorage.setItem('sr_language', code); } catch (e) {}
  if (window.SmartRouteI18nRuntime) {
    SmartRouteI18nRuntime.setLang(code);
  } else {
    loadAndApplyI18n();
  }
  // Rebuild sidebar text without full page reload
  var nav = document.getElementById('sidebar-nav');
  if (nav && window.SmartRouteI18n) {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var v = SmartRouteI18n.t(key, code);
      if (v && v !== key) el.textContent = v;
    });
  }
}

function initSharedComponents(config) {
  config = config || {};
  if (!document.getElementById('sr-sidebar-scroll-fix')) {
    var link = document.createElement('link');
    link.id = 'sr-sidebar-scroll-fix';
    link.rel = 'stylesheet';
    link.href = 'css/sidebar-scroll-fix.css';
    document.head.appendChild(link);
  }

  enforceAuthIfNeeded();
  if (!isLoggedIn() && !SR_PUBLIC_PAGES.includes((window.location.pathname || '').split('/').pop() || '')) {
    return;
  }

  var appShell = document.querySelector('.app-shell');
  if (!appShell) return;

  // Ensure i18n available before building sidebar so labels are translated
  ensureI18nLoaded(function () {
    if (!document.getElementById('sidebar')) {
      appShell.insertBefore(buildSidebar(), appShell.firstChild);
    }

    var mainContent = appShell.querySelector('.main-content');
    if (!mainContent) {
      mainContent = document.createElement('div');
      mainContent.className = 'main-content';
      mainContent.id = 'main-content';
      while (appShell.children.length > 1) mainContent.appendChild(appShell.children[1]);
      appShell.appendChild(mainContent);
    } else {
      mainContent.id = 'main-content';
    }

    if (localStorage.getItem('sr-sidebar-collapsed') === '1') {
      mainContent.classList.add('sidebar-collapsed');
    }
    if (!mainContent.querySelector('.navbar')) {
      mainContent.insertBefore(buildNavbar(config.title, config.subtitle), mainContent.firstChild);
    }

    initClock();
    initSidebarToggle();

    var so = document.getElementById('sr-sign-out');
    if (so) {
      so.addEventListener('click', function (e) {
        e.preventDefault();
        try {
          localStorage.removeItem('sr_logged_in');
          localStorage.removeItem('sr_username');
          localStorage.removeItem('sr_user_role');
        } catch (err) {}
        window.location.href = 'login.html';
      });
    }

    loadAndApplyI18n();
    setTimeout(loadAndApplyI18n, 400);
  });
}

function showToast(msg, type, duration) {
  type = type || 'info';
  duration = duration || 3500;
  var host = document.getElementById('sr-toast-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'sr-toast-host';
    host.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(host);
  }
  var colors = { info: '#00d4ff', success: '#00ff88', warn: '#ff9500', danger: '#ff3b3b' };
  var el = document.createElement('div');
  el.style.cssText = 'background:rgba(8,18,38,0.95);border:1px solid ' + (colors[type] || colors.info) + ';color:#fff;padding:12px 16px;border-radius:10px;font-family:Outfit,sans-serif;font-size:13px;max-width:320px;';
  el.textContent = msg;
  host.appendChild(el);
  setTimeout(function () { el.remove(); }, duration);
}

function initCountUps() {
  document.querySelectorAll('.count-up,[data-count],[data-val]').forEach(function (el) {
    var target = parseInt(el.getAttribute('data-count') || el.getAttribute('data-val') || el.textContent.replace(/[^0-9]/g, ''), 10);
    if (isNaN(target)) return;
    var start = performance.now();
    function update(t) {
      var p = Math.min((t - start) / 1200, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString();
      if (p < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  });
}

window.SmartRoute = {
  initSharedComponents: initSharedComponents,
  initCountUps: initCountUps,
  showToast: showToast,
  getPageId: getPageId,
  enforceAuthIfNeeded: enforceAuthIfNeeded,
  isLoggedIn: isLoggedIn,
  loadAndApplyI18n: loadAndApplyI18n,
  refreshLanguage: refreshLanguage
};

(function () {
  var path = (window.location.pathname || '').split('/').pop() || '';
  if (path === 'signup.html') {
    var s = document.createElement('script');
    s.src = 'js/auth-users.js';
    s.onload = function () {
      var s2 = document.createElement('script');
      s2.src = 'js/signup-register.js';
      document.head.appendChild(s2);
    };
    document.head.appendChild(s);
  }
})();

ensureI18nLoaded(function () {
  loadAndApplyI18n();
});
