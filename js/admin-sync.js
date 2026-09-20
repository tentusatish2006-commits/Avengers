/* Admin multi-device user sync — localStorage + cloud (rentry) + optional backend */
(function () {
  'use strict';

  var CLOUD_URL = 'https://rentry.co/smartroute-ner-users-v1';
  var CLOUD_EDIT = 'https://rentry.co/api/edit/smartroute-ner-users-v1';
  var CLOUD_CODE = 'SmartRouteNER2026';
  var LS_KEY = 'sr_admin_users';
  var AUTH_KEY = 'sr_users';

  function apiBase() {
    try { if (window.SmartRouteAPI && SmartRouteAPI.baseUrl) return SmartRouteAPI.baseUrl; } catch (e) {}
    var o = (typeof location !== 'undefined' && location.origin) ? location.origin : '';
    if (o && o.indexOf('http') === 0 && o.indexOf('localhost') < 0 && o.indexOf('127.0.0.1') < 0) {
      return o + '/api';
    }
    return 'http://127.0.0.1:5000/api';
  }

  function decodeHtml(s) {
    return String(s || '')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
  }

  function parseCloudHtml(html) {
    var m = html.match(/<div><p>(\{[\s\S]*?\})<\/p><\/div>/);
    if (!m) m = html.match(/<p>(\{"users"[\s\S]*?\})<\/p>/);
    if (!m) {
      var t = html.match(/<title>([^<]+)<\/title>/);
      if (t) m = [null, decodeHtml(t[1])];
    }
    if (!m || !m[1]) return null;
    try {
      var data = JSON.parse(m[1].trim());
      if (data && Array.isArray(data.users)) return data.users;
    } catch (e) {}
    return null;
  }

  function normalizeUser(u) {
    if (!u) return null;
    return {
      id: u.id || u.code || ('USR-' + Date.now()),
      name: u.name || u.username || 'User',
      role: u.role || 'Field Officer',
      dist: u.dist || u.district || 'HQ',
      stat: u.stat || u.status || 'Active',
      login: u.login || u.last_login || '\u2014',
      password: u.password || 'Pass@123',
      foId: u.foId || undefined
    };
  }

  function mergeUsers(a, b) {
    var map = {};
    (a || []).concat(b || []).forEach(function (u) {
      var n = normalizeUser(u);
      if (!n || !n.id) return;
      var prev = map[n.id];
      if (!prev) map[n.id] = n;
      else map[n.id] = Object.assign({}, prev, n);
    });
    return Object.keys(map).map(function (k) { return map[k]; });
  }

  function saveLocal(users) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(users)); } catch (e) {}
    try {
      var authList = (users || []).map(function (u) {
        return {
          username: u.name,
          password: u.password || 'Pass@123',
          role: u.role,
          district: u.dist,
          id: u.id,
          createdAt: Date.now()
        };
      });
      localStorage.setItem(AUTH_KEY, JSON.stringify(authList));
    } catch (e2) {}
  }

  function loadLocal() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      var arr = raw ? JSON.parse(raw) : null;
      return Array.isArray(arr) ? arr : null;
    } catch (e) { return null; }
  }

  function pullFromBackend() {
    return fetch(apiBase() + '/users', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (json) {
        if (!json || !Array.isArray(json.data) || !json.data.length) return null;
        return json.data.map(normalizeUser).filter(Boolean);
      })
      .catch(function () { return null; });
  }

  function pullFromCloud() {
    return fetch(CLOUD_URL + '?_=' + Date.now(), { cache: 'no-store', mode: 'cors' })
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var users = parseCloudHtml(html);
        return users ? users.map(normalizeUser).filter(Boolean) : null;
      })
      .catch(function () { return null; });
  }

  function pushToBackend(user) {
    return fetch(apiBase() + '/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: user.id, id: user.id, name: user.name, username: user.name,
        password: user.password || 'Pass@123', role: user.role,
        district: user.dist, status: user.stat, login: user.login
      })
    }).catch(function () {});
  }

  function pushFullListToCloud(users) {
    var payload = JSON.stringify({
      users: (users || []).map(function (u) {
        return {
          id: u.id, name: u.name, role: u.role, dist: u.dist,
          stat: u.stat, login: u.login || '\u2014', password: u.password || 'Pass@123',
          foId: u.foId
        };
      }),
      updatedAt: Date.now()
    });
    var body = 'edit_code=' + encodeURIComponent(CLOUD_CODE) + '&text=' + encodeURIComponent(payload);
    return fetch(CLOUD_EDIT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body,
      mode: 'cors'
    }).then(function (r) { return r.json().catch(function () { return {}; }); })
      .catch(function () { return null; });
  }

  function pushToCloud(user) {
    var local = loadLocal() || [];
    var merged = mergeUsers(local, [user]);
    saveLocal(merged);
    return pushFullListToCloud(merged);
  }

  function removeFromCloud(id) {
    var local = (loadLocal() || []).filter(function (u) { return u.id !== id; });
    saveLocal(local);
    return pushFullListToCloud(local);
  }

  function pull() {
    return Promise.all([pullFromCloud(), pullFromBackend()]).then(function (results) {
      var cloud = results[0];
      var backend = results[1];
      var local = loadLocal();
      var merged = mergeUsers(mergeUsers(local || [], cloud || []), backend || []);
      if (merged.length) {
        saveLocal(merged);
        return merged;
      }
      return local;
    });
  }

  function push(user) {
    pushToBackend(user);
    return pushToCloud(user);
  }

  function remove(id) {
    fetch(apiBase() + '/users/' + encodeURIComponent(id), { method: 'DELETE' }).catch(function () {});
    return removeFromCloud(id);
  }

  function pushAll(users) {
    saveLocal(users || []);
    return pushFullListToCloud(users || []);
  }

  window.SRAdminSync = {
    pull: pull,
    push: push,
    remove: remove,
    pushAll: pushAll,
    loadLocal: loadLocal,
    saveLocal: saveLocal
  };
})();
