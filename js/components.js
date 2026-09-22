/* SmartRoute components — shows logged-in / signed-up user name */

const SMARTROUTE_NAV = [
  { section: 'OPERATIONS', items: [
    { id: 'dashboard', label: 'Dashboard', icon: '⊞', href: 'dashboard.html' },
    { id: 'map', label: 'Live Map', icon: '🗺', href: 'map.html' },
    { id: 'incidents', label: 'Incidents', icon: '⚠', href: 'incidents.html', badge: '18' },
    { id: 'alerts', label: 'Alerts', icon: '🔔', href: 'alerts.html', badge: '7' },
    { id: 'emergency', label: 'Emergency Response', icon: '🚨', href: 'emergency.html' }
  ]},
  { section: 'INTELLIGENCE', items: [
    { id: 'route-prediction', label: 'AI Route Prediction', icon: '🤖', href: 'route-prediction.html' },
    { id: 'alternate-routes', label: 'Alternate Routes', icon: '↔', href: 'alternate-routes.html' },
    { id: 'ai-command', label: 'AI Command Center', icon: '⚡', href: 'ai-command.html' },
    { id: 'photo-analysis', label: 'AI Photo Analysis', icon: '📷', href: 'photo-analysis.html' },
    { id: 'weather', label: 'Weather & Risk', icon: '🌧', href: 'weather.html' }
  ]},
  { section: 'TRANSPORT', items: [
    { id: 'vehicle-tracking', label: 'Vehicle Tracking', icon: '🚛', href: 'vehicle-tracking.html' },
    { id: 'deliveries', label: 'Deliveries', icon: '📦', href: 'deliveries.html' },
    { id: 'corridors', label: 'Risk Corridors', icon: '🛣', href: 'corridors.html' }
  ]},
  { section: 'MONITORING', items: [
    { id: 'districts', label: 'Districts', icon: '🗂', href: 'districts.html' },
    { id: 'infrastructure', label: 'Infrastructure', icon: '🌉', href: 'infrastructure.html' },
    { id: 'officers', label: 'Field Officers', icon: '👮', href: 'officers.html' },
    { id: 'field-report', label: 'Field Report', icon: '📍', href: 'field-report.html' },
    { id: 'reports', label: 'Reports', icon: '📋', href: 'reports.html' },
    { id: 'analytics', label: 'Analytics', icon: '📊', href: 'analytics.html' },
    { id: 'simulation', label: 'Live Simulation', icon: '▶', href: 'simulation.html' }
  ]},
  { section: 'SYSTEM', items: [
    { id: 'language', label: 'Language & Region', icon: '🌐', href: 'language.html' },
    { id: 'admin', label: 'Admin Panel', icon: '🔧', href: 'admin.html' },
    { id: 'settings', label: 'Settings', icon: '⚙', href: 'settings.html' }
  ]}
];

function getPageId() {
  var path = window.location.pathname;
  return path.split('/').pop().replace('.html', '') || 'index';
}

function ensureAuthScript(cb) {
  if (window.SmartRouteAuth) { if (cb) cb(); return; }
  if (document.querySelector('script[data-sr-auth]')) {
    setTimeout(function () { if (cb) cb(); }, 250);
    return;
  }
  var s = document.createElement('script');
  s.src = 'js/auth-users.js?v=nav4';
  s.setAttribute('data-sr-auth', '1');
  s.onload = function () { if (cb) cb(); };
  s.onerror = function () { if (cb) cb(); };
  document.head.appendChild(s);
}

function getLoggedInDisplay() {
  var name = 'Guest';
  var role = 'Not signed in';
  var initials = 'SR';
  try {
    var u = null;
    if (window.SmartRouteAuth && SmartRouteAuth.getSessionUser) {
      u = SmartRouteAuth.getSessionUser();
    }
    if (!u) {
      var raw = localStorage.getItem('sr_user') || sessionStorage.getItem('sr_user');
      if (raw) u = JSON.parse(raw);
    }
    if (!u) {
      var n = localStorage.getItem('sr_username');
      if (n) {
        u = {
          username: n,
          role: localStorage.getItem('sr_user_role') || localStorage.getItem('sr_role') || ''
        };
      }
    }
    if (u) {
      name = (u.username || u.name || u.email || 'Officer').trim();
      role = (u.role || u.department || 'Command HQ · NER').trim();
      var parts = name.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        initials = (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
      } else {
        initials = name.slice(0, 2).toUpperCase();
      }
    }
  } catch (e) {}
  return { name: name, role: role, initials: initials };
}

function refreshUserDisplay() {
  var d = getLoggedInDisplay();
  var n = document.getElementById('sr-sidebar-username');
  var r = document.getElementById('sr-sidebar-role');
  var av = document.querySelector('.sidebar-user .user-avatar');
  var nu = document.getElementById('sr-nav-username');
  if (n) n.textContent = d.name;
  if (r) r.textContent = d.role;
  if (av) av.textContent = d.initials;
  if (nu) nu.textContent = d.name !== 'Guest' ? d.name : '';
}

function buildSidebar() {
  var currentPage = getPageId();
  var sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';
  sidebar.id = 'sidebar';
  var navHtml = '';
  SMARTROUTE_NAV.forEach(function (section) {
    navHtml += '<div class="sidebar-section-label">' + section.section + '</div>';
    section.items.forEach(function (item) {
      var active = currentPage === item.id ? ' active' : '';
      var badge = item.badge ? '<span class="nav-badge">' + item.badge + '</span>' : '';
      navHtml += '<a href="' + item.href + '" class="nav-item' + active + '"><span class="nav-icon">' + item.icon + '</span><span class="nav-label">' + item.label + '</span>' + badge + '</a>';
    });
  });
  var d = getLoggedInDisplay();
  sidebar.innerHTML =
    '<a href="index.html" class="sidebar-logo" style="text-decoration:none;display:flex;align-items:center;gap:12px;padding:16px 18px;border-bottom:1px solid rgba(0,212,255,0.15);">' +
    '<div class="sidebar-logo-icon" style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#00d4ff,#00ff88);display:flex;align-items:center;justify-content:center;font-weight:900;color:#031018;font-size:15px;flex-shrink:0;">SR</div>' +
    '<div><div style="font-weight:800;color:#00d4ff;">SmartRoute</div><div style="font-size:0.72rem;color:#8fa3b8;">NER Emergency Mgmt</div></div></a>' +
    '<nav class="sidebar-section" id="sidebar-nav">' + navHtml + '</nav>' +
    '<div class="sidebar-bottom">' +
    '<div class="sidebar-user" title="Logged in user">' +
    '<div class="user-avatar">' + d.initials + '</div>' +
    '<div><div class="user-name" id="sr-sidebar-username">' + d.name + '</div>' +
    '<div class="user-role" id="sr-sidebar-role">' + d.role + '</div></div></div>' +
    '<a href="login.html" class="nav-item" id="sr-signout" style="color:#ff6b6b;"><span class="nav-label">Sign Out</span></a>' +
    '</div>';
  return sidebar;
}

function buildNavbar(title, subtitle) {
  var navbar = document.createElement('header');
  navbar.className = 'navbar';
  navbar.id = 'navbar';
  var d = getLoggedInDisplay();
  var nameChip = d.name !== 'Guest'
    ? '<span id="sr-nav-username" style="font-size:12px;font-weight:700;color:#00d4ff;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="Logged in as ' + d.name + '">' + d.name + '</span>'
    : '<span id="sr-nav-username" style="font-size:12px;color:#8fa3b8;"></span>';
  navbar.innerHTML =
    '<div class="navbar-left">' +
    '<button type="button" class="collapse-btn" id="sidebar-toggle" title="Menu" style="width:42px;height:42px;border-radius:10px;border:1px solid rgba(0,212,255,0.45);background:rgba(0,212,255,0.12);color:#e8f4ff;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0;">' +
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"></line><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="17" x2="20" y2="17"></line></svg></button>' +
    '<a href="index.html" style="display:inline-flex;align-items:center;gap:8px;text-decoration:none;"><span style="width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#00d4ff,#00ff88);display:inline-flex;align-items:center;justify-content:center;font-weight:900;color:#031018;font-size:12px;">SR</span><span style="font-weight:800;color:#00d4ff;">SmartRoute</span></a>' +
    '<div><div class="navbar-title">' + (title || 'SmartRoute') + '</div>' +
    (subtitle ? '<div style="font-size:12px;color:#8fa3b8;">' + subtitle + '</div>' : '') +
    '</div></div>' +
    '<div class="navbar-right">' +
    '<div id="backend-status-badge" class="badge" style="font-size:11px;padding:3px 8px;border-radius:4px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#aaa;">STANDALONE</div>' +
    '<div class="status-indicator"><div class="status-dot"></div> LIVE</div>' +
    nameChip +
    '<div id="navbar-clock" style="font-family:monospace;font-size:12px;color:#8fa3b8;"></div>' +
    '<a href="alerts.html" class="navbar-alert-btn" id="sr-alerts-btn">🔔</a>' +
    '<a href="settings.html" class="navbar-alert-btn">⚙</a></div>';
  return navbar;
}

function initClock() {
  var el = document.getElementById('navbar-clock');
  if (!el) return;
  function tick() {
    el.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  tick();
  setInterval(tick, 1000);
}

function wireSignOut() {
  var a = document.getElementById('sr-signout');
  if (!a || a._srWired) return;
  a._srWired = true;
  a.addEventListener('click', function (e) {
    e.preventDefault();
    try {
      if (window.SmartRouteAuth && SmartRouteAuth.clearSession) SmartRouteAuth.clearSession();
      else {
        ['sr_username', 'sr_officer_id', 'sr_email', 'sr_user_role', 'sr_department', 'sr_region', 'sr_logged_in', 'sr_user'].forEach(function (k) {
          try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch (x) {}
        });
      }
    } catch (err) {}
    window.location.href = 'login.html';
  });
}

function initSidebarToggle() {
  var btn = document.getElementById('sidebar-toggle');
  var sidebar = document.getElementById('sidebar');
  var mainContent = document.getElementById('main-content');
  if (!btn || !sidebar || btn._srToggleWired) return;
  btn._srToggleWired = true;
  if (!document.getElementById('sr-sidebar-backdrop')) {
    var bd = document.createElement('div');
    bd.id = 'sr-sidebar-backdrop';
    bd.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:150;';
    bd.onclick = function () {
      document.body.classList.remove('sidebar-open');
      sidebar.classList.remove('mobile-open');
      bd.style.display = 'none';
    };
    document.body.appendChild(bd);
  }
  function setDesktopHidden(hidden) {
    if (hidden) {
      document.body.classList.add('sidebar-hidden');
      sidebar.classList.add('sr-hidden');
      if (mainContent) { mainContent.classList.add('sidebar-collapsed'); mainContent.style.marginLeft = '0'; }
      localStorage.setItem('sr-sidebar-hidden', '1');
    } else {
      document.body.classList.remove('sidebar-hidden');
      sidebar.classList.remove('sr-hidden');
      if (mainContent) { mainContent.classList.remove('sidebar-collapsed'); mainContent.style.marginLeft = ''; }
      localStorage.setItem('sr-sidebar-hidden', '0');
    }
  }
  if ((window.innerWidth || 1200) > 992 && localStorage.getItem('sr-sidebar-hidden') === '1') setDesktopHidden(true);
  btn.addEventListener('click', function (e) {
    e.preventDefault();
    if ((window.innerWidth || 1200) <= 992) {
      document.body.classList.toggle('sidebar-open');
      sidebar.classList.toggle('mobile-open');
      var open = document.body.classList.contains('sidebar-open');
      var bd2 = document.getElementById('sr-sidebar-backdrop');
      if (bd2) bd2.style.display = open ? 'block' : 'none';
    } else setDesktopHidden(!document.body.classList.contains('sidebar-hidden'));
  });
}

function injectShellCss() {
  if (!document.getElementById('sr-timeline-fix-css')) {
    var tl = document.createElement('link');
    tl.id = 'sr-timeline-fix-css';
    tl.rel = 'stylesheet';
    tl.href = 'css/timeline-fix.css?v=9';
    document.head.appendChild(tl);
  }
  if (document.getElementById('sr-mobile-shell-css')) return;
  var style = document.createElement('style');
  style.id = 'sr-mobile-shell-css';
  style.textContent =
    'body.sidebar-hidden .sidebar,.sidebar.sr-hidden{transform:translateX(-105%)!important;}' +
    'body.sidebar-hidden .main-content,.main-content.sidebar-collapsed{margin-left:0!important;width:100%!important;}' +
    '.main-content{margin-left:260px;min-height:100vh;transition:margin-left .28s ease;}' +
    '.navbar{display:flex!important;align-items:center;justify-content:space-between;gap:10px;padding:8px 14px;position:sticky;top:0;z-index:120;background:rgba(4,11,26,0.92)!important;}' +
    '.navbar-left{display:flex!important;align-items:center;gap:12px;}' +
    '@media(max-width:992px){.sidebar{transform:translateX(-105%);z-index:300!important;}.sidebar.mobile-open,body.sidebar-open .sidebar{transform:translateX(0)!important;}.main-content{margin-left:0!important;width:100%!important;}}';
  document.head.appendChild(style);
}

function initSharedComponents(config) {
  config = config || {};
  injectShellCss();
  var appShell = document.querySelector('.app-shell') || document.getElementById('app-root');
  if (!appShell) {
    appShell = document.createElement('div');
    appShell.className = 'app-shell';
    while (document.body.firstChild) appShell.appendChild(document.body.firstChild);
    document.body.appendChild(appShell);
  }
  if (!document.getElementById('sidebar')) appShell.insertBefore(buildSidebar(), appShell.firstChild);
  var mainContent = appShell.querySelector('.main-content') || document.getElementById('main-content');
  if (!mainContent) {
    mainContent = document.createElement('div');
    mainContent.className = 'main-content';
    mainContent.id = 'main-content';
    while (appShell.children.length > 1) mainContent.appendChild(appShell.children[1]);
    appShell.appendChild(mainContent);
  } else {
    mainContent.id = 'main-content';
    if (!mainContent.classList.contains('main-content')) mainContent.classList.add('main-content');
  }
  if (!document.getElementById('navbar')) mainContent.insertBefore(buildNavbar(config.title, config.subtitle), mainContent.firstChild);
  initClock();
  initSidebarToggle();
  wireSignOut();
  refreshUserDisplay();
  ensureAuthScript(function () {
    refreshUserDisplay();
    wireSignOut();
  });
  if (!window.SmartRouteAPI) {
    var s = document.createElement('script');
    s.src = 'js/api.js';
    document.head.appendChild(s);
  } else if (window.SmartRouteAPI.checkHealth) {
    window.SmartRouteAPI.checkHealth();
  }
}

function showToast(msg, type, duration) {
  type = type || 'info';
  duration = duration || 3500;
  var container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    Object.assign(container.style, { position: 'fixed', bottom: '24px', right: '24px', zIndex: '9999', display: 'flex', flexDirection: 'column', gap: '8px' });
    document.body.appendChild(container);
  }
  var colors = { info: '#4facfe', success: '#00ff88', warn: '#ff9500', danger: '#ff3b3b' };
  var toast = document.createElement('div');
  Object.assign(toast.style, {
    background: 'rgba(5,12,28,0.95)', border: '1px solid ' + (colors[type] || colors.info),
    borderLeft: '3px solid ' + (colors[type] || colors.info), borderRadius: '10px', padding: '12px 16px', color: '#e8f4ff', fontSize: '0.9rem'
  });
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(function () { toast.remove(); }, duration);
}

window.SmartRoute = {
  initSharedComponents: initSharedComponents,
  showToast: showToast,
  getPageId: getPageId,
  getLoggedInDisplay: getLoggedInDisplay,
  refreshUserDisplay: refreshUserDisplay
};
