/**
 * Language runtime — does NOT rebuild or replace the left sidebar structure.
 * Only updates text inside [data-i18n] nodes.
 */
(function () {
  'use strict';

  var applying = false;

  function getLang() {
    try { return localStorage.getItem('sr_language') || 'en'; } catch (e) { return 'en'; }
  }

  function applyTextOnly(code) {
    if (applying) return;
    applying = true;
    code = code || getLang();
    try {
      if (window.SmartRouteI18n) {
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
          // Never replace icon nodes or whole nav-item
          if (el.classList && el.classList.contains('nav-ico')) return;
          var key = el.getAttribute('data-i18n');
          if (!key) return;
          var tr = SmartRouteI18n.t(key, code);
          if (tr && tr !== key) el.textContent = tr;
        });
      }
      if (window.SmartRoute && SmartRoute.applySidebarLabels) {
        SmartRoute.applySidebarLabels();
      }
    } catch (e) {}
    applying = false;
  }

  function boot() {
    if (getLang() === 'en') return;
    if (!window.SmartRouteI18n) {
      var n = 0;
      var t = setInterval(function () {
        n++;
        if (window.SmartRouteI18n || n > 15) {
          clearInterval(t);
          applyTextOnly(getLang());
        }
      }, 200);
      return;
    }
    applyTextOnly(getLang());
  }

  // NO MutationObserver on sidebar — that was causing left menu to change on clicks
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.addEventListener('smartroute:language-changed', function (e) {
    var code = (e.detail && e.detail.language) || getLang();
    applyTextOnly(code);
  });
})();
