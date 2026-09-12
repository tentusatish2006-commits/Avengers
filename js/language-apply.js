/* Language page — Apply Telugu/Hindi/etc. site-wide */
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
    try { return localStorage.getItem('sr_language') || 'en'; } catch (e) { return 'en'; }
  }

  function updateActiveBar(code, isPending) {
    var i = info(code);
    var flag = $('lang-active-flag');
    var title = $('lang-active-title');
    var native = $('lang-active-native');
    if (flag) flag.textContent = i.flag || '🌐';
    if (title) {
      title.textContent = (i.name || code) + (i.native ? ' (' + i.native + ')' : '') +
        (isPending ? ' — Apply pending' : '');
    }
    if (native) {
      native.textContent = (i.region || '') + (i.native ? ' • ' + i.native : '') +
        (isPending ? ' (click Apply)' : ' • ACTIVE');
    }
  }

  function forceApply(code) {
    code = (code || 'en').toLowerCase().trim();
    pendingCode = code;

    try { localStorage.setItem('sr_language', code); } catch (e) {}
    document.documentElement.lang = code;

    if (window.SmartRouteI18n) {
      SmartRouteI18n._currentLang = code;
      try {
        if (SmartRouteI18n.setLanguage) SmartRouteI18n.setLanguage(code);
      } catch (e1) {
        try { SmartRouteI18n.applyLanguage(code); } catch (e2) {}
      }
    }

    // Strong force path (Telugu etc.)
    if (window.SmartRouteForceI18n && SmartRouteForceI18n.apply) {
      SmartRouteForceI18n.apply(code);
    }
    if (window.SmartRoute && SmartRoute.refreshLanguage) {
      SmartRoute.refreshLanguage(code);
    }
    if (window.SmartRouteI18n && SmartRouteI18n.applyDeep) {
      SmartRouteI18n.applyDeep(code);
    }

    // Repeat after sidebar paints
    [100, 300, 700, 1200].forEach(function (ms) {
      setTimeout(function () {
        if (window.SmartRouteForceI18n) SmartRouteForceI18n.apply(code);
        if (window.SmartRoute && SmartRoute.refreshLanguage) SmartRoute.refreshLanguage(code);
      }, ms);
    });

    updateActiveBar(code, false);

    var dropdown = $('lang-select-dropdown');
    if (dropdown) {
      try { dropdown.value = code; } catch (e) {}
    }
    document.querySelectorAll('input[name="lang_radio"]').forEach(function (r) {
      r.checked = (r.value === code);
    });

    var i = info(code);
    if (window.SmartRoute && SmartRoute.showToast) {
      SmartRoute.showToast('Language: ' + i.name + ' (' + i.native + ') — saved for all pages', 'success', 4000);
    } else {
      alert('Language applied: ' + i.name + ' (' + i.native + ')');
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

    // Override auto-apply on radio
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
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
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
        forceApply('en');
        return false;
      };
    }

    document.addEventListener('change', function (e) {
      if (e.target && e.target.name === 'lang_radio') {
        selectPending(e.target.value);
      }
    }, true);

    // Apply stored language when opening this page
    if (applied && applied !== 'en') {
      forceApply(applied);
    }
    return true;
  }

  function boot() {
    var tries = 0;
    var t = setInterval(function () {
      tries++;
      if (wire() || tries > 100) clearInterval(t);
    }, 80);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
