/* Force selected language (e.g. Telugu) onto all UI every page load */
(function () {
  'use strict';

  function getLang() {
    try {
      return localStorage.getItem('sr_language') || 'en';
    } catch (e) {
      return 'en';
    }
  }

  function applyNow(code) {
    code = code || getLang();
    if (!window.SmartRouteI18n) return false;

    try { localStorage.setItem('sr_language', code); } catch (e) {}
    SmartRouteI18n._currentLang = code;
    document.documentElement.lang = code;

    // 1) All data-i18n nodes from dictionary (works for te, hi, as, ...)
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (!key) return;
      var tr = SmartRouteI18n.t(key, code);
      if (tr && tr !== key) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.setAttribute('placeholder', tr);
        } else {
          el.textContent = tr;
        }
      }
    });

    // 2) Sidebar nav by href mapping
    var hrefToKey = {
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

    document.querySelectorAll('.nav-item').forEach(function (a) {
      var href = (a.getAttribute('href') || '').split('/').pop();
      var key = hrefToKey[href];
      if (!key) return;
      var label = a.querySelector('.nav-label');
      if (!label) return;
      var tr = SmartRouteI18n.t(key, code);
      if (tr && tr !== key) label.textContent = tr;
    });

    // 3) Section labels
    var secKeys = [
      'nav_sec_operations', 'nav_sec_intelligence', 'nav_sec_transport',
      'nav_sec_monitoring', 'nav_sec_analytics', 'nav_sec_field', 'nav_sec_system'
    ];
    document.querySelectorAll('.sidebar-section-label').forEach(function (el, i) {
      var key = el.getAttribute('data-i18n') || secKeys[i];
      if (!key) return;
      var tr = SmartRouteI18n.t(key, code);
      if (tr && tr !== key) el.textContent = tr;
    });

    // 4) Deep phrase apply if available
    if (typeof SmartRouteI18n.applyDeep === 'function') {
      try { SmartRouteI18n.applyDeep(code); } catch (e) {}
    } else if (typeof SmartRouteI18n.applyLanguage === 'function') {
      try { SmartRouteI18n.applyLanguage(code); } catch (e) {}
    }

    if (window.SmartRoute && typeof SmartRoute.refreshLanguage === 'function') {
      try { SmartRoute.refreshLanguage(code); } catch (e) {}
    }

    return true;
  }

  function boot() {
    var code = getLang();
    if (code === 'en') return; // nothing to force

    function tryApply() {
      if (!window.SmartRouteI18n) return false;
      applyNow(code);
      return true;
    }

    var n = 0;
    var timer = setInterval(function () {
      n++;
      if (tryApply() || n > 40) {
        // keep re-applying a few times after sidebar builds
        if (n > 8) clearInterval(timer);
      }
    }, 150);

    // Also after full load
    window.addEventListener('load', function () {
      setTimeout(function () { applyNow(getLang()); }, 100);
      setTimeout(function () { applyNow(getLang()); }, 600);
      setTimeout(function () { applyNow(getLang()); }, 1200);
    });
  }

  // Expose for Apply button
  window.SmartRouteForceI18n = { apply: applyNow, getLang: getLang };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
