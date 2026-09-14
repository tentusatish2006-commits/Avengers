/* SmartRoute — protected pages require login */
(function () {
  var PUBLIC = ['index.html', 'login.html', 'signup.html', ''];

  function pathName() {
    return (window.location.pathname || '').split('/').pop() || '';
  }

  function isLoggedIn() {
    if (window.SmartRouteAuth && SmartRouteAuth.isLoggedIn) return SmartRouteAuth.isLoggedIn();
    try {
      return localStorage.getItem('sr_logged_in') === '1' ||
        !!localStorage.getItem('sr_user') ||
        !!sessionStorage.getItem('sr_user') ||
        !!localStorage.getItem('sr_username');
    } catch (e) {
      return false;
    }
  }

  function requireAuthNav(target) {
    if (isLoggedIn()) {
      window.location.href = target;
      return false;
    }
    try { localStorage.setItem('sr_return_to', target); } catch (e) {}
    window.location.href = 'login.html';
    return false;
  }

  window.requireAuthNav = requireAuthNav;
  window.SmartRouteIsLoggedIn = isLoggedIn;

  document.addEventListener('DOMContentLoaded', function () {
    var path = pathName();
    if (PUBLIC.indexOf(path) !== -1) return;
    if (!isLoggedIn()) {
      try { localStorage.setItem('sr_return_to', path); } catch (e) {}
      window.location.replace('login.html');
    }
  });
})();
