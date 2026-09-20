/* Admin multi-device user + field-officer sync (localStorage + rentry cloud) */
(function () {
  'use strict';

  var CLOUD_URL = 'https://rentry.co/smartroute-ner-users-v1';
  var CLOUD_EDIT = 'https://rentry.co/api/edit/smartroute-ner-users-v1';
  var CLOUD_CODE = 'SmartRouteNER2026';
  var LS_USERS = 'sr_admin_users';
  var LS_AUTH = 'sr_users';
  var LS_FO = 'sr_field_officers';

  function decodeHtml(s) {
    return String(s || '')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
  }

  function parseCloudHtml(html) {
    if (!html) return null;
    var raw = null;
    var m = html.match(/<div><p>(\{[\s\S]*?\})<\/p><\/div>/);
    if (!m) m = html.match(/<p>(\{[\s\S]*?\})<\/p>/);
    if (m) raw = m[1];
    if (!raw) {
      var t = html.match(/<title>([^<]+)<\/title>/);
      if (t) raw = decodeHtml(t[1]);
    }
    if (!raw) {
      var i = html.indexOf('{"users"');
      if (i >= 0) {
        var end = html.indexOf('</p>', i);
        if (end < 0) end = i + 8000;
        raw = html.slice(i, end).replace(/<\/?[^>]+>/g, '');
      }
    }
    if (!raw) return null;
    try {
      var data = JSON.parse(raw.trim());
      if (data && (Array.isArray(data.users) || Array.isArray(data.fieldOfficers))) return data;
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

  function normalizeFO(o) {
    if (!o) return null;
    return {
      id: o.id || ('FO-' + Date.now()),
      name: o.name || 'Officer',
      dist: o.dist || o.district || 'HQ',
      status: o.status || (o.stat === 'Active' ? 'ACTIVE' : 'OFF DUTY'),
      sector: o.sector || o.dist || 'HQ'
    };
  }

  function mergeById(a, b) {
    var map = {};
    (a || []).concat(b || []).forEach(function (u) {
      if (!u || !u.id) return;
      var prev = map[u.id];
      map[u.id] = prev ? Object.assign({}, prev, u) : u;
    });
    return Object.keys(map).map(function (k) { return map[k]; });
  }

  function loadLocalUsers() {
    try {
      var arr = JSON.parse(localStorage.getItem(LS_USERS) || 'null');
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function loadLocalFO() {
    try {
      var arr = JSON.parse(localStorage.getItem(LS_FO) || 'null');
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function saveLocalUsers(users) {
    try { localStorage.setItem(LS_USERS, JSON.stringify(users || [])); } catch (e) {}
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
      localStorage.setItem(LS_AUTH, JSON.stringify(authList));
    } catch (e2) {}
  }

  function saveLocalFO(list) {
    try { localStorage.setItem(LS_FO, JSON.stringify(list || [])); } catch (e) {}
  }

  function pullFromCloud() {
    return fetch(CLOUD_URL + '?_=' + Date.now(), { cache: 'no-store', mode: 'cors' })
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var data = parseCloudHtml(html);
        if (!data) return null;
        return {
          users: (data.users || []).map(normalizeUser).filter(Boolean),
          fieldOfficers: (data.fieldOfficers || []).map(normalizeFO).filter(Boolean)
        };
      })
      .catch(function () { return null; });
  }

  function pushFullToCloud(users, fos) {
    var payload = JSON.stringify({
      users: (users || []).map(function (u) {
        return {
          id: u.id, name: u.name, role: u.role, dist: u.dist,
          stat: u.stat, login: u.login || '\u2014', password: u.password || 'Pass@123',
          foId: u.foId
        };
      }),
      fieldOfficers: (fos || loadLocalFO()).map(function (o) {
        return {
          id: o.id, name: o.name, dist: o.dist,
          status: o.status || 'ACTIVE', sector: o.sector || o.dist
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
    }).then(function (r) { return r.json().catch(function () { return { status: r.status }; }); })
      .catch(function () { return null; });
  }

  function pull() {
    return pullFromCloud().then(function (remote) {
      var localU = loadLocalUsers();
      var localFO = loadLocalFO();
      if (!remote) {
        return { users: localU, fieldOfficers: localFO };
      }
      var users = mergeById(localU, remote.users);
      var fos = mergeById(localFO, remote.fieldOfficers);
      users.forEach(function (u) {
        if (u.role === 'Field Officer') {
          var foId = u.foId || ('FO-' + String(u.id).replace(/\D/g, '') || Date.now());
          u.foId = foId;
          if (!fos.some(function (f) { return f.id === foId || (f.name && f.name.toLowerCase() === u.name.toLowerCase()); })) {
            fos.push(normalizeFO({ id: foId, name: u.name, dist: u.dist, status: u.stat === 'Active' ? 'ACTIVE' : 'OFF DUTY' }));
          }
        }
      });
      saveLocalUsers(users);
      saveLocalFO(fos);
      return { users: users, fieldOfficers: fos };
    });
  }

  function pushAll(users, fos) {
    saveLocalUsers(users || []);
    if (fos) saveLocalFO(fos);
    return pushFullToCloud(users || loadLocalUsers(), fos || loadLocalFO());
  }

  function push(user) {
    var local = loadLocalUsers();
    var merged = mergeById(local, [normalizeUser(user)]);
    saveLocalUsers(merged);
    if (user && user.role === 'Field Officer') {
      var fos = loadLocalFO();
      var foId = user.foId || ('FO-' + Date.now());
      user.foId = foId;
      fos = mergeById(fos, [normalizeFO({ id: foId, name: user.name, dist: user.dist, status: user.stat === 'Active' ? 'ACTIVE' : 'OFF DUTY' })]);
      saveLocalFO(fos);
      return pushFullToCloud(merged, fos);
    }
    return pushFullToCloud(merged, loadLocalFO());
  }

  function remove(id) {
    var local = loadLocalUsers().filter(function (u) { return u.id !== id; });
    saveLocalUsers(local);
    return pushFullToCloud(local, loadLocalFO());
  }

  window.SRAdminSync = {
    pull: pull,
    push: push,
    remove: remove,
    pushAll: pushAll,
    loadLocal: loadLocalUsers,
    saveLocal: saveLocalUsers,
    loadFO: loadLocalFO,
    saveFO: saveLocalFO
  };
})();
