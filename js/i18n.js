/* SmartRoute i18n loader */
(function () {
  "use strict";
  window.__SR_I18N_B64 = window.__SR_I18N_B64 || [];
  var NEED = 4;
  function b64ToUtf8(b64) {
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder("utf-8").decode(bytes);
  }
  window.__SR_I18N_TRY = function () {
    var p = window.__SR_I18N_B64;
    var ready = 0;
    for (var i = 0; i < NEED; i++) if (p[i]) ready++;
    if (ready < NEED || window.__SR_I18N_DONE) return;
    window.__SR_I18N_DONE = true;
    try {
      var code = "";
      for (var j = 0; j < NEED; j++) code += b64ToUtf8(p[j]);
      (0, eval)(code);
      console.log("[SmartRoute i18n] OK", window.SmartRouteI18n && window.SmartRouteI18n.t("nav_dashboard", "te"));
    } catch (e) {
      console.error("[SmartRoute i18n] fail", e);
    }
  };
  function loadPart(i) {
    var s = document.createElement("script");
    s.src = "js/i18n-p" + i + ".js";
    s.async = false;
    s.onload = function () { window.__SR_I18N_TRY(); };
    document.head.appendChild(s);
  }
  for (var i = 0; i < NEED; i++) loadPart(i);
})();
