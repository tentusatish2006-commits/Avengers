/* SmartRoute i18n loader */
(function () {
  "use strict";
  function loadScript(src, cb) {
    if (document.querySelector('script[src="' + src + '"]')) {
      if (cb) cb();
      return;
    }
    var s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.onload = function () { if (cb) cb(); };
    s.onerror = function () { console.warn('[i18n] failed', src); if (cb) cb(); };
    document.head.appendChild(s);
  }
  // Load dictionary first, then enhance + force layers
  loadScript('js/i18n-dict.js', function () {
    loadScript('js/i18n-enhance.js', function () {
      loadScript('js/force-i18n.js', function () {
        loadScript('js/i18n-runtime.js', function () {
          var code = 'en';
          try { code = localStorage.getItem('sr_language') || 'en'; } catch (e) {}
          if (window.SmartRouteI18n) {
            SmartRouteI18n._currentLang = code;
            if (typeof SmartRouteI18n.applyLanguage === 'function') SmartRouteI18n.applyLanguage(code);
          }
          if (window.SmartRouteForceI18n && SmartRouteForceI18n.apply) {
            try { SmartRouteForceI18n.apply(code); } catch (e) {}
          }
          console.log('[SmartRoute i18n] stack ready', code);
        });
      });
    });
  });
})();
