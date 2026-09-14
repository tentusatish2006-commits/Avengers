/* SmartRoute user registry + session */
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

  function startSession(user) {
    user = user || {};
    var username = user.username || user.officerId || user.email || '';
    var payload = {
      username: username,
      officerId: user.officerId || '',
      email: user.email || '',
      role: user.role || '',
      department: user.department || '',
      region: user.region || ''
    };
    try {
      localStorage.setItem('sr_username', payload.username);
      localStorage.setItem('sr_officer_id', payload.officerId);
      localStorage.setItem('sr_email', payload.email);
      localStorage.setItem('sr_user_role', payload.role);
      localStorage.setItem('sr_department', payload.department);
      localStorage.setItem('sr_region', payload.region);
      localStorage.setItem('sr_logged_in', '1');
      localStorage.setItem('sr_user', JSON.stringify(payload));
      sessionStorage.setItem('sr_user', JSON.stringify(payload));
      sessionStorage.setItem('sr_logged_in', '1');
    } catch (e) {}
  }

  function clearSession() {
    try {
      ['sr_username', 'sr_officer_id', 'sr_email', 'sr_user_role', 'sr_department', 'sr_region', 'sr_logged_in', 'sr_user'].forEach(function (k) {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });
    } catch (e) {}
  }

  function registerUser(user, options) {
    options = options || {};
    var shouldStartSession = options.startSession !== false;

    var users = readUsers();
    var username = (user.username || '').trim();
    var officerId = (user.officerId || '').trim();
    var email = (user.email || '').trim();
    var password = String(user.password || '');
    if (!password) throw new Error('Password required');
    if (!username && !officerId && !email) throw new Error('Name, badge ID, or email required');

    var ids = [username, officerId, email].map(normalizeId).filter(Boolean);
    var existing = users.findIndex(function (u) {
      var uids = [u.username, u.officerId, u.email].map(normalizeId);
      return ids.some(function (id) { return uids.indexOf(id) !== -1; });
    });

    var record = {
      username: username || officerId || email,
      officerId: officerId,
      email: email,
      password: password,
      role: user.role || 'FIELD OFFICER',
      department: user.department || '',
      region: user.region || ''
    };

    if (existing >= 0) users[existing] = record;
    else users.push(record);
    writeUsers(users);

    if (shouldStartSession) startSession(record);
    return record;
  }

  function updateUserProfile(updates) {
    updates = updates || {};
    var session = getSessionUser();
    if (!session) throw new Error('Not logged in');

    var users = readUsers();
    var matchIndex = users.findIndex(function (u) {
      return normalizeId(u.username) === normalizeId(session.username) ||
        normalizeId(u.officerId) === normalizeId(session.officerId) ||
        normalizeId(u.email) === normalizeId(session.email);
    });

    var next = {
      username: (updates.username != null ? String(updates.username).trim() : session.username) || session.username,
      officerId: (updates.officerId != null ? String(updates.officerId).trim() : session.officerId) || session.officerId,
      email: (updates.email != null ? String(updates.email).trim() : session.email) || session.email,
      role: (updates.role != null ? String(updates.role).trim() : session.role) || session.role,
      department: (updates.department != null ? String(updates.department).trim() : session.department) || session.department,
      region: (updates.region != null ? String(updates.region).trim() : session.region) || session.region,
      password: matchIndex >= 0 ? users[matchIndex].password : ''
    };

    if (updates.password) next.password = String(updates.password);

    if (matchIndex >= 0) users[matchIndex] = next;
    else users.push(next);
    writeUsers(users);
    startSession(next);
    return next;
  }

  function createUserWithoutLogin(user) {
    return registerUser(user, { startSession: false });
  }

  function validateLogin(identifier, password) {
    var id = normalizeId(identifier);
    var pass = String(password || '');
    var users = readUsers();

    if (!users.length) return { ok: false, reason: 'no_users' };

    var match = users.find(function (u) {
      return normalizeId(u.username) === id ||
        normalizeId(u.officerId) === id ||
        normalizeId(u.email) === id;
    });

    if (!match) return { ok: false, reason: 'not_found' };
    if (String(match.password) !== pass) return { ok: false, reason: 'bad_password' };
    return { ok: true, user: match };
  }

  function getSessionUser() {
    try {
      if (localStorage.getItem('sr_logged_in') === '1' || localStorage.getItem('sr_user')) {
        var raw = localStorage.getItem('sr_user');
        if (raw) return JSON.parse(raw);
        return {
          username: localStorage.getItem('sr_username') || '',
          officerId: localStorage.getItem('sr_officer_id') || '',
          email: localStorage.getItem('sr_email') || '',
          role: localStorage.getItem('sr_user_role') || '',
          department: localStorage.getItem('sr_department') || '',
          region: localStorage.getItem('sr_region') || ''
        };
      }
    } catch (e) {}
    return null;
  }

  function isLoggedInFn() {
    try {
      return localStorage.getItem('sr_logged_in') === '1' ||
        !!localStorage.getItem('sr_user') ||
        !!sessionStorage.getItem('sr_user') ||
        !!localStorage.getItem('sr_username');
    } catch (e) {
      return false;
    }
  }

  global.SmartRouteAuth = {
    registerUser: registerUser,
    createUserWithoutLogin: createUserWithoutLogin,
    validateLogin: validateLogin,
    startSession: startSession,
    clearSession: clearSession,
    getSessionUser: getSessionUser,
    updateUserProfile: updateUserProfile,
    isLoggedIn: isLoggedInFn,
    readUsers: readUsers,
    countUsers: function () { return readUsers().length; }
  };
})(window);
