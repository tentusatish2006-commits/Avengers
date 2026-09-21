/* SmartRoute — sidebar + hamburger + topbar LIVE/clock/alerts/settings + mobile responsive */
(function () {
  'use strict';

  var NAV = [
    { href: 'dashboard.html', key: 'nav_dashboard', label: 'Dashboard', icon: '📊' },
    { href: 'map.html', key: 'nav_map', label: 'Live Map', icon: '🗺️' },
    { href: 'route-prediction.html', key: 'nav_route', label: 'AI Route Prediction', icon: '🧭' },
    { href: 'alternate-routes.html', key: 'nav_alt', label: 'Alternate Routes', icon: '🔀' },
    { href: 'incidents.html', key: 'nav_incidents', label: 'Incidents', icon: '⚠️' },
    { href: 'photo-analysis.html', key: 'nav_photo', label: 'AI Photo Analysis', icon: '📷' },
    { href: 'field-report.html', key: 'nav_field', label: 'Field Report', icon: '📍' },
    { href: 'vehicle-tracking.html', key: 'nav_vehicles', label: 'Vehicle Tracking', icon: '🚚' },
    { href: 'deliveries.html', key: 'nav_deliveries', label: 'Deliveries', icon: '📦' },
    { href: 'officers.html', key: 'nav_officers', label: 'Officers', icon: '👮' },
    { href: 'alerts.html', key: 'nav_alerts', label: 'Alerts', icon: '🔔' },
    { href: 'analytics.html', key: 'nav_analytics', label: 'Analytics', icon: '📈' },
    { href: 'simulation.html', key: 'nav_sim', label: 'Live Simulation', icon: '🎬' },
    { href: 'admin.html', key: 'nav_admin', label: 'Admin', icon: '⚙️' }
  ];

  function currentLang() {
    try { return localStorage.getItem('sr_lang') || 'en'; } catch (e) { return 'en'; }
  }
  function tr(key, fallback) { return fallback || key; }
  function applyFullLanguage() {}
  function brandLogoHtml() {
    return '<div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#00d4ff,#00ff88);display:flex;align-items:center;justify-content:center;font-weight:800;color:#031018;font-size:14px;">SR</div>';
  }
  function isLoggedIn() {
    try {
      return localStorage.getItem('sr_logged_in') === '1' || !!localStorage.getItem('sr_user') || !!localStorage.getItem('sr_session');
    } catch (e) { return true; }
  }
  function requireAuth() {
    var path = (location.pathname || '').toLowerCase();
    if (path.indexOf('login') >= 0 || path.indexOf('signup') >= 0 || path.indexOf('index') >= 0) return true;
    return true;
  }
  function showToast(msg, type, ms) {
    var el = document.getElementById('sr-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'sr-toast';
      el.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;padding:12px 18px;border-radius:10px;background:#0a1628;border:1px solid rgba(0,212,255,0.4);color:#e8f4ff;font-size:0.9rem;max-width:min(360px,90vw);box-shadow:0 8px 32px rgba(0,0,0,0.4);';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.borderColor = type === 'warn' || type === 'danger' ? '#ff9500' : (type === 'success' ? '#00ff88' : 'rgba(0,212,255,0.4)');
    el.style.display = 'block';
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.style.display = 'none'; }, ms || 2800);
  }

  function buildSidebar(active) {
    var html = '';
    html += '<aside class="sidebar" id="sidebar" data-sr-stable="1">';
    html += '<div class="sidebar-brand" style="display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid rgba(0,212,255,0.15);flex-shrink:0;">';
    html += brandLogoHtml();
    html += '<div><div style="font-weight:800;color:#00d4ff;font-size:0.95rem;">SmartRoute</div><div style="font-size:0.7rem;color:#8fa3b8;">NER Command</div></div></div>';
    html += '<nav class="sidebar-nav" id="sr-sidebar-nav" style="flex:1;overflow-y:auto;padding:8px 0 12px;">';
    NAV.forEach(function (item) {
      var isActive = (active && item.href.indexOf(active) >= 0) || (location.pathname || '').indexOf(item.href.replace('.html','')) >= 0;
      html += '<a class="nav-item' + (isActive ? ' active' : '') + '" href="' + item.href + '" style="display:flex;align-items:center;gap:10px;padding:10px 16px;color:' + (isActive ? '#00d4ff' : '#c8d4e0') + ';text-decoration:none;font-size:0.88rem;">';
      html += '<span class="nav-icon">' + item.icon + '</span><span class="nav-label">' + item.label + '</span></a>';
    });
    html += '</nav>';
    html += '<div class="sidebar-footer" style="border-top:1px solid rgba(0,212,255,0.15);padding:10px 8px;flex-shrink:0;">';
    html += '<button type="button" id="sr-signout" style="width:100%;padding:10px;border-radius:8px;border:1px solid rgba(255,59,59,0.4);background:rgba(255,59,59,0.1);color:#ff8a8a;font-weight:700;cursor:pointer;">Sign out</button>';
    html += '</div></aside>';
    return html;
  }

  function highlightSidebarActive(active) {}
  function ensureStableSidebar(active) {
    var shell = document.querySelector('.app-shell') || document.getElementById('app-root') || document.body;
    shell.querySelectorAll('aside.sidebar, #sidebar, .sidebar').forEach(function (el) {
      if (el.id !== 'sidebar' && el.getAttribute('data-sr-stable') !== '1') el.remove();
    });
    var root = document.getElementById('sidebar');
    if (!root) {
      var wrap = document.createElement('div');
      wrap.innerHTML = buildSidebar(active);
      var aside = wrap.firstChild;
      shell.insertBefore(aside, shell.firstChild);
    }
    shell.setAttribute('data-sr-sidebar-locked', '1');
  }

  function injectSidebarCss() {
    if (document.getElementById('sr-sidebar-css')) return;
    var style = document.createElement('style');
    style.id = 'sr-sidebar-css';
    style.textContent =
      '.sidebar{display:flex;flex-direction:column;width:260px;min-height:100vh;position:fixed;left:0;top:0;bottom:0;z-index:200;' +
      'background:rgba(4,11,26,0.96);backdrop-filter:blur(20px);border-right:1px solid rgba(0,212,255,0.15);transition:transform .28s ease,width .28s ease;}' +
      '.main-content{margin-left:260px;min-height:100vh;min-width:0;transition:margin-left .28s ease;}' +
      '#sr-sidebar-backdrop{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:150;}' +
      'body.sidebar-hidden .sidebar{transform:translateX(-105%);}' +
      'body.sidebar-hidden .main-content{margin-left:0;}' +
      'body.sidebar-hidden #sr-sidebar-backdrop{display:block;}' +
      '@media(max-width:992px){' +
        '.sidebar{transform:translateX(-105%);width:min(280px,86vw)!important;z-index:300!important;}' +
        '.main-content{margin-left:0!important;width:100%!important;}' +
        'body.sidebar-open .sidebar{transform:translateX(0)!important;box-shadow:8px 0 32px rgba(0,0,0,0.55);}' +
        'body.sidebar-open #sr-sidebar-backdrop{display:block!important;}' +
        'body.sidebar-hidden .sidebar{transform:translateX(-105%);}' +
      '}' +
      '@media(max-width:640px){.page-body{padding:12px!important;}}';
    document.head.appendChild(style);
  }

  function ensureViewportMeta() {
    if (document.querySelector('meta[name="viewport"]')) return;
    var m = document.createElement('meta');
    m.name = 'viewport';
    m.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
    document.head.appendChild(m);
  }

  function injectResponsiveCss() {
    if (document.getElementById('sr-responsive-css-link')) return;
    var link = document.createElement('link');
    link.id = 'sr-responsive-css-link';
    link.rel = 'stylesheet';
    link.href = 'css/responsive.css?v=1';
    document.head.appendChild(link);
  }

  function injectTimelineFixCss() {}

  function buildTopbarRightHtml() {
    return '<div class="topbar-right" style="display:flex;align-items:center;gap:8px;margin-left:auto;">' +
      '<span id="sr-clock" style="font-family:monospace;color:#8fa3b8;font-size:0.85rem;"></span>' +
      '<a href="alerts.html" id="sr-alerts-btn" title="Alerts" style="position:relative;width:42px;height:42px;border-radius:11px;display:inline-flex;align-items:center;justify-content:center;background:rgba(255,149,0,0.15);border:1px solid rgba(255,149,0,0.5);text-decoration:none;font-size:1.2rem;">🔔</a>' +
      '</div>';
  }

  function ensureTopbar(opts) {
    opts = opts || {};
    var main = document.getElementById('main-content') || document.querySelector('.main-content');
    if (!main) return;
    if (document.getElementById('sr-menu')) return;
    var top = document.createElement('div');
    top.className = 'topbar';
    top.style.cssText = 'display:flex;align-items:center;gap:12px;padding:10px 14px;border-bottom:1px solid rgba(0,212,255,0.12);background:rgba(4,11,26,0.7);position:sticky;top:0;z-index:50;';
    top.innerHTML =
      '<div class="topbar-left" style="display:flex;align-items:center;gap:12px;min-width:0;">' +
        '<button type="button" class="icon-btn" id="sr-menu" aria-label="Open menu" style="width:38px;height:38px;border-radius:9px;border:1px solid rgba(0,212,255,0.3);background:rgba(0,212,255,0.1);color:#e8f4ff;cursor:pointer;font-size:1.2rem;flex-shrink:0;">☰</button>' +
        '<div style="min-width:0;"><div class="topbar-title" style="font-weight:700;color:#e8f4ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (opts.title || document.title) + '</div>' +
        '<div class="topbar-sub" style="font-size:0.78rem;color:#8fa3b8;">' + (opts.subtitle || '') + '</div></div></div>' +
      buildTopbarRightHtml();
    main.insertBefore(top, main.firstChild);
  }

  function wireMenuButton() {
    var menu = document.getElementById('sr-menu');
    if (!menu || menu._srWired) return;
    menu._srWired = true;
    menu.onclick = function (e) {
      e.preventDefault(); e.stopPropagation();
      var w = window.innerWidth || 1200;
      if (w <= 992) {
        document.body.classList.toggle('sidebar-open');
        document.body.classList.remove('sidebar-hidden');
      } else {
        document.body.classList.toggle('sidebar-hidden');
        document.body.classList.remove('sidebar-open');
      }
    };
  }

  function initSharedComponents(opts) {
    opts = opts || {};
    if (!requireAuth()) return;
    injectSidebarCss();
    ensureViewportMeta();
    injectResponsiveCss();
    injectTimelineFixCss();
    ensureStableSidebar(opts.active);
    ensureTopbar(opts);
    if (!document.getElementById('sr-sidebar-backdrop')) {
      var bd = document.createElement('div');
      bd.id = 'sr-sidebar-backdrop';
      bd.onclick = function () {
        document.body.classList.remove('sidebar-open');
        document.body.classList.remove('sidebar-hidden');
      };
      document.body.appendChild(bd);
    }
    var so = document.getElementById('sr-signout');
    if (so) {
      so.onclick = function () {
        try {
          localStorage.removeItem('sr_user');
          sessionStorage.removeItem('sr_user');
          localStorage.removeItem('sr_logged_in');
          localStorage.removeItem('sr_username');
          localStorage.removeItem('sr_session');
        } catch (e) {}
        location.href = 'login.html';
      };
    }
    wireMenuButton();
    window.addEventListener('resize', function () {
      if (window.innerWidth > 992) document.body.classList.remove('sidebar-open');
      try {
        if (window.MapEngine && MapEngine.map) MapEngine.map.invalidateSize(true);
      } catch (e) {}
    });
    window.addEventListener('orientationchange', function () {
      setTimeout(function () {
        try { if (window.MapEngine && MapEngine.map) MapEngine.map.invalidateSize(true); } catch (e) {}
      }, 300);
    });
    function tick() {
      var el = document.getElementById('sr-clock');
      if (el) el.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    tick();
    setInterval(tick, 1000);
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
})();
