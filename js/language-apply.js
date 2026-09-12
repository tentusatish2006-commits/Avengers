/* Language page: pending select → Apply switches entire site from English */
(function () {
  'use strict';

  var pendingCode = null;

  function $(id) { return document.getElementById(id); }

  function info(code) {
    if (window.SmartRouteI18n && SmartRouteI18n.getLanguageInfo) {
      return SmartRouteI18n.getLanguageInfo(code) || { code: code, name: code, native: code, flag: '🌐', region: '' };
    }
    return { code: code, name: code, native: code, flag: '🌐', region: '' };
  }

  function getApplied() {
    try {
      return localStorage.getItem('sr_language') || 'en';
    } catch (e) {
      return 'en';
    }
  }

  function updateActiveBar(code, isPending) {
    var i = info(code);
    var flag = $('lang-active-flag');
    var title = $('lang-active-title');
    var native = $('lang-active-native');
    if (flag) flag.textContent = i.flag || '🌐';
    if (title) {
      title.textContent = (i.name || code) + (i.native ? ' (' + i.native + ')' : '') +
        (isPending ? ' — select Apply' : '');
    }
    if (native) {
      native.textContent = (i.region || '') + (i.native ? ' • ' + i.native : '') +
        (isPending ? ' (not applied yet)' : ' • ACTIVE');
    }
  }

  function forceApply(code) {
    code = code || 'en';
    try {
      localStorage.setItem('sr_language', code);
    } catch (e) {}

    document.documentElement.lang = code;

    if (window.SmartRouteI18n) {
      SmartRouteI18n._currentLang = code;
      try {
        if (SmartRouteI18n.setLanguage) SmartRouteI18n.setLanguage(code);
      } catch (e1) {}
      try {
        if (SmartRouteI18n.applyLanguage) SmartRouteI18n.applyLanguage(code);
      } catch (e2) {}
      try {
        if (SmartRouteI18n.applyDeep) SmartRouteI18n.applyDeep(code);
      } catch (e3) {}
    }

    // Force sidebar labels from keys (always works regardless of current English text)
    if (window.SmartRoute && SmartRoute.refreshLanguage) {
      SmartRoute.refreshLanguage(code);
    } else {
      document.querySelectorAll('[data-i18n]').forEach(function (el) {
        if (!window.SmartRouteI18n) return;
        var key = el.getAttribute('data-i18n');
        var tr = SmartRouteI18n.t(key, code);
        if (tr && tr !== key) el.textContent = tr;
      });
    }

    // Re-apply twice so late-rendered sidebar is covered
    setTimeout(function () {
      if (window.SmartRouteI18n && SmartRouteI18n.applyDeep) SmartRouteI18n.applyDeep(code);
      if (window.SmartRoute && SmartRoute.refreshLanguage) SmartRoute.refreshLanguage(code);
    }, 150);
    setTimeout(function () {
      if (window.SmartRouteI18n && SmartRouteI18n.applyDeep) SmartRouteI18n.applyDeep(code);
    }, 400);

    updateActiveBar(code, false);

    var dropdown = $('lang-select-dropdown');
    if (dropdown) {
      try { dropdown.value = code; } catch (e) {}
    }
    document.querySelectorAll('input[name="lang_radio"]').forEach(function (r) {
      r.checked = (r.value === code);
    });

    if (window.SmartRoute && SmartRoute.showToast) {
      var i = info(code);
      SmartRoute.showToast('Language changed to ' + i.name + ' (' + i.native + ')', 'success', 3500);
    }
  }

  function selectPending(code) {
    pendingCode = code;
    updateActiveBar(code, true);
    var dropdown = $('lang-select-dropdown');
    if (dropdown) {
      try { dropdown.value = code; } catch (e) {}
    }
  }

  function wire() {
    if (!window.SmartRouteI18n) return false;

    var applied = getApplied();
    pendingCode = applied;
    updateActiveBar(applied, false);

    // Block the page's old auto-apply on select
    window.applySelectedLanguage = function (code) {
      selectPending(code);
    };

    var dropdown = $('lang-select-dropdown');
    if (dropdown) {
      try { dropdown.value = applied; } catch (e) {}
      dropdown.onchange = function () {
        selectPending(dropdown.value);
      };
    }

    var applyBtn = $('btn-lang-apply');
    if (applyBtn) {
      applyBtn.onclick = function (e) {
        if (e) e.preventDefault();
        var code = pendingCode || getApplied();
        if (dropdown && dropdown.value) code = dropdown.value;
        var radio = document.querySelector('input[name="lang_radio"]:checked');
        if (radio && radio.value) code = radio.value;
        forceApply(code);
        return false;
      };
    }

    var resetBtn = $('btn-reset-lang');
    if (resetBtn) {
      resetBtn.onclick = function (e) {
        if (e) e.preventDefault();
        pendingCode = 'en';
        forceApply('en');
        return false;
      };
    }

    document.addEventListener('change', function (e) {
      if (e.target && e.target.name === 'lang_radio') {
        selectPending(e.target.value);
      }
    }, true);

    // Apply stored language on this page load
    forceApply(applied);
    return true;
  }

  function boot() {
    var tries = 0;
    var t = setInterval(function () {
      tries++;
      if (wire() || tries > 80) clearInterval(t);
    }, 80);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
