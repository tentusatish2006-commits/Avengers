/* SmartRoute — all app pages require Login or Sign Up first */
(function () {
  var PUBLIC = ['index.html', 'login.html', 'signup.html', ''];

  function pathName() {
    return (window.location.pathname || '').split('/').pop() || '';
  }

  function isLoggedIn() {
    try {
      return localStorage.getItem('sr_logged_in') === '1' || !!localStorage.getItem('sr_username');
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
    alert('Please Login or Sign Up to access the Command Center.');
    window.location.href = 'login.html';
    return false;
  }

  window.requireAuthNav = requireAuthNav;

  // Block protected pages if not logged in
  document.addEventListener('DOMContentLoaded', function () {
    var path = pathName();
    if (PUBLIC.indexOf(path) !== -1) return;
    if (!isLoggedIn()) {
      try { localStorage.setItem('sr_return_to', path); } catch (e) {}
      window.location.replace('login.html');
    }
  });
})();
