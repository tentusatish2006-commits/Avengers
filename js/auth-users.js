/* SmartRoute user registry */
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

  /**
   * Create / update a user account in the registry.
   * @param {object} user
   * @param {object} [options]
   * @param {boolean} [options.startSession=true] - if false, do NOT change the current logged-in user (use when Admin adds another person)
   */
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

    // Only touch session when this is a real signup/login flow — never when Admin is adding someone else
    if (shouldStartSession) {
      startSession(record);
    }
    return record;
  }

  /** Admin helper: save account without switching the logged-in profile */
  function createUserWithoutLogin(user) {
    return registerUser(user, { startSession: false });
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
    if (String(match.password) !== pass) return { ok: false, reason: 'bad_password' };
    return { ok: true, user: match };
  }

  function startSession(user) {
    localStorage.setItem('sr_username', user.username || user.officerId || '');
    localStorage.setItem('sr_officer_id', user.officerId || '');
    localStorage.setItem('sr_email', user.email || '');
    localStorage.setItem('sr_user_role', user.role || '');
    localStorage.setItem('sr_department', user.department || '');
    localStorage.setItem('sr_region', user.region || '');
    localStorage.setItem('sr_logged_in', '1');
  }

  function getSessionUser() {
    if (localStorage.getItem('sr_logged_in') !== '1') return null;
    return {
      username: localStorage.getItem('sr_username') || '',
      officerId: localStorage.getItem('sr_officer_id') || '',
      email: localStorage.getItem('sr_email') || '',
      role: localStorage.getItem('sr_user_role') || '',
      department: localStorage.getItem('sr_department') || '',
      region: localStorage.getItem('sr_region') || ''
    };
  }

  global.SmartRouteAuth = {
    registerUser: registerUser,
    createUserWithoutLogin: createUserWithoutLogin,
    validateLogin: validateLogin,
    startSession: startSession,
    getSessionUser: getSessionUser,
    readUsers: readUsers,
    countUsers: function () { return readUsers().length; }
  };
})(window);
