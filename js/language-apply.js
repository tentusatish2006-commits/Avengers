/* Language page UX: pending selection vs Apply (site-wide) */
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
      return localStorage.getItem('sr_language') ||
        (window.SmartRouteI18n && SmartRouteI18n.getLanguage && SmartRouteI18n.getLanguage()) ||
        'en';
    } catch (e) { return 'en'; }
  }

  function updateActiveBar(code, isPending) {
    var i = info(code);
    var flag = $('lang-active-flag');
    var title = $('lang-active-title');
    var native = $('lang-active-native');
    if (flag) flag.textContent = i.flag || '🌐';
    if (title) {
      title.textContent = (i.name || code) + (i.native ? ' (' + i.native + ')' : '') +
        (isPending ? ' — pending' : '');
    }
    if (native) {
      native.textContent = (i.region || '') + (i.native ? ' • ' + i.native : '') +
        (isPending ? ' (click Apply to confirm)' : ' • Active');
    }
  }

  function applySiteWide(code) {
    if (!code) code = 'en';
    pendingCode = code;
    try { localStorage.setItem('sr_language', code); } catch (e) {}

    if (window.SmartRouteI18n) {
      if (SmartRouteI18n.setLanguage) {
        // setLanguage may already call applyLanguage
        SmartRouteI18n._currentLang = code;
        try { localStorage.setItem('sr_language', code); } catch (e2) {}
      }
      if (SmartRouteI18n.applyLanguage) SmartRouteI18n.applyLanguage(code);
      if (SmartRouteI18n.applyDeep) SmartRouteI18n.applyDeep(code);
    }

    document.documentElement.lang = code;
    updateActiveBar(code, false);

    // Sync dropdown + radios to applied
    var dropdown = $('lang-select-dropdown');
    if (dropdown) {
      try { dropdown.value = code; } catch (e) {}
    }
    document.querySelectorAll('input[name="lang_radio"]').forEach(function (r) {
      r.checked = (r.value === code);
    });

    if (window.SmartRoute && SmartRoute.showToast) {
      var i = info(code);
      SmartRoute.showToast('Language applied: ' + i.name + ' (' + i.native + ') — active on all pages', 'success', 3500);
    }
  }

  function selectPending(code) {
    pendingCode = code;
    updateActiveBar(code, true);
    var dropdown = $('lang-select-dropdown');
    if (dropdown && dropdown.value !== code) {
      try { dropdown.value = code; } catch (e) {}
    }
  }

  function wire() {
    if (!window.SmartRouteI18n) return false;

    var applied = getApplied();
    pendingCode = applied;
    updateActiveBar(applied, false);

    var dropdown = $('lang-select-dropdown');
    if (dropdown) {
      try { dropdown.value = applied; } catch (e) {}
      // Replace handlers: select = pending only
      dropdown.addEventListener('change', function (e) {
        e.stopImmediatePropagation();
        selectPending(dropdown.value);
      }, true);
    }

    // Override page function so radios don't auto-apply site-wide
    window.applySelectedLanguage = function (code) {
      selectPending(code);
    };

    var applyBtn = $('btn-lang-apply');
    if (applyBtn) {
      applyBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        var code = pendingCode || getApplied();
        if (dropdown && dropdown.value) code = dropdown.value;
        var radio = document.querySelector('input[name="lang_radio"]:checked');
        if (radio && radio.value) code = radio.value;
        applySiteWide(code);
      }, true);
    }

    var resetBtn = $('btn-reset-lang');
    if (resetBtn) {
      resetBtn.addEventListener('click', function (e) {
        e.preventDefault();
        applySiteWide('en');
      }, true);
    }

    // Radio: pending only
    document.addEventListener('change', function (e) {
      if (e.target && e.target.name === 'lang_radio') {
        selectPending(e.target.value);
      }
    }, true);

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
