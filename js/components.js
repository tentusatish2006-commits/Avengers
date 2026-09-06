/* ============================================================
   SMARTROUTE — SHARED COMPONENT INJECTOR
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
      { id: 'reports',           label: 'Reports',              icon: '📋',  href: 'reports.html' },
    ]
  },
  {
    section: 'ANALYTICS',
    items: [
      { id: 'analytics',         label: 'Analytics',            icon: '📊',  href: 'analytics.html' },
      { id: 'simulation',        label: 'Live Simulation',      icon: '▶',  href: 'simulation.html' },
    ]
  },
  {
    section: 'FIELD',
    items: [
      { id: 'field-report',      label: 'Field Report',         icon: '📍',  href: 'field-report.html' },
      { id: 'officer-dashboard', label: 'Officer Dashboard',    icon: '📱',  href: 'officer-dashboard.html' },
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
    <a href="index.html" class="sidebar-logo">
      <div class="sidebar-logo-icon">SR</div>
      <div class="sidebar-logo-text">
        <div class="sidebar-logo-title">SmartRoute</div>
        <div class="sidebar-logo-sub">Emergency Mgmt</div>
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
        <span class="nav-icon">${item.icon}</span>
        <span class="nav-label" data-i18n="${itemKey}">${itemLabel}</span>
        ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
      `;
      nav.appendChild(a);
    });
  });

  try {
    const savedName = localStorage.getItem('sr_username');
    const savedRole = localStorage.getItem('sr_user_role');
    const savedRegion = localStorage.getItem('sr_region');
    if (savedName) {
      const nameEl = sidebar.querySelector('#sidebar-user-name');
      const avEl = sidebar.querySelector('#sidebar-user-avatar');
      if (nameEl) nameEl.textContent = savedName;
      if (avEl) {
        const initials = savedName.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
        if (initials) avEl.textContent = initials;
      }
    }
    if (savedRole || savedRegion) {
      const roleEl = sidebar.querySelector('#sidebar-user-role');
      if (roleEl) roleEl.textContent = `${savedRole || 'HQ Command'} · ${savedRegion || 'North-Eastern Region'}`;
    }
  } catch(e) {}

  return sidebar;
}

function buildNavbar(title, subtitle) {
  const navbar = document.createElement('header');
  navbar.className = 'navbar';
  navbar.id = 'navbar';

  navbar.innerHTML = `
    <div class="navbar-left">
      <button class="collapse-btn" id="sidebar-toggle" title="Toggle Sidebar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <div>
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

      <!-- Quick Language Selector in Navbar -->
      <div class="navbar-lang-container" style="position:relative; display:inline-flex; align-items:center;">
        <button type="button" id="navbar-lang-btn" class="navbar-alert-btn" title="Select Language" style="display:inline-flex; align-items:center; gap:5px; padding:4px 9px; font-size:12px; border-radius:6px; border:1px solid rgba(0,212,255,0.3); background:rgba(0,212,255,0.08); color:#00d4ff; cursor:pointer; font-weight:600;">
          <span id="navbar-lang-flag">🌐</span>
          <span id="navbar-lang-code" style="font-family:'JetBrains Mono',monospace;">EN</span>
          <span style="font-size:8px; opacity:0.8;">▼</span>
        </button>
        <div id="navbar-lang-dropdown" class="glass-card" style="display:none; position:absolute; right:0; top:calc(100% + 8px); width:230px; max-height:350px; overflow-y:auto; z-index:99999; padding:6px; border-radius:8px; border:1px solid rgba(0,212,255,0.3); background:#061325; box-shadow:0 12px 36px rgba(0,0,0,0.85);">
        </div>
      </div>

      <div class="navbar-clock" id="navbar-clock">--:--:--</div>
      <button class="navbar-alert-btn" title="Alerts" onclick="location.href='alerts.html'">
        🔔
        <span class="navbar-alert-dot"></span>
      </button>
      <a href="settings.html" class="navbar-alert-btn" title="Settings">⚙</a>
    </div>
  `;

  return navbar;
}

function initClock() {
  const clockEl = document.getElementById('navbar-clock');
  if (!clockEl) return;

  function tick() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2,'0');
    const m = String(now.getMinutes()).padStart(2,'0');
    const s = String(now.getSeconds()).padStart(2,'0');
    clockEl.textContent = `${h}:${m}:${s}`;
  }
  tick();
  setInterval(tick, 1000);
}

function initSidebarToggle() {
  const btn = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('main-content');
  if (!btn || !sidebar) return;

  btn.addEventListener('click', () => {
    const isCollapsed = sidebar.classList.toggle('collapsed');
    mainContent?.classList.toggle('sidebar-collapsed', isCollapsed);
    localStorage.setItem('sr-sidebar-collapsed', isCollapsed ? '1' : '0');
  });

  // Mobile open/close
  if (window.innerWidth <= 900) {
    btn.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
    });
  }
}

function initNavbarLangDropdown() {
  const btn = document.getElementById('navbar-lang-btn');
  const menu = document.getElementById('navbar-lang-dropdown');
  const flagEl = document.getElementById('navbar-lang-flag');
  const codeEl = document.getElementById('navbar-lang-code');
  if (!btn || !menu) return;

  function updateNavbarLang() {
    if (!window.SmartRouteI18n) return;
    const code = SmartRouteI18n.getLanguage();
    const info = SmartRouteI18n.getLanguageInfo(code);
    if (flagEl) flagEl.textContent = info.flag;
    if (codeEl) codeEl.textContent = info.code.toUpperCase();

    // Render options
    menu.innerHTML = '';
    SmartRouteI18n.languages.forEach(l => {
      const isCurrent = l.code === code;
      const opt = document.createElement('div');
      opt.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 7px 10px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        color: ${isCurrent ? '#00ff88' : '#fff'};
        background: ${isCurrent ? 'rgba(0,255,136,0.1)' : 'transparent'};
        transition: background 0.15s ease;
      `;
      opt.innerHTML = `
        <span style="font-size:16px;">${l.flag}</span>
        <div style="flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
          <span style="font-weight:600;">${l.name}</span>
          <span style="color:#8fa3b8; font-size:11px; margin-left:4px;">${l.native}</span>
        </div>
        ${isCurrent ? '<span style="color:#00ff88; font-size:12px;">✓</span>' : ''}
      `;
      opt.addEventListener('mouseenter', () => {
        if (l.code !== SmartRouteI18n.getLanguage()) opt.style.background = 'rgba(0,212,255,0.12)';
      });
      opt.addEventListener('mouseleave', () => {
        if (l.code !== SmartRouteI18n.getLanguage()) opt.style.background = 'transparent';
      });
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        SmartRouteI18n.setLanguage(l.code);
        updateNavbarLang();
        menu.style.display = 'none';
        if (window.SmartRoute && SmartRoute.showToast) {
          SmartRoute.showToast(`🌐 Language: ${l.name} (${l.native})`, 'success', 2500);
        }
      });
      menu.appendChild(opt);
    });
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = menu.style.display === 'none' || menu.style.display === '';
    menu.style.display = isHidden ? 'block' : 'none';
    if (isHidden) updateNavbarLang();
  });

  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && e.target !== btn) {
      menu.style.display = 'none';
    }
  });

  window.addEventListener('smartroute:language-changed', updateNavbarLang);

  if (window.SmartRouteI18n) {
    updateNavbarLang();
  } else {
    setTimeout(updateNavbarLang, 350);
  }
}

/* ── Main Init ──────────────────────────────────────────────── */
function initSharedComponents(config = {}) {
  const { title, subtitle } = config;

  const appShell = document.querySelector('.app-shell');
  if (!appShell) return;

  // Build sidebar
  const sidebar = buildSidebar();
  appShell.insertBefore(sidebar, appShell.firstChild);

  // Build main content wrapper if not present
  let mainContent = appShell.querySelector('.main-content');
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
  }

  // Check saved collapsed state
  const collapsed = localStorage.getItem('sr-sidebar-collapsed') === '1';
  if (collapsed) mainContent.classList.add('sidebar-collapsed');

  // Build navbar
  const navbar = buildNavbar(title, subtitle);
  mainContent.insertBefore(navbar, mainContent.firstChild);

  initClock();
  initSidebarToggle();
  initNavbarLangDropdown();

  // Page entrance animation
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

  // Ensure i18n engine is active
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

  // Ensure API bridge client is active
  if (!window.SmartRouteAPI) {
    const apiScript = document.createElement('script');
    apiScript.src = 'js/api.js';
    document.head.appendChild(apiScript);
  } else {
    window.SmartRouteAPI.checkHealth();
  }
}

/* ── Count-up Animation ─────────────────────────────────────── */
function animateCountUp(el, target, duration = 1500, prefix = '', suffix = '') {
  const startTime = performance.now();
  const start = 0;

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
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

/* ── Toast Notification ─────────────────────────────────────── */
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
    info:    ['var(--info)',    'rgba(79,172,254,0.15)'],
    success: ['var(--safe)',   'rgba(0,255,136,0.15)'],
    warn:    ['var(--warn)',   'rgba(255,149,0,0.15)'],
    danger:  ['var(--danger)', 'rgba(255,59,59,0.15)'],
  };
  const [borderColor, bg] = colors[type] || colors.info;

  const toast = document.createElement('div');
  Object.assign(toast.style, {
    background: `rgba(5,12,28,0.95)`,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${borderColor}`,
    borderLeft: `3px solid ${borderColor}`,
    borderRadius: 'var(--radius-md)',
    padding: '12px 16px',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-primary)',
    maxWidth: '320px',
    boxShadow: 'var(--shadow-hover)',
    animation: 'fadeInRight 0.3s ease both',
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

/* ── Export ─────────────────────────────────────────────────── */
window.SmartRoute = {
  initSharedComponents,
  initCountUps,
  animateCountUp,
  showToast,
  getPageId,
};
