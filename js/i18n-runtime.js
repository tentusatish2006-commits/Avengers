/**
 * SmartRoute language runtime — lightweight apply + rare refresh
 */
(function () {
  'use strict';

  var applying = false;
  var scheduled = null;

  function getLang() {
    try { return localStorage.getItem('sr_language') || 'en'; } catch (e) { return 'en'; }
  }

  function applyAll(code) {
    if (applying) return;
    applying = true;
    code = code || getLang();
    try {
      if (window.SmartRouteForceI18n && SmartRouteForceI18n.apply) {
        SmartRouteForceI18n.apply(code);
      } else if (window.SmartRouteI18n && SmartRouteI18n.apply) {
        SmartRouteI18n.apply(code);
      } else if (window.SmartRouteI18n) {
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
          var key = el.getAttribute('data-i18n');
          var tr = SmartRouteI18n.t(key, code);
          if (tr && tr !== key) el.textContent = tr;
        });
      }
    } catch (e) {}
    applying = false;
  }

  function scheduleApply() {
    if (scheduled) return;
    scheduled = setTimeout(function () {
      scheduled = null;
      applyAll(getLang());
    }, 80);
  }

  function watchDom() {
    if (!window.MutationObserver) return;
    var obs = new MutationObserver(function () {
      if (getLang() === 'en') return;
      scheduleApply();
    });
    try {
      obs.observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
    // Stop aggressive observing after page settles
    setTimeout(function () {
      try { obs.disconnect(); } catch (e) {}
    }, 8000);
  }

  function boot() {
    if (!window.SmartRouteI18n) {
      var tries = 0;
      var timer = setInterval(function () {
        tries++;
        if (window.SmartRouteI18n || tries > 20) {
          clearInterval(timer);
          scheduleApply();
          if (getLang() !== 'en') watchDom();
        }
      }, 150);
      return;
    }
    scheduleApply();
    if (getLang() !== 'en') watchDom();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.addEventListener('smartroute:language-changed', function (e) {
    var code = (e.detail && e.detail.language) || getLang();
    applyAll(code);
  });
})();
