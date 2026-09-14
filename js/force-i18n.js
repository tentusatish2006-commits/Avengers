/* Force language text only — never rebuild left sidebar HTML */
(function () {
  'use strict';

  function getLang() {
    try { return localStorage.getItem('sr_language') || 'en'; } catch (e) { return 'en'; }
  }

  function applyNow(code) {
    code = code || getLang();
    if (!window.SmartRouteI18n) return false;
    try { localStorage.setItem('sr_language', code); } catch (e) {}

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      if (el.classList && el.classList.contains('nav-ico')) return;
      var key = el.getAttribute('data-i18n');
      if (!key) return;
      var tr = SmartRouteI18n.t(key, code);
      if (!tr || tr === key) return;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.setAttribute('placeholder', tr);
      else el.textContent = tr;
    });
    return true;
  }

  function boot() {
    var code = getLang();
    if (code === 'en') return;
    var tries = 0;
    function attempt() {
      tries++;
      if (applyNow(code) || tries > 10) return;
      setTimeout(attempt, 250);
    }
    attempt();
  }

  window.SmartRouteForceI18n = { apply: applyNow, getLang: getLang };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
