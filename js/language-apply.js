/* Language page: dropdown updates Currently Active; Apply switches whole site */
(function () {
  var pendingCode = null;

  function $(id) { return document.getElementById(id); }

  function info(code) {
    if (window.SmartRouteI18n && SmartRouteI18n.getLanguageInfo) {
      return SmartRouteI18n.getLanguageInfo(code) || { code: code, name: code, native: code, flag: '🌐', region: '' };
    }
    return { code: code, name: code, native: code, flag: '🌐', region: '' };
  }

  function updateActiveBar(code) {
    var i = info(code);
    var flag = $('lang-active-flag');
    var title = $('lang-active-title');
    var native = $('lang-active-native');
    if (flag) flag.textContent = i.flag || '🌐';
    if (title) title.textContent = (i.name || code) + (i.native ? ' (' + i.native + ')' : '');
    if (native) native.textContent = (i.region || 'Region') + (i.native ? ' • ' + i.native : '');
  }

  function applySiteWide(code) {
    if (!code) code = 'en';
    try { localStorage.setItem('sr_language', code); } catch (e) {}

    if (window.SmartRouteI18n) {
      if (SmartRouteI18n.setLanguage) SmartRouteI18n.setLanguage(code);
      if (SmartRouteI18n.applyLanguage) SmartRouteI18n.applyLanguage(code);
    }
    document.documentElement.lang = code;

    // Re-apply after short delay (sidebar may inject late)
    setTimeout(function () {
      if (window.SmartRouteI18n && SmartRouteI18n.applyLanguage) {
        SmartRouteI18n.applyLanguage(code);
      }
      if (window.SmartRoute && SmartRoute.loadAndApplyI18n) {
        SmartRoute.loadAndApplyI18n();
      }
    }, 200);

    updateActiveBar(code);

    if (window.SmartRoute && SmartRoute.showToast) {
      var i = info(code);
      SmartRoute.showToast('Language applied: ' + i.name + ' — site will use this on all pages', 'success', 3500);
    }
  }

  function wire() {
    if (!window.SmartRouteI18n) return false;

    pendingCode = SmartRouteI18n.getLanguage ? SmartRouteI18n.getLanguage() : (localStorage.getItem('sr_language') || 'en');
    updateActiveBar(pendingCode);

    var dropdown = $('lang-select-dropdown');
    if (dropdown) {
      // Keep dropdown in sync
      try { dropdown.value = pendingCode; } catch (e) {}

      dropdown.addEventListener('change', function () {
        pendingCode = dropdown.value;
        updateActiveBar(pendingCode);
        // Highlight only — full apply on button
        if (window.SmartRoute && SmartRoute.showToast) {
          var i = info(pendingCode);
          SmartRoute.showToast('Selected: ' + i.name + ' — click Apply Language', 'info', 2200);
        }
      });
    }

    var applyBtn = $('btn-lang-apply');
    if (applyBtn) {
      applyBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var code = pendingCode;
        if (dropdown && dropdown.value) code = dropdown.value;
        // Also check selected radio
        var radio = document.querySelector('input[name="lang_radio"]:checked');
        if (radio && radio.value) code = radio.value;
        pendingCode = code;
        applySiteWide(code);
      });
    }

    // When radio changes, update Currently Active bar
    document.addEventListener('change', function (e) {
      if (e.target && e.target.name === 'lang_radio') {
        pendingCode = e.target.value;
        updateActiveBar(pendingCode);
        if (dropdown) dropdown.value = pendingCode;
      }
    });

    return true;
  }

  function boot() {
    var tries = 0;
    var t = setInterval(function () {
      tries++;
      if (wire() || tries > 50) clearInterval(t);
    }, 100);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
