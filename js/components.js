/* ============================================================
   SMARTROUTE — SHARED COMPONENT INJECTOR (logos + mobile)
   Dynamically renders Sidebar + Navbar on every page
   ============================================================ */

const SMARTROUTE_NAV = [
  {
    section: 'OPERATIONS',
    items: [
      { id: 'dashboard',         label: 'Dashboard',          icon: '⊞',  href: 'dashboard.html' },
      { id: 'map',               label: 'Live Map',            icon: '🗺',  href: 'map.html' },
      { id: 'incidents',         label: 'Incidents',          icon: '⚠',  href: 'incidents.html',    badge: '18' },
      { id: 'alerts',            label: 'Alerts',             icon: '🔔',  href: 'alerts.html',       badge: '7' },
      { id: 'emergency',         label: 'Emergency Response', icon: '🚨',  href: 'emergency.html' },
    ]
  },
  {
    section: 'INTELLIGENCE',
    items: [
      { id: 'route-prediction',  label: 'AI Route Prediction',   icon: '🤖',  href: 'route-prediction.html' },
      { id: 'alternate-routes',  label: 'Alternate Routes',      icon: '↔',  href: 'alternate-routes.html' },
      { id: 'ai-command',        label: 'AI Command Center',     icon: '⚡',  href: 'ai-command.html' },
      { id: 'photo-analysis',    label: 'AI Photo Analysis',     icon: '📷',  href: 'photo-analysis.html' },
      { id: 'weather',           label: 'Weather & Risk',        icon: '🌧',  href: 'weather.html' },
    ]
  },
  {
    section: 'TRANSPORT',
    items: [
      { id: 'vehicle-tracking',  label: 'Vehicle Tracking',     icon: '🚛',  href: 'vehicle-tracking.html' },
      { id: 'deliveries',        label: 'Deliveries',           icon: '📦',  href: 'deliveries.html' },
      { id: 'corridors',         label: 'Risk Corridors',       icon: '🛣',  href: 'corridors.html' },
    ]
  },
  {
    section: 'MONITORING',
    items: [
      { id: 'districts',         label: 'Districts',            icon: '🗂',  href: 'districts.html' },
      { id: 'infrastructure',    label: 'Infrastructure',       icon: '🌉',  href: 'infrastructure.html' },
      { id: 'officers',          label: 'Field Officers',       icon: '👮',  href: 'officers.html' },
      { id: 'field-report',      label: 'Field Report',         icon: '📍',  href: 'field-report.html' },
      { id: 'reports',           label: 'Reports',              icon: '📋',  href: 'reports.html' },
      { id: 'analytics',         label: 'Analytics',            icon: '📈',  href: 'analytics.html' },
      { id: 'simulation',        label: 'Live Simulation',      icon: '🎬',  href: 'simulation.html' },
    ]
  },
  {
    section: 'SYSTEM',
    items: [
      { id: 'language',          label: 'Language & Region',    icon: '🌐',  href: 'language.html' },
      { id: 'admin',             label: 'Admin Panel',          icon: '🔧',  href: 'admin.html' },
      { id: 'settings',          label: 'Settings',             icon: '⚙',  href: 'settings.html' },
    ]
  }
];

function getPageId() {
  const path = window.location.pathname;
  const file = path.split('/').pop().replace('.html', '') || 'index';
  return file;
}

function buildSidebar() {
  const currentPage = getPageId();
  const collapsed = localStorage.getItem('sr-sidebar-collapsed') === '1';

  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar' + (collapsed ? ' collapsed' : '');
  sidebar.id = 'sidebar';

  sidebar.innerHTML = `
    <a href="index.html" class="sidebar-logo" style="text-decoration:none;display:flex;align-items:center;gap:12px;padding:16px 18px;border-bottom:1px solid rgba(0,212,255,0.15);">
      <div class="sidebar-logo-icon" style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#00d4ff,#00ff88);display:flex;align-items:center;justify-content:center;font-weight:900;color:#031018;font-size:15px;box-shadow:0 0 16px rgba(0,212,255,0.35);flex-shrink:0;">SR</div>
      <div class="sidebar-logo-text">
        <div class="sidebar-logo-title" style="font-weight:800;color:#00d4ff;font-size:1rem;letter-spacing:0.02em;">SmartRoute</div>
        <div class="sidebar-logo-sub" style="font-size:0.72rem;color:#8fa3b8;">NER Emergency Mgmt</div>
      </div>
    </a>
    <nav class="sidebar-section" id="sidebar-nav"></nav>
    <div class="sidebar-bottom">
      <div class="sidebar-user">
        <div class="user-avatar" id="sidebar-user-avatar">NE</div>
        <div>
          <div class="user-name" id="sidebar-user-name">Admin Officer</div>
          <div class="user-role" id="sidebar-user-role">Command HQ · North-Eastern Region</div>
        </div>
      </div>
      <a href="login.html" class="nav-item" style="color:var(--danger);font-size:var(--text-sm);">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        <span class="nav-label" data-i18n="sign_out">Sign Out</span>
      </a>
    </div>
  `;

  const nav = sidebar.querySelector('#sidebar-nav');

  SMARTROUTE_NAV.forEach(section => {
    const label = document.createElement('div');
    label.className = 'sidebar-section-label';
    const secKey = `nav_sec_${section.section.toLowerCase()}`;
    label.setAttribute('data-i18n', secKey);
    label.textContent = (window.SmartRouteI18n ? SmartRouteI18n.t(secKey) : null) || section.section;
    nav.appendChild(label);

    section.items.forEach(item => {
      const a = document.createElement('a');
      a.href = item.href;
      a.className = 'nav-item' + (currentPage === item.id ? ' active' : '');
      const itemKey = `nav_${item.id.replace(/-/g, '_')}`;
      const itemLabel = (window.SmartRouteI18n ? SmartRouteI18n.t(itemKey) : null) || item.label;
      a.innerHTML = `
        <span class="nav-icon" style="width:22px;text-align:center;flex-shrink:0;">${item.icon}</span>
        <span class="nav-label" data-i18n="${itemKey}">${itemLabel}</span>
        ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
      `;
      nav.appendChild(a);
    });
  });

  return sidebar;
}

function buildNavbar(title, subtitle) {
  const navbar = document.createElement('header');
  navbar.className = 'navbar';
  navbar.id = 'navbar';

  navbar.innerHTML = `
    <div class="navbar-left">
      <button class="collapse-btn" id="sidebar-toggle" title="Toggle Sidebar" aria-label="Menu">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <a href="index.html" class="navbar-brand-logo" title="SmartRoute Home" style="display:inline-flex;align-items:center;gap:8px;text-decoration:none;flex-shrink:0;">
        <span style="width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#00d4ff,#00ff88);display:inline-flex;align-items:center;justify-content:center;font-weight:900;color:#031018;font-size:12px;box-shadow:0 0 12px rgba(0,212,255,0.3);">SR</span>
        <span class="navbar-brand-text" style="font-weight:800;color:#00d4ff;font-size:0.9rem;">SmartRoute</span>
      </a>
      <div style="min-width:0;">
        <div class="navbar-title">${title || 'SmartRoute'}</div>
        ${subtitle ? `<div style="font-size:var(--text-xs);color:var(--text-muted);">${subtitle}</div>` : ''}
      </div>
    </div>
    <div class="navbar-right">
      <div id="backend-status-badge" class="badge" style="font-size:11px; padding:3px 8px; border-radius:4px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#aaa; font-weight:600; letter-spacing:0.5px;" title="Backend connectivity status">
        <span>○</span> STANDALONE
      </div>
      <div class="status-indicator">
        <div class="status-dot"></div>
        LIVE
      </div>
      <div id="navbar-clock" class="navbar-clock" style="font-family:var(--font-mono);font-size:12px;color:var(--text-secondary);"></div>
      <a href="alerts.html" class="navbar-alert-btn" id="sr-alerts-btn" title="Alerts" style="position:relative;">🔔</a>
      <a href="settings.html" class="navbar-alert-btn" title="Settings">⚙</a>
    </div>
  `;
  return navbar;
}

function initClock() {
  const el = document.getElementById('navbar-clock');
  if (!el) return;
  function tick() {
    el.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  tick();
  setInterval(tick, 1000);
}

function initSidebarToggle() {
  const btn = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('main-content');
  if (!btn || !sidebar) return;

  if (!document.getElementById('sr-sidebar-backdrop')) {
    const bd = document.createElement('div');
    bd.id = 'sr-sidebar-backdrop';
    bd.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:150;';
    bd.onclick = () => {
      document.body.classList.remove('sidebar-open');
      sidebar.classList.remove('mobile-open');
      bd.style.display = 'none';
    };
    document.body.appendChild(bd);
  }

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const w = window.innerWidth || 1200;
    if (w <= 992) {
      document.body.classList.toggle('sidebar-open');
      sidebar.classList.toggle('mobile-open');
      const open = document.body.classList.contains('sidebar-open');
      const bd = document.getElementById('sr-sidebar-backdrop');
      if (bd) bd.style.display = open ? 'block' : 'none';
    } else {
      const isCollapsed = sidebar.classList.toggle('collapsed');
      mainContent?.classList.toggle('sidebar-collapsed', isCollapsed);
      localStorage.setItem('sr-sidebar-collapsed', isCollapsed ? '1' : '0');
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 992) {
      document.body.classList.remove('sidebar-open');
      sidebar.classList.remove('mobile-open');
      const bd = document.getElementById('sr-sidebar-backdrop');
      if (bd) bd.style.display = 'none';
    }
    try {
      if (window.MapEngine && MapEngine.map) MapEngine.map.invalidateSize(true);
    } catch (err) {}
  });
}

function initNavbarLangDropdown() {
  /* optional — requires js/i18n.js */
}

function injectResponsiveCss() {
  if (document.getElementById('sr-responsive-css-link')) return;
  const link = document.createElement('link');
  link.id = 'sr-responsive-css-link';
  link.rel = 'stylesheet';
  link.href = 'css/responsive.css?v=2';
  document.head.appendChild(link);
  if (!document.getElementById('sr-mobile-shell-css')) {
    const style = document.createElement('style');
    style.id = 'sr-mobile-shell-css';
    style.textContent =
      '@media(max-width:992px){' +
      '.sidebar{transform:translateX(-105%);width:min(280px,86vw)!important;z-index:300!important;transition:transform .28s ease;}' +
      '.sidebar.mobile-open,body.sidebar-open .sidebar{transform:translateX(0)!important;box-shadow:8px 0 32px rgba(0,0,0,.55);}' +
      '.main-content,.main-content.sidebar-collapsed{margin-left:0!important;width:100%!important;}' +
      '.navbar-brand-text{display:none;}' +
      '}' +
      '@media(max-width:640px){.navbar-title{font-size:14px!important;max-width:42vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}}';
    document.head.appendChild(style);
  }
}

function initSharedComponents(config = {}) {
  const { title, subtitle } = config;
  injectResponsiveCss();

  let appShell = document.querySelector('.app-shell') || document.getElementById('app-root');
  if (!appShell) {
    appShell = document.createElement('div');
    appShell.className = 'app-shell';
    appShell.id = 'app-root';
    while (document.body.firstChild) appShell.appendChild(document.body.firstChild);
    document.body.appendChild(appShell);
  }
  if (!appShell.classList.contains('app-shell')) appShell.classList.add('app-shell');

  if (!document.getElementById('sidebar')) {
    const sidebar = buildSidebar();
    appShell.insertBefore(sidebar, appShell.firstChild);
  }

  let mainContent = appShell.querySelector('.main-content') || document.getElementById('main-content');
  if (!mainContent) {
    mainContent = document.createElement('div');
    mainContent.className = 'main-content';
    mainContent.id = 'main-content';
    while (appShell.children.length > 1) {
      mainContent.appendChild(appShell.children[1]);
    }
    appShell.appendChild(mainContent);
  } else {
    mainContent.id = 'main-content';
    if (!mainContent.classList.contains('main-content')) mainContent.classList.add('main-content');
  }

  const collapsed = localStorage.getItem('sr-sidebar-collapsed') === '1';
  if (collapsed) mainContent.classList.add('sidebar-collapsed');

  if (!document.getElementById('navbar')) {
    const navbar = buildNavbar(title, subtitle);
    mainContent.insertBefore(navbar, mainContent.firstChild);
  }

  initClock();
  initSidebarToggle();
  initNavbarLangDropdown();

  const body = mainContent.querySelector('.page-body');
  if (body) {
    body.style.opacity = '0';
    body.style.transform = 'translateY(12px)';
    requestAnimationFrame(() => {
      body.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      body.style.opacity = '1';
      body.style.transform = 'translateY(0)';
    });
  }

  if (!window.SmartRouteI18n) {
    const i18nScript = document.createElement('script');
    i18nScript.src = 'js/i18n.js';
    i18nScript.onload = () => {
      if (window.SmartRouteI18n) window.SmartRouteI18n.applyLanguage();
    };
    document.head.appendChild(i18nScript);
  } else {
    window.SmartRouteI18n.applyLanguage();
  }

  if (!window.SmartRouteAPI) {
    const apiScript = document.createElement('script');
    apiScript.src = 'js/api.js';
    document.head.appendChild(apiScript);
  } else if (window.SmartRouteAPI.checkHealth) {
    window.SmartRouteAPI.checkHealth();
  }
}

function animateCountUp(el, target, duration = 1500, prefix = '', suffix = '') {
  const startTime = performance.now();
  const start = 0;
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(start + (target - start) * ease);
    el.textContent = prefix + value.toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function initCountUps() {
  document.querySelectorAll('[data-countup]').forEach(el => {
    const target = parseFloat(el.dataset.countup);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const duration = parseInt(el.dataset.duration) || 1500;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCountUp(el, target, duration, prefix, suffix);
          observer.disconnect();
        }
      });
    }, { threshold: 0.3 });
    observer.observe(el);
  });
}

function showToast(msg, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    Object.assign(container.style, {
      position: 'fixed', bottom: '24px', right: '24px',
      zIndex: '9999', display: 'flex', flexDirection: 'column', gap: '8px'
    });
    document.body.appendChild(container);
  }
  const colors = {
    info: ['rgba(79,172,254,0.15)', '#4facfe'],
    success: ['rgba(0,255,136,0.12)', '#00ff88'],
    warn: ['rgba(255,149,0,0.12)', '#ff9500'],
    danger: ['rgba(255,59,59,0.12)', '#ff3b3b']
  };
  const [bg, borderColor] = colors[type] || colors.info;
  const toast = document.createElement('div');
  Object.assign(toast.style, {
    background: 'rgba(5,12,28,0.95)',
    backdropFilter: 'blur(20px)',
    border: `1px solid ${borderColor}`,
    borderLeft: `3px solid ${borderColor}`,
    borderRadius: '10px',
    padding: '12px 16px',
    color: '#e8f4ff',
    fontSize: '0.9rem',
    maxWidth: 'min(320px,90vw)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
    backgroundColor: bg
  });
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

window.SmartRoute = {
  initSharedComponents,
  initCountUps,
  animateCountUp,
  showToast,
  getPageId,
  brandLogoHtml: function () {
    return '<div class="sidebar-logo-icon" style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#00d4ff,#00ff88);display:flex;align-items:center;justify-content:center;font-weight:900;color:#031018;font-size:15px;">SR</div>';
  }
};
