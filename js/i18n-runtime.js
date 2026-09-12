/**
 * SmartRoute language runtime
 * Fixes: language selected but UI stays English
 *
 * Causes addressed:
 * 1) Sidebar built with hardcoded English AFTER apply
 * 2) Apply runs before DOM/sidebar exists
 * 3) No re-render when localStorage language changes
 */
(function () {
  'use strict';

  var HREF_KEY = {
    'dashboard.html': 'nav_dashboard',
    'map.html': 'nav_map',
    'incidents.html': 'nav_incidents',
    'alerts.html': 'nav_alerts',
    'emergency.html': 'nav_emergency',
    'route-prediction.html': 'nav_route_prediction',
    'alternate-routes.html': 'nav_alternate_routes',
    'ai-command.html': 'nav_ai_command',
    'photo-analysis.html': 'nav_photo_analysis',
    'weather.html': 'nav_weather',
    'vehicle-tracking.html': 'nav_vehicle_tracking',
    'deliveries.html': 'nav_deliveries',
    'corridors.html': 'nav_corridors',
    'districts.html': 'nav_districts',
    'infrastructure.html': 'nav_infrastructure',
    'officers.html': 'nav_officers',
    'reports.html': 'nav_reports',
    'analytics.html': 'nav_analytics',
    'simulation.html': 'nav_simulation',
    'field-report.html': 'nav_field_report',
    'officer-dashboard.html': 'nav_officer_dashboard',
    'language.html': 'nav_language',
    'admin.html': 'nav_admin',
    'settings.html': 'nav_settings',
    'login.html': 'sign_out'
  };

  function getLang() {
    try {
      var s = localStorage.getItem('sr_language');
      return s || 'en';
    } catch (e) {
      return 'en';
    }
  }

  function t(key, code) {
    if (window.SmartRouteI18n && typeof SmartRouteI18n.t === 'function') {
      return SmartRouteI18n.t(key, code || getLang());
    }
    return key;
  }

  function applyAll(code) {
    code = code || getLang();
    try { localStorage.setItem('sr_language', code); } catch (e) {}
    document.documentElement.lang = code;

    if (window.SmartRouteI18n) {
      SmartRouteI18n._currentLang = code;
    }

    // A) data-i18n attributes
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (!key) return;
      var val = t(key, code);
      if (!val || val === key) return;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.setAttribute('placeholder', val);
      } else {
        el.textContent = val;
      }
    });

    // B) sidebar nav labels by href (even if data-i18n missing/wrong)
    document.querySelectorAll('a.nav-item').forEach(function (a) {
      var href = (a.getAttribute('href') || '').split('/').pop();
      var key = HREF_KEY[href];
      if (!key) return;
      var label = a.querySelector('.nav-label') || a;
      var val = t(key, code);
      if (val && val !== key) {
        if (label.classList && label.classList.contains('nav-label')) {
          label.textContent = val;
        } else {
          // keep icon, replace text nodes carefully
          var span = a.querySelector('.nav-label');
          if (span) span.textContent = val;
        }
      }
    });

    // C) section labels
    document.querySelectorAll('.sidebar-section-label').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (!key) return;
      var val = t(key, code);
      if (val && val !== key) el.textContent = val;
    });

    // D) page title elements
    document.querySelectorAll('.page-title,[data-i18n-title]').forEach(function (el) {
      var key = el.getAttribute('data-i18n') || el.getAttribute('data-i18n-title');
      if (!key) return;
      var val = t(key, code);
      if (val && val !== key) el.textContent = val;
    });

    // E) call upstream deep apply if present
    try {
      if (window.SmartRouteI18n && SmartRouteI18n.applyDeep) {
        SmartRouteI18n.applyDeep(code);
      }
    } catch (e) {}

    return true;
  }

  function scheduleApply() {
    var code = getLang();
    applyAll(code);
    // Sidebar often mounts late — re-apply several times
    [50, 150, 300, 600, 1000, 2000].forEach(function (ms) {
      setTimeout(function () { applyAll(getLang()); }, ms);
    });
  }

  // Observe sidebar injection and re-apply language
  function watchDom() {
    if (!window.MutationObserver) return;
    var obs = new MutationObserver(function (mutations) {
      var need = false;
      for (var i = 0; i < mutations.length; i++) {
        if (mutations[i].addedNodes && mutations[i].addedNodes.length) {
          need = true;
          break;
        }
      }
      if (need) {
        clearTimeout(window.__srI18nMutTimer);
        window.__srI18nMutTimer = setTimeout(function () {
          applyAll(getLang());
        }, 80);
      }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }

  // Public API
  window.SmartRouteI18nRuntime = {
    getLang: getLang,
    applyAll: applyAll,
    setLang: function (code) {
      try { localStorage.setItem('sr_language', code); } catch (e) {}
      if (window.SmartRouteI18n) {
        SmartRouteI18n._currentLang = code;
        try {
          if (SmartRouteI18n.setLanguage) SmartRouteI18n.setLanguage(code);
        } catch (e2) {}
      }
      applyAll(code);
      scheduleApply();
    }
  };

  function boot() {
    // Wait for i18n.js if needed
    if (!window.SmartRouteI18n) {
      var tries = 0;
      var timer = setInterval(function () {
        tries++;
        if (window.SmartRouteI18n || tries > 50) {
          clearInterval(timer);
          scheduleApply();
          watchDom();
        }
      }, 100);
      return;
    }
    scheduleApply();
    watchDom();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.addEventListener('load', function () {
    scheduleApply();
  });

  window.addEventListener('smartroute:language-changed', function (e) {
    var code = (e.detail && e.detail.language) || getLang();
    applyAll(code);
  });
})();
