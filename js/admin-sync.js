/* Admin multi-device user sync via backend API */
(function () {
  function apiBase() {
    try { if (window.SmartRouteAPI && SmartRouteAPI.baseUrl) return SmartRouteAPI.baseUrl; } catch (e) {}
    var o = (typeof location !== 'undefined' && location.origin) ? location.origin : '';
    if (o && o.indexOf('http') === 0 && o.indexOf('localhost') < 0 && o.indexOf('127.0.0.1') < 0) return o + '/api';
    return 'http://127.0.0.1:5000/api';
  }
  window.SRAdminSync = {
    pull: function () {
      return fetch(apiBase() + '/users', { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (json) {
          if (!json || !Array.isArray(json.data) || !json.data.length) return null;
          var mapped = json.data.map(function (r) {
            return {
              id: r.id || r.code,
              name: r.name,
              role: r.role || 'Field Officer',
              dist: r.dist || r.district || 'HQ',
              stat: r.stat || r.status || 'Active',
              login: r.login || r.last_login || '\u2014',
              password: r.password || 'changeme'
            };
          });
          try { localStorage.setItem('sr_admin_users', JSON.stringify(mapped)); } catch (e) {}
          return mapped;
        }).catch(function () { return null; });
    },
    push: function (user) {
      return fetch(apiBase() + '/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: user.id, id: user.id, name: user.name, username: user.name,
          password: user.password || 'Pass@123', role: user.role,
          district: user.dist, status: user.stat, login: user.login
        })
      }).catch(function () {});
    },
    remove: function (id) {
      return fetch(apiBase() + '/users/' + encodeURIComponent(id), { method: 'DELETE' }).catch(function () {});
    }
  };
})();
