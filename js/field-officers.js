/* Shared Field Officers registry — admin adds → visible on Officers, Field Report, Incidents */
(function (global) {
  'use strict';

  var LS_FO = 'sr_field_officers';
  var LS_ADMIN = 'sr_admin_users';

  var DIST_COORDS = {
    'Assam': [26.15, 91.75],
    'Arunachal Pradesh': [27.58, 91.86],
    'Nagaland': [25.67, 94.10],
    'Meghalaya': [25.57, 91.89],
    'Sikkim': [27.33, 88.61],
    'Tripura': [23.83, 91.28],
    'Mizoram': [23.73, 92.71],
    'Manipur': [24.82, 93.94],
    'HQ Guwahati': [26.14, 91.74]
  };

  var DEFAULTS = [
    { id: 'FO-042', name: 'Ravi Kumar', dist: 'Assam', status: 'ACTIVE', sector: 'Guwahati Riverfront', lat: 26.1524, lng: 91.7510, note: 'Guwahati Riverfront' },
    { id: 'FO-015', name: 'Lakshmi Devi', dist: 'Arunachal Pradesh', status: 'ACTIVE', sector: 'NH-13 Tawang Pass', lat: 27.584, lng: 91.862, note: 'NH-13 Tawang Pass' },
    { id: 'FO-028', name: 'Suresh Rao', dist: 'Nagaland', status: 'ACTIVE', sector: 'Kohima Pass', lat: 25.67, lng: 94.10, note: 'Kohima Pass' },
    { id: 'FO-061', name: 'Anand Babu', dist: 'Meghalaya', status: 'ACTIVE', sector: 'Shillong Plateau', lat: 25.57, lng: 91.89, note: 'Shillong Plateau' },
    { id: 'FO-033', name: 'Priya Singh', dist: 'Sikkim', status: 'OFF DUTY', sector: 'Gangtok Depot', lat: 27.33, lng: 88.61, note: 'Gangtok Depot' },
    { id: 'FO-077', name: 'Mohan Rao', dist: 'Tripura', status: 'ACTIVE', sector: 'Agartala Corridor', lat: 23.83, lng: 91.28, note: 'Agartala Corridor' },
    { id: 'FO-089', name: 'Kavitha Reddy', dist: 'Mizoram', status: 'ACTIVE', sector: 'Aizawl High Pass', lat: 23.73, lng: 92.71, note: 'Aizawl High Pass' },
    { id: 'FO-055', name: 'Rajesh Varma', dist: 'Manipur', status: 'ACTIVE', sector: 'Imphal Valley', lat: 24.817, lng: 93.936, note: 'Imphal Valley' }
  ];

  function coordsFor(dist) {
    var c = DIST_COORDS[dist] || DIST_COORDS['Assam'];
    return { lat: c[0], lng: c[1] };
  }

  function initials(name) {
    var p = String(name || 'FO').trim().split(/\s+/);
    if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
    return (p[0] || 'FO').slice(0, 2).toUpperCase();
  }

  function normalize(o) {
    if (!o) return null;
    var dist = o.dist || o.district || 'Assam';
    var xy = coordsFor(dist);
    var status = o.status || o.stat || 'ACTIVE';
    if (status === 'Active') status = 'ACTIVE';
    if (status === 'Inactive') status = 'OFF DUTY';
    return {
      id: o.id || o.foId || ('FO-' + Date.now()),
      name: o.name || 'Officer',
      dist: dist,
      status: String(status).toUpperCase().indexOf('OFF') >= 0 || String(status).toUpperCase() === 'INACTIVE' ? 'OFF DUTY' : 'ACTIVE',
      sector: o.sector || dist,
      note: o.note || o.place || o.sector || dist,
      lat: typeof o.lat === 'number' ? o.lat : xy.lat,
      lng: typeof o.lng === 'number' ? o.lng : xy.lng,
      initials: o.initials || initials(o.name),
      place: o.place || o.note || (dist + ' sector'),
      phone: o.phone || '\u2014'
    };
  }

  function readLS(key) {
    try {
      var raw = localStorage.getItem(key);
      var arr = raw ? JSON.parse(raw) : null;
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function writeLS(list) {
    try { localStorage.setItem(LS_FO, JSON.stringify(list)); } catch (e) {}
  }

  function fromAdminUsers() {
    return readLS(LS_ADMIN)
      .filter(function (u) { return u && (u.role === 'Field Officer' || u.role === 'field officer'); })
      .map(function (u) {
        return normalize({
          id: u.foId || u.id,
          name: u.name,
          dist: u.dist,
          status: u.stat === 'Inactive' ? 'OFF DUTY' : 'ACTIVE',
          sector: u.dist
        });
      });
  }

  function mergeAll() {
    var map = {};
    function add(list) {
      (list || []).forEach(function (raw) {
        var o = normalize(raw);
        if (!o || !o.id) return;
        var key = o.id;
        var nameKey = (o.name || '').toLowerCase();
        if (map[key]) map[key] = Object.assign({}, map[key], o);
        else {
          var existingName = Object.keys(map).find(function (k) {
            return (map[k].name || '').toLowerCase() === nameKey;
          });
          if (existingName) map[existingName] = Object.assign({}, map[existingName], o, { id: map[existingName].id });
          else map[key] = o;
        }
      });
    }
    add(DEFAULTS);
    add(readLS(LS_FO));
    add(fromAdminUsers());
    var out = Object.keys(map).map(function (k) { return map[k]; });
    writeLS(out);
    return out;
  }

  function list() { return mergeAll(); }

  function upsert(officer) {
    var o = normalize(officer);
    if (!o) return null;
    var list = readLS(LS_FO);
    var idx = list.findIndex(function (x) {
      return x.id === o.id || (x.name && o.name && x.name.toLowerCase() === o.name.toLowerCase());
    });
    if (idx >= 0) list[idx] = Object.assign({}, list[idx], o);
    else list.unshift(o);
    writeLS(list);
    return o;
  }

  function remove(idOrName) {
    var key = String(idOrName || '').toLowerCase();
    var list = readLS(LS_FO).filter(function (x) {
      return String(x.id).toLowerCase() !== key && String(x.name || '').toLowerCase() !== key;
    });
    writeLS(list);
  }

  function byId(id) {
    return list().find(function (o) { return o.id === id; }) || null;
  }

  function search(q) {
    q = String(q || '').toLowerCase().trim();
    var all = list();
    if (!q) return all;
    return all.filter(function (o) {
      return o.name.toLowerCase().indexOf(q) >= 0 ||
        o.id.toLowerCase().indexOf(q) >= 0 ||
        (o.dist || '').toLowerCase().indexOf(q) >= 0 ||
        (o.sector || '').toLowerCase().indexOf(q) >= 0;
    });
  }

  global.SmartRouteFO = {
    list: list,
    upsert: upsert,
    remove: remove,
    byId: byId,
    search: search,
    defaults: DEFAULTS,
    refresh: mergeAll
  };
})(window);
