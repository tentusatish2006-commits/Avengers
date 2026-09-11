/* ============================================================
   SMARTROUTE — SHARED COMPONENT INJECTOR
   Dynamically renders Sidebar + Navbar on every page
   ============================================================ */

const SMARTROUTE_NAV = [
  {
    section: 'OPERATIONS',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: '⊞', href: 'dashboard.html' },
      { id: 'map', label: 'Live Map', icon: '🗺', href: 'map.html' },
      { id: 'incidents', label: 'Incidents', icon: '⚠', href: 'incidents.html', badge: '18' },
      { id: 'alerts', label: 'Alerts', icon: '🔔', href: 'alerts.html', badge: '7' },
      { id: 'emergency', label: 'Emergency Response', icon: '🚨', href: 'emergency.html' },
    ]
  },
  {
    section: 'INTELLIGENCE',
    items: [
      { id: 'route-prediction', label: 'AI Route Prediction', icon: '🤖', href: 'route-prediction.html' },
      { id: 'alternate-routes', label: 'Alternate Routes', icon: '↔', href: 'alternate-routes.html' },
      { id: 'ai-command', label: 'AI Command Center', icon: '⚡', href: 'ai-command.html' },
      { id: 'photo-analysis', label: 'AI Photo Analysis', icon: '📷', href: 'photo-analysis.html' },
      { id: 'weather', label: 'Weather & Risk', icon: '🌧', href: 'weather.html' },
    ]
  },
  {
    section: 'TRANSPORT',
    items: [
      { id: 'vehicle-tracking', label: 'Vehicle Tracking', icon: '🚛', href: 'vehicle-tracking.html' },
      { id: 'deliveries', label: 'Deliveries', icon: '📦', href: 'deliveries.html' },
      { id: 'corridors', label: 'Risk Corridors', icon: '🛣', href: 'corridors.html' },
    ]
  },
  {
    section: 'MONITORING',
    items: [
      { id: 'districts', label: 'Districts', icon: '🗂', href: 'districts.html' },
      { id: 'infrastructure', label: 'Infrastructure', icon: '🌉', href: 'infrastructure.html' },
      { id: 'officers', label: 'Field Officers', icon: '👮', href: 'officers.html' },
      { id: 'reports', label: 'Reports', icon: '📋', href: 'reports.html' },
    ]
  },
  {
    section: 'ANALYTICS',
    items: [
      { id: 'analytics', label: 'Analytics', icon: '📊', href: 'analytics.html' },
      { id: 'simulation', label: 'Live Simulation', icon: '▶', href: 'simulation.html' },
    ]
  },
  {
    section: 'FIELD',
    items: [
      { id: 'field-report', label: 'Field Report', icon: '📝', href: 'field-report.html' },
      { id: 'officer-dashboard', label: 'Officer Dashboard', icon: '🎖', href: 'officer-dashboard.html' },
    ]
  },
  {
    section: 'SYSTEM',
    items: [
      { id: 'language', label: 'Language & Region', icon: '🌐', href: 'language.html' },
      { id: 'admin', label: 'Admin Panel', icon: '⚙', href: 'admin.html' },
      { id: 'settings', label: 'Settings', icon: '🔧', href: 'settings.html' },
    ]
  }
];

function getPageId() {
  const path = (window.location.pathname || '').split('/').pop() || 'dashboard.html';
  return path.replace('.html', '');
}
function getActivePageId() { return getPageId(); }

function buildSidebar() {
  const activeId = getActivePageId();
  const aside = document.createElement('aside');
  aside.className = 'sidebar';
  aside.id = 'sidebar';
  let html = `<div class="sidebar-brand"><div class="brand-mark">SR</div><div><div class="brand-title" data-i18n="app_title">SmartRoute</div><div class="brand-sub" data-i18n="app_sub">Emergency Mgmt</div></div></div><nav class="sidebar-nav" id="sidebar-nav">`;
  SMARTROUTE_NAV.forEach(section => {
    const secKey = 'nav_sec_' + section.section.toLowerCase().replace(/\s+/g, '_');
    html += `<div class="sidebar-section-label" data-i18n="${secKey}">${section.section}</div>`;
    section.items.forEach(item => {
      const itemKey = 'nav_' + item.id.replace(/-/g, '_');
      const active = item.id === activeId ? ' active' : '';
      const badge = item.badge ? `<span class="nav-badge">${item.badge}</span>` : '';
      html += `<a href="${item.href}" class="nav-item${active}" data-nav-id="${item.id}"><span class="nav-icon">${item.icon}</span><span class="nav-label" data-i18n="${itemKey}">${item.label}</span>${badge}</a>`;
    });
  });
  html += `</nav><div class="sidebar-footer"><a href="login.html" class="nav-item" id="sr-sign-out" style="color:var(--danger);font-size:var(--text-sm);"><span class="nav-icon">⏻</span><span class="nav-label" data-i18n="sign_out">Sign Out</span></a></div>`;
  aside.innerHTML = html;
  return aside;
}

function buildNavbar(title, subtitle) {
  const nav = document.createElement('header');
  nav.className = 'top-navbar';
  nav.innerHTML = `<div class="navbar-left"><button class="sidebar-toggle" id="sidebar-toggle" title="Toggle sidebar">☰</button><div><div class="navbar-title">${title || 'SmartRoute'}</div><div class="navbar-subtitle">${subtitle || ''}</div></div></div><div class="navbar-right"><span class="badge" id="backend-status-badge">○ STANDALONE</span><span class="badge badge-safe" data-i18n="live">● LIVE</span><div class="navbar-lang-wrap" id="navbar-lang-wrap"></div><span class="navbar-clock" id="navbar-clock">--:--:--</span><a href="alerts.html" class="nav-icon-btn" title="Alerts">🔔</a><a href="settings.html" class="nav-icon-btn" title="Settings">⚙</a></div>`;
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
  const main = document.getElementById('main-content');
  if (!btn || !main) return;
  btn.addEventListener('click', () => {
    main.classList.toggle('sidebar-collapsed');
    localStorage.setItem('sr-sidebar-collapsed', main.classList.contains('sidebar-collapsed') ? '1' : '0');
  });
  if (localStorage.getItem('sr-sidebar-collapsed') === '1') main.classList.add('sidebar-collapsed');
}

function initNavbarLangDropdown() {
  const wrap = document.getElementById('navbar-lang-wrap');
  if (!wrap) return;
  const btn = document.createElement('button');
  btn.className = 'navbar-lang-btn'; btn.id = 'navbar-lang-btn'; btn.type = 'button';
  btn.innerHTML = '<span class="lang-code">EN</span>';
  const menu = document.createElement('div');
  menu.className = 'navbar-lang-menu'; menu.style.display = 'none';
  wrap.appendChild(btn); wrap.appendChild(menu);
  function updateNavbarLang() {
    if (!window.SmartRouteI18n) return;
    const code = SmartRouteI18n.getLanguage();
    const info = SmartRouteI18n.getLanguageInfo(code);
    btn.innerHTML = `<span class="lang-code">${(info && info.code ? info.code : code).toUpperCase()}</span>`;
    menu.innerHTML = '';
    SmartRouteI18n.languages.forEach(l => {
      const opt = document.createElement('div');
      opt.className = 'lang-opt' + (l.code === code ? ' active' : '');
      opt.textContent = `${l.flag || ''} ${l.name}`;
      opt.addEventListener('click', () => {
        SmartRouteI18n.setLanguage(l.code);
        menu.style.display = 'none';
        if (window.SmartRoute && SmartRoute.showToast) SmartRoute.showToast('🌐 Language: ' + l.name + ' (' + l.native + ')', 'success', 2500);
      });
      menu.appendChild(opt);
    });
  }
  btn.addEventListener('click', (e) => { e.stopPropagation(); menu.style.display = menu.style.display === 'none' ? 'block' : 'none'; });
  document.addEventListener('click', (e) => { if (!menu.contains(e.target) && e.target !== btn) menu.style.display = 'none'; });
  window.addEventListener('smartroute:language-changed', updateNavbarLang);
  if (window.SmartRouteI18n) updateNavbarLang(); else setTimeout(updateNavbarLang, 350);
}

const SR_PUBLIC_PAGES = ['index.html', 'login.html', 'signup.html', 'language.html', ''];
function enforceAuthIfNeeded() {
  try {
    const path = (window.location.pathname || '').split('/').pop() || '';
    if (SR_PUBLIC_PAGES.includes(path)) return;
    const logged = localStorage.getItem('sr_logged_in') === '1' || !!localStorage.getItem('sr_username');
    if (!logged) {
      try { localStorage.setItem('sr_return_to', path); } catch(e) {}
      window.location.href = 'login.html';
    }
  } catch (e) {}
}

function initSharedComponents(config = {}) {
  enforceAuthIfNeeded();
  const { title, subtitle } = config;
  const appShell = document.querySelector('.app-shell');
  if (!appShell) return;
  const sidebar = buildSidebar();
  appShell.insertBefore(sidebar, appShell.firstChild);
  let mainContent = appShell.querySelector('.main-content');
  if (!mainContent) {
    mainContent = document.createElement('div');
    mainContent.className = 'main-content';
    mainContent.id = 'main-content';
    while (appShell.children.length > 1) mainContent.appendChild(appShell.children[1]);
    appShell.appendChild(mainContent);
  } else { mainContent.id = 'main-content'; }
  if (localStorage.getItem('sr-sidebar-collapsed') === '1') mainContent.classList.add('sidebar-collapsed');
  mainContent.insertBefore(buildNavbar(title, subtitle), mainContent.firstChild);
  initClock(); initSidebarToggle(); initNavbarLangDropdown();
  const so = document.getElementById('sr-sign-out');
  if (so) so.addEventListener('click', () => {
    try { localStorage.removeItem('sr_logged_in'); localStorage.removeItem('sr_username'); localStorage.removeItem('sr_user_role'); } catch(err) {}
  });
  const body = mainContent.querySelector('.page-body');
  if (body) {
    body.style.opacity = '0'; body.style.transform = 'translateY(12px)';
    requestAnimationFrame(() => {
      body.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      body.style.opacity = '1'; body.style.transform = 'translateY(0)';
    });
  }
  if (!window.SmartRouteI18n) {
    const s = document.createElement('script');
    s.src = 'js/i18n.js';
    s.onload = () => { if (window.SmartRouteI18n) window.SmartRouteI18n.applyLanguage(); };
    document.head.appendChild(s);
  } else { window.SmartRouteI18n.applyLanguage(); }
  if (!window.SmartRouteAPI) {
    const a = document.createElement('script'); a.src = 'js/api.js'; document.head.appendChild(a);
  } else if (window.SmartRouteAPI.checkHealth) window.SmartRouteAPI.checkHealth();
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
  el.style.cssText = 'background:rgba(8,18,38,0.95);border:1px solid ' + (colors[type]||colors.info) + ';color:#fff;padding:12px 16px;border-radius:10px;font-family:Outfit,sans-serif;font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,0.4);max-width:320px;';
  el.textContent = msg;
  host.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, duration);
}

function initCountUps() {
  document.querySelectorAll('.count-up,[data-count]').forEach(el => {
    const target = parseInt(el.getAttribute('data-count') || el.textContent.replace(/[^0-9]/g, ''), 10);
    if (isNaN(target)) return;
    const startTime = performance.now();
    function update(t) {
      const p = Math.min((t - startTime) / 1200, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * ease).toLocaleString();
      if (p < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  });
}

function animateCountUp(el, target, duration = 1500, prefix = '', suffix = '') {
  const startTime = performance.now();
  function update(currentTime) {
    const progress = Math.min((currentTime - startTime) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = prefix + Math.round(target * ease).toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

window.SmartRoute = {
  initSharedComponents,
  initCountUps,
  animateCountUp,
  showToast,
  getPageId,
  enforceAuthIfNeeded
};
