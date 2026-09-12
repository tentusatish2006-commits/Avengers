/* SmartRoute user registry — signup accounts required for login */
(function (global) {
  var KEY = 'sr_users';

  function readUsers() {
    try {
      var raw = localStorage.getItem(KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function writeUsers(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
  }

  function normalizeId(id) {
    return String(id || '').trim().toLowerCase();
  }

  function registerUser(user) {
    var users = readUsers();
    var id = normalizeId(user.username || user.officerId || user.email);
    if (!id || !user.password) throw new Error('Username and password required');
    var existing = users.findIndex(function (u) {
      return normalizeId(u.username) === id ||
        normalizeId(u.officerId) === id ||
        normalizeId(u.email) === id;
    });
    var record = {
      username: (user.username || '').trim(),
      officerId: (user.officerId || '').trim(),
      email: (user.email || '').trim(),
      password: String(user.password),
      role: user.role || 'FIELD OFFICER',
      department: user.department || '',
      region: user.region || ''
    };
    if (existing >= 0) users[existing] = record;
    else users.push(record);
    writeUsers(users);
    // active session fields
    localStorage.setItem('sr_username', record.username || record.officerId);
    localStorage.setItem('sr_officer_id', record.officerId);
    localStorage.setItem('sr_email', record.email);
    localStorage.setItem('sr_user_role', record.role);
    localStorage.setItem('sr_department', record.department);
    localStorage.setItem('sr_region', record.region);
    localStorage.setItem('sr_logged_in', '1');
    return record;
  }

  function validateLogin(identifier, password) {
    var id = normalizeId(identifier);
    var pass = String(password || '');
    var users = readUsers();
    if (!users.length) {
      return { ok: false, reason: 'no_users' };
    }
    var match = users.find(function (u) {
      return normalizeId(u.username) === id ||
        normalizeId(u.officerId) === id ||
        normalizeId(u.email) === id;
    });
    if (!match) return { ok: false, reason: 'not_found' };
    if (match.password !== pass) return { ok: false, reason: 'bad_password' };
    return { ok: true, user: match };
  }

  function startSession(user) {
    localStorage.setItem('sr_username', user.username || user.officerId);
    localStorage.setItem('sr_officer_id', user.officerId || '');
    localStorage.setItem('sr_email', user.email || '');
    localStorage.setItem('sr_user_role', user.role || '');
    localStorage.setItem('sr_department', user.department || '');
    localStorage.setItem('sr_region', user.region || '');
    localStorage.setItem('sr_logged_in', '1');
  }

  function countUsers() {
    return readUsers().length;
  }

  global.SmartRouteAuth = {
    registerUser: registerUser,
    validateLogin: validateLogin,
    startSession: startSession,
    readUsers: readUsers,
    countUsers: countUsers
  };
})(window);
