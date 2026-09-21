(function (w) {
  'use strict';
  var API_BASE = (w.SmartRouteAPI && SmartRouteAPI.baseUrl) ||
    ((w.location.hostname === 'localhost' || w.location.hostname === '127.0.0.1') ? 'http://127.0.0.1:5000/api' : '/api');
  var state = { configured: false, permission: (typeof Notification !== 'undefined' && Notification.permission) || 'default', token: null, error: null };
  function toast(msg, type) {
    if (w.SmartRoute && SmartRoute.showToast) SmartRoute.showToast(msg, type || 'info');
    else console.log('[FCM]', msg);
  }
  async function fetchConfig() {
    try {
      var res = await fetch(API_BASE + '/notifications/config');
      var json = await res.json();
      if (!json.configured) { state.error = 'Firebase web config missing on server'; return null; }
      return json.config;
    } catch (e) {
      state.error = 'Cannot reach backend /notifications/config — is Flask running?';
      return null;
    }
  }
  function loadFirebaseScripts() {
    return new Promise(function (resolve, reject) {
      if (w.firebase && w.firebase.messaging) return resolve();
      var urls = [
        'https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js',
        'https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js'
      ];
      var i = 0;
      function next() {
        if (i >= urls.length) return resolve();
        var s = document.createElement('script');
        s.src = urls[i++];
        s.onload = next;
        s.onerror = function () { reject(new Error('Failed to load Firebase SDK')); };
        document.head.appendChild(s);
      }
      next();
    });
  }
  async function registerServiceWorker(config) {
    if (!('serviceWorker' in navigator)) throw new Error('Service workers not supported');
    var reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
    if (reg.active) reg.active.postMessage({ type: 'SR_FIREBASE_CONFIG', config: config });
    navigator.serviceWorker.ready.then(function (r) {
      if (r.active) r.active.postMessage({ type: 'SR_FIREBASE_CONFIG', config: config });
    });
    return reg;
  }
  async function registerTokenWithBackend(token) {
    var userId = localStorage.getItem('sr_user_email') || localStorage.getItem('sr_user_id') || 'anonymous';
    var role = localStorage.getItem('sr_user_role') || '';
    try {
      await fetch(API_BASE + '/notifications/register-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token, user_id: userId, role: role })
      });
    } catch (e) { console.warn('[FCM] token register failed', e); }
  }
  async function enablePush() {
    state.error = null;
    if (typeof Notification === 'undefined') {
      state.error = 'Notifications not supported'; toast(state.error, 'warn'); return state;
    }
    var config = await fetchConfig();
    if (!config) { toast(state.error || 'Firebase not configured', 'warn'); return state; }
    try {
      await loadFirebaseScripts();
      if (!w.firebase.apps.length) w.firebase.initializeApp(config);
      var reg = await registerServiceWorker(config);
      var permission = await Notification.requestPermission();
      state.permission = permission;
      if (permission !== 'granted') {
        state.error = 'Notification permission denied'; toast(state.error, 'warn'); return state;
      }
      var messaging = w.firebase.messaging();
      var token = await messaging.getToken({ vapidKey: config.vapidKey, serviceWorkerRegistration: reg });
      if (!token) {
        state.error = 'Could not get FCM token (check VAPID key)'; toast(state.error, 'warn'); return state;
      }
      state.token = token; state.configured = true;
      localStorage.setItem('sr_fcm_token', token);
      await registerTokenWithBackend(token);
      messaging.onMessage(function (payload) {
        var title = (payload.notification && payload.notification.title) || 'SmartRoute Alert';
        var body = (payload.notification && payload.notification.body) || (payload.data && payload.data.message) || '';
        toast(title + ': ' + body, 'info');
        if (typeof w.refreshSmartRouteAlerts === 'function') w.refreshSmartRouteAlerts();
        if (typeof w.updateAlertBadge === 'function') w.updateAlertBadge();
      });
      toast('Push notifications enabled', 'success');
      return state;
    } catch (e) {
      state.error = e.message || String(e);
      toast('FCM error: ' + state.error, 'warn');
      return state;
    }
  }
  async function refreshUnreadBadge() {
    try {
      var res = await fetch(API_BASE + '/notifications/unread-count');
      var json = await res.json();
      var n = (json && json.count) || 0;
      var btn = document.getElementById('sr-alerts-btn');
      if (!btn) return;
      var badge = document.getElementById('sr-alert-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.id = 'sr-alert-badge';
        badge.style.cssText = 'position:absolute;top:2px;right:2px;min-width:16px;height:16px;border-radius:8px;background:#ff3b3b;color:#fff;font-size:10px;font-weight:800;display:none;align-items:center;justify-content:center;padding:0 4px;';
        btn.style.position = 'relative';
        btn.appendChild(badge);
      }
      if (n > 0) { badge.style.display = 'inline-flex'; badge.textContent = n > 99 ? '99+' : String(n); }
      else badge.style.display = 'none';
    } catch (e) {}
  }
  w.SmartRouteFCM = { enable: enablePush, state: state, refreshBadge: refreshUnreadBadge };
  w.updateAlertBadge = refreshUnreadBadge;
  document.addEventListener('DOMContentLoaded', function () { setTimeout(refreshUnreadBadge, 800); });
})(window);
