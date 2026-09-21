/**
 * SmartRoute Client API Bridge
 * Auto failover to standalone/demo when Flask backend is offline.
 * Avoids repeated connection-refused requests.
 */
(function () {
  'use strict';
  var API_PORT = 5000;
  var host = window.location.hostname;
  var isLocal = host === 'localhost' || host === '127.0.0.1';
  var sameOriginApi = isLocal && String(window.location.port) === String(API_PORT);
  var BASE_URL = sameOriginApi ? '/api' : (isLocal ? 'http://127.0.0.1:' + API_PORT + '/api' : '/api');

  var offlineUntil = 0;
  var OFFLINE_COOLDOWN_MS = 60000;

  function isMarkedOffline() {
    return Date.now() < offlineUntil;
  }
  function markOffline() {
    offlineUntil = Date.now() + OFFLINE_COOLDOWN_MS;
    SmartRouteAPI.isOnline = false;
    SmartRouteAPI.setOnline(false);
  }
  function markOnline() {
    offlineUntil = 0;
    SmartRouteAPI.isOnline = true;
    SmartRouteAPI.setOnline(true);
  }

  var SmartRouteAPI = {
    baseUrl: BASE_URL,
    isOnline: false,

    async request(endpoint, options) {
      options = options || {};
      if (isMarkedOffline() && !options.force) {
        return null;
      }
      var url = this.baseUrl + endpoint;
      var controller = new AbortController();
      var timeoutId = setTimeout(function () { controller.abort(); }, options.timeout || 4000);
      try {
        var response = await fetch(url, {
          method: options.method || 'GET',
          signal: controller.signal,
          headers: Object.assign({ 'Content-Type': 'application/json' }, options.headers || {}),
          body: options.body || undefined
        });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error('HTTP ' + response.status);
        var data = await response.json();
        markOnline();
        return data;
      } catch (err) {
        clearTimeout(timeoutId);
        markOffline();
        return null;
      }
    },

    setOnline: function (status) {
      this.isOnline = !!status;
      var badge = document.getElementById('backend-status-badge');
      if (!badge) return;
      if (status) {
        badge.innerHTML = '<span style="color:#00ff88;">●</span> API CONNECTED';
        badge.title = 'Connected to SmartRoute backend';
      } else {
        badge.innerHTML = '<span style="color:#aaa;">○</span> STANDALONE';
        badge.title = 'Offline mode — demo data (start Flask on :5000 for API)';
      }
    },

    async checkHealth() {
      if (isMarkedOffline()) {
        this.setOnline(false);
        return false;
      }
      var res = await this.request('/health', { timeout: 2500 });
      var ok = !!(res && (res.status === 'healthy' || res.status === 'ok'));
      if (!ok) markOffline();
      return ok;
    },

    async getNotifications(limit) {
      if (isMarkedOffline()) return null;
      return this.request('/notifications?limit=' + (limit || 50), { timeout: 3000 });
    },

    async getUnreadCount() {
      if (isMarkedOffline()) return 0;
      var res = await this.request('/notifications/unread-count', { timeout: 2500 });
      return (res && res.count) || 0;
    },

    async getRouteDirections(start, end, options) {
      options = options || {};
      var body = {
        start: Array.isArray(start) ? { lat: start[0], lng: start[1] } : start,
        end: Array.isArray(end) ? { lat: end[0], lng: end[1] } : end,
        alternatives: !!options.alternatives,
        alternative_count: options.alternative_count || 2,
        profile: options.profile || 'driving-car'
      };
      return this.request('/routing/directions', {
        method: 'POST',
        body: JSON.stringify(body),
        force: true,
        timeout: 15000
      });
    },

    async predictRouteRisk(source, destination, vehicle_type, priority) {
      return this.request('/ai/predict-route', {
        method: 'POST',
        body: JSON.stringify({ source: source, destination: destination, vehicle_type: vehicle_type, priority: priority }),
        force: true
      });
    }
  };

  window.SmartRouteAPI = SmartRouteAPI;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(function () { SmartRouteAPI.checkHealth(); }, 1200);
    });
  } else {
    setTimeout(function () { SmartRouteAPI.checkHealth(); }, 1200);
  }
})();
