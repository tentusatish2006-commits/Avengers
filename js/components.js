/* SmartRoute shared UI + auth + i18n apply */
const SR_PUBLIC_PAGES = ['index.html', 'login.html', 'signup.html', ''];

function isLoggedIn() {
  try {
    return localStorage.getItem('sr_logged_in') === '1' || !!localStorage.getItem('sr_username');
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

function getPageId() {
  return ((window.location.pathname || '').split('/').pop() || 'dashboard.html').replace('.html', '');
}

function buildSidebar() {
  const activeId = getPageId();
  const collapsed = localStorage.getItem('sr-sidebar-collapsed') === '1';
  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar' + (collapsed ? ' collapsed' : '');
  sidebar.id = 'sidebar';
  sidebar.innerHTML = `
    <a href="dashboard.html" class="sidebar-logo">
      <div class="sidebar-logo-icon">SR</div>
      <div class="sidebar-logo-text">
        <div class="sidebar-logo-title" data-i18n="app_name">SmartRoute</div>
        <div class="sidebar-logo-sub" data-i18n="app_sub">Emergency Mgmt</div>
      </div>
    </a>
    <nav class="sidebar-section" id="sidebar-nav"></nav>
    <div class="sidebar-bottom">
      <div class="sidebar-user">
        <div class="user-avatar" id="sidebar-user-avatar">NE</div>
        <div>
          <div class="user-name" id="sidebar-user-name">Admin Officer</div>
          <div class="user-role" id="sidebar-user-role">Command HQ · NER</div>
        </div>
      </div>
      <a href="login.html" class="nav-item" id="sr-sign-out" style="color:var(--danger);font-size:var(--text-sm);">
        <span class="nav-icon">⏻</span>
        <span class="nav-label" data-i18n="sign_out">Sign Out</span>
      </a>
    </div>`;
  const nav = sidebar.querySelector('#sidebar-nav');
  SMARTROUTE_NAV.forEach(section => {
    const label = document.createElement('div');
    label.className = 'sidebar-section-label';
    label.setAttribute('data-i18n', section.secKey);
    label.textContent = section.section;
    nav.appendChild(label);
    section.items.forEach(item => {
      const a = document.createElement('a');
      a.href = item.href;
      a.className = 'nav-item' + (item.id === activeId ? ' active' : '');
      a.innerHTML = `<span class="nav-icon">${item.icon}</span><span class="nav-label" data-i18n="${item.i18n}">${item.label}</span>${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}`;
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
  nav.innerHTML = `
    <div class="navbar-left">
      <button class="collapse-btn" id="sidebar-toggle" title="Toggle Sidebar">☰</button>
      <div>
        <div class="navbar-title">${title || 'SmartRoute'}</div>
        <div class="page-subtitle" style="margin:0;font-size:12px;color:var(--text-muted)">${subtitle || ''}</div>
      </div>
    </div>
    <div class="navbar-right">
      <span class="status-indicator"><span class="status-dot"></span> <span data-i18n="status_live">LIVE</span></span>
      <span class="navbar-clock" id="navbar-clock">--:--:--</span>
      <a href="alerts.html" class="navbar-alert-btn" title="Alerts">🔔</a>
      <a href="settings.html" class="navbar-alert-btn" title="Settings">⚙</a>
    </div>`;
  return nav;
}

function initClock() {
  const el = document.getElementById('navbar-clock');
  if (!el) return;
  const tick = () => { el.textContent = new Date().toLocaleTimeString('en-IN', { hour12: false }); };
  tick(); setInterval(tick, 1000);
}

function initSidebarToggle() {
  const btn = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('main-content');
  if (!btn || !sidebar) return;
  btn.addEventListener('click', () => {
    const isCollapsed = sidebar.classList.toggle('collapsed');
    mainContent && mainContent.classList.toggle('sidebar-collapsed', isCollapsed);
    localStorage.setItem('sr-sidebar-collapsed', isCollapsed ? '1' : '0');
  });
}

function loadAndApplyI18n() {
  function apply() {
    if (window.SmartRouteI18n) {
      const code = SmartRouteI18n.getLanguage();
      SmartRouteI18n.applyLanguage(code);
      document.documentElement.lang = code;
    }
  }
  if (window.SmartRouteI18n) apply();
  else {
    const s = document.createElement('script');
    s.src = 'js/i18n.js';
    s.onload = apply;
    document.head.appendChild(s);
  }
}

function initSharedComponents(config = {}) {
  if (!document.getElementById('sr-sidebar-scroll-fix')) {
    const link = document.createElement('link');
    link.id = 'sr-sidebar-scroll-fix';
    link.rel = 'stylesheet';
    link.href = 'css/sidebar-scroll-fix.css';
    document.head.appendChild(link);
  }

  enforceAuthIfNeeded();
  if (!isLoggedIn() && !SR_PUBLIC_PAGES.includes((window.location.pathname || '').split('/').pop() || '')) {
    return;
  }

  const { title, subtitle } = config;
  const appShell = document.querySelector('.app-shell');
  if (!appShell) return;

  if (!document.getElementById('sidebar')) {
    appShell.insertBefore(buildSidebar(), appShell.firstChild);
  }

  let mainContent = appShell.querySelector('.main-content');
  if (!mainContent) {
    mainContent = document.createElement('div');
    mainContent.className = 'main-content';
    mainContent.id = 'main-content';
    while (appShell.children.length > 1) mainContent.appendChild(appShell.children[1]);
    appShell.appendChild(mainContent);
  } else {
    mainContent.id = 'main-content';
  }

  if (localStorage.getItem('sr-sidebar-collapsed') === '1') mainContent.classList.add('sidebar-collapsed');
  if (!mainContent.querySelector('.navbar')) {
    mainContent.insertBefore(buildNavbar(title, subtitle), mainContent.firstChild);
  }

  initClock();
  initSidebarToggle();

  const so = document.getElementById('sr-sign-out');
  if (so) so.addEventListener('click', (e) => {
    e.preventDefault();
    try {
      localStorage.removeItem('sr_logged_in');
      localStorage.removeItem('sr_username');
      localStorage.removeItem('sr_user_role');
      localStorage.removeItem('sr_return_to');
    } catch (err) {}
    window.location.href = 'login.html';
  });

  loadAndApplyI18n();
}

function showToast(msg, type = 'info', duration = 3500) {
  let host = document.getElementById('sr-toast-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'sr-toast-host';
    host.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(host);
  }
  const colors = { info: '#00d4ff', success: '#00ff88', warn: '#ff9500', danger: '#ff3b3b' };
  const el = document.createElement('div');
  el.style.cssText = 'background:rgba(8,18,38,0.95);border:1px solid ' + (colors[type] || colors.info) + ';color:#fff;padding:12px 16px;border-radius:10px;font-family:Outfit,sans-serif;font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,0.4);max-width:320px;';
  el.textContent = msg;
  host.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, duration);
}

function initCountUps() {
  document.querySelectorAll('.count-up,[data-count],[data-val]').forEach(el => {
    const target = parseInt(el.getAttribute('data-count') || el.getAttribute('data-val') || el.textContent.replace(/[^0-9]/g, ''), 10);
    if (isNaN(target)) return;
    const startTime = performance.now();
    function update(t) {
      const p = Math.min((t - startTime) / 1200, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString();
      if (p < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  });
}

window.SmartRoute = {
  initSharedComponents,
  initCountUps,
  showToast,
  getPageId,
  enforceAuthIfNeeded,
  isLoggedIn,
  loadAndApplyI18n
};

window.addEventListener('storage', (e) => {
  if (e.key === 'sr_language' && window.SmartRouteI18n) {
    SmartRouteI18n.applyLanguage(e.newValue || 'en');
  }
});

// Auto-load signup registry on signup page
(function(){
  var path = (window.location.pathname || '').split('/').pop() || '';
  if (path === 'signup.html') {
    function load(src, cb) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = cb || function(){};
      document.head.appendChild(s);
    }
    if (!window.SmartRouteAuth) {
      load('js/auth-users.js', function(){ load('js/signup-register.js'); });
    } else {
      load('js/signup-register.js');
    }
  }
})();
