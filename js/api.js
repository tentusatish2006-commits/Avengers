/**
 * SmartRoute API — OFFLINE-FIRST / STANDALONE
 * Never blocks the UI on Flask. Demo data always available.
 * Set localStorage sr_force_api=1 to retry backend.
 */
(function () {
  'use strict';
  var API_PORT = 5000;
  var host = window.location.hostname;
  var isLocal = host === 'localhost' || host === '127.0.0.1';
  var sameOrigin = isLocal && String(window.location.port) === String(API_PORT);
  var BASE_URL = sameOrigin ? '/api' : (isLocal ? 'http://127.0.0.1:' + API_PORT + '/api' : '/api');

  var offlineUntil = 0;
  var COOLDOWN = 120000;
  var forceApi = false;
  try { forceApi = localStorage.getItem('sr_force_api') === '1'; } catch (e) {}

  function isOffline() {
    if (forceApi) return false;
    return Date.now() < offlineUntil;
  }
  function markOffline() {
    offlineUntil = Date.now() + COOLDOWN;
    SmartRouteAPI.isOnline = false;
    SmartRouteAPI.setOnline(false);
  }
  function markOnline() {
    offlineUntil = 0;
    SmartRouteAPI.isOnline = true;
    SmartRouteAPI.setOnline(true);
  }

  var DEMO = {
    notifications: {
      data: [
        { id: 1, title: 'Landslide risk', message: 'NH-6 Shillong stretch elevated risk', created_at: '08:32', notification_type: 'Shillong', severity: 'HIGH' },
        { id: 2, title: 'Flood watch', message: 'Brahmaputra lowlands — Guwahati', created_at: '12:15', notification_type: 'Guwahati', severity: 'CRITICAL' },
        { id: 3, title: 'Heavy fog', message: 'Tawang visibility under 50m', created_at: '09:10', notification_type: 'Tawang', severity: 'MEDIUM' }
      ]
    },
    unread: { count: 3 }
  };

  var SmartRouteAPI = {
    baseUrl: BASE_URL,
    isOnline: false,
    mode: 'standalone',

    async request(endpoint, options) {
      options = options || {};
      if (isOffline() && !options.force) return null;
      var url = this.baseUrl + endpoint;
      var controller = new AbortController();
      var timeoutId = setTimeout(function () { controller.abort(); }, options.timeout || 2500);
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
        this.mode = 'api';
        return data;
      } catch (err) {
        clearTimeout(timeoutId);
        markOffline();
        this.mode = 'standalone';
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
        badge.innerHTML = '<span style="color:#00d4ff;">○</span> STANDALONE';
        badge.title = 'Running without backend (no time limit). Optional: start Flask on :5000';
      }
    },

    async checkHealth() {
      if (isOffline()) {
        this.setOnline(false);
        return false;
      }
      var res = await this.request('/health', { timeout: 1500 });
      var ok = !!(res && (res.status === 'healthy' || res.status === 'ok'));
      if (!ok) markOffline();
      return ok;
    },

    async getNotifications(limit) {
      var res = await this.request('/notifications?limit=' + (limit || 50), { timeout: 2000 });
      return res || DEMO.notifications;
    },

    async getUnreadCount() {
      var res = await this.request('/notifications/unread-count', { timeout: 1500 });
      if (res && typeof res.count === 'number') return res.count;
      return DEMO.unread.count;
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
        timeout: 8000
      });
    },

    async predictRouteRisk(source, destination, vehicle_type, priority) {
      return this.request('/ai/predict-route', {
        method: 'POST',
        body: JSON.stringify({ source: source, destination: destination, vehicle_type: vehicle_type, priority: priority }),
        force: true,
        timeout: 5000
      });
    },

    enableBackend: function () {
      try { localStorage.setItem('sr_force_api', '1'); } catch (e) {}
      forceApi = true;
      offlineUntil = 0;
      return this.checkHealth();
    },

    disableBackend: function () {
      try { localStorage.setItem('sr_force_api', '0'); } catch (e) {}
      forceApi = false;
      markOffline();
    }
  };

  window.SmartRouteAPI = SmartRouteAPI;

  function boot() {
    setTimeout(function () { SmartRouteAPI.checkHealth(); }, 800);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
