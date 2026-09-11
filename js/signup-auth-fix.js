/* Ensure Sign Up marks user as logged in so all pages unlock */
(function () {
  function markLoggedIn() {
    try {
      if (localStorage.getItem('sr_username')) {
        localStorage.setItem('sr_logged_in', '1');
      }
    } catch (e) {}
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof window.doSignup === 'function') {
      var original = window.doSignup;
      window.doSignup = function () {
        var r = original.apply(this, arguments);
        markLoggedIn();
        return r;
      };
    }
    var form = document.getElementById('signup-form');
    if (form) {
      form.addEventListener('submit', function () {
        setTimeout(markLoggedIn, 50);
        setTimeout(markLoggedIn, 500);
      });
    }
    var btn = document.querySelector('.btn-signup');
    if (btn) {
      btn.addEventListener('click', function () {
        setTimeout(markLoggedIn, 50);
        setTimeout(markLoggedIn, 500);
      });
    }
  });
})();
