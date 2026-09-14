/* Force selected language onto UI — lightweight, no long polling */
(function () {
  'use strict';

  function getLang() {
    try { return localStorage.getItem('sr_language') || 'en'; } catch (e) { return 'en'; }
  }

  function applyNow(code) {
    code = code || getLang();
    if (!window.SmartRouteI18n) return false;
    try { localStorage.setItem('sr_language', code); } catch (e) {}
    SmartRouteI18n._currentLang = code;
    document.documentElement.lang = code;

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (!key) return;
      var tr = SmartRouteI18n.t(key, code);
      if (!tr || tr === key) return;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.setAttribute('placeholder', tr);
      else el.textContent = tr;
    });

    var hrefToKey = {
      'dashboard.html': 'nav_dashboard', 'map.html': 'nav_map', 'incidents.html': 'nav_incidents',
      'alerts.html': 'nav_alerts', 'emergency.html': 'nav_emergency',
      'route-prediction.html': 'nav_route_prediction', 'alternate-routes.html': 'nav_alternate_routes',
      'ai-command.html': 'nav_ai_command', 'photo-analysis.html': 'nav_photo_analysis',
      'weather.html': 'nav_weather', 'vehicle-tracking.html': 'nav_vehicle_tracking',
      'deliveries.html': 'nav_deliveries', 'corridors.html': 'nav_corridors',
      'districts.html': 'nav_districts', 'infrastructure.html': 'nav_infrastructure',
      'officers.html': 'nav_officers', 'reports.html': 'nav_reports',
      'analytics.html': 'nav_analytics', 'simulation.html': 'nav_simulation',
      'field-report.html': 'nav_field_report', 'officer-dashboard.html': 'nav_officer_dashboard',
      'language.html': 'nav_language', 'admin.html': 'nav_admin', 'settings.html': 'nav_settings'
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

    document.querySelectorAll('.nav-section-label,[data-i18n-section]').forEach(function (el) {
      var key = el.getAttribute('data-i18n') || el.getAttribute('data-i18n-section');
      if (!key || !window.SmartRouteI18n) return;
      var tr = SmartRouteI18n.t(key, code);
      if (tr && tr !== key) el.textContent = tr;
    });

    return true;
  }

  function boot() {
    var code = getLang();
    if (code === 'en') return;

    var tries = 0;
    function attempt() {
      tries++;
      if (applyNow(code) || tries > 12) return;
      setTimeout(attempt, 200);
    }
    attempt();
    window.addEventListener('load', function () {
      setTimeout(function () { applyNow(getLang()); }, 300);
    });
  }

  window.SmartRouteForceI18n = { apply: applyNow, getLang: getLang };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
