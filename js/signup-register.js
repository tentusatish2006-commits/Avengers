/* Hook signup form to SmartRouteAuth.registerUser */
(function () {
  function enhance() {
    if (typeof window.doSignup !== 'function') return false;
    var original = window.doSignup;
    window.doSignup = function () {
      var pass = (document.getElementById('password') || {}).value || '';
      var confirmPass = (document.getElementById('confirm-password') || {}).value || '';
      if (pass !== confirmPass) {
        alert('Passcodes do not match. Please verify your passcode.');
        return;
      }
      if (!pass || pass.length < 3) {
        alert('Passcode must be at least 3 characters.');
        return;
      }

      var activeRole = document.querySelector('.role-card.active .role-title');
      var role = activeRole ? activeRole.innerText.trim() : 'ADMINISTRATOR';
      var name = ((document.getElementById('full-name') || {}).value || '').trim();
      var badge = ((document.getElementById('badge-id') || {}).value || '').trim();
      var dept = ((document.getElementById('department') || {}).value || '');
      var region = ((document.getElementById('region') || {}).value || '');
      var email = ((document.getElementById('email') || {}).value || '').trim();

      if (!name && !badge && !email) {
        alert('Enter full name, badge ID, or email to register.');
        return;
      }

      try {
        if (window.SmartRouteAuth) {
          SmartRouteAuth.registerUser({
            username: name || badge || email,
            officerId: badge,
            email: email,
            password: pass,
            role: role,
            department: dept,
            region: region
          });
        } else {
          // fallback single-user
          localStorage.setItem('sr_username', name || badge);
          localStorage.setItem('sr_officer_id', badge);
          localStorage.setItem('sr_email', email);
          localStorage.setItem('sr_user_role', role);
          localStorage.setItem('sr_logged_in', '1');
          var users = [];
          try { users = JSON.parse(localStorage.getItem('sr_users') || '[]'); } catch (e) {}
          users.push({ username: name, officerId: badge, email: email, password: pass, role: role });
          localStorage.setItem('sr_users', JSON.stringify(users));
        }
      } catch (err) {
        alert(err.message || 'Registration failed');
        return;
      }

      var loading = document.getElementById('loading');
      if (loading) loading.style.display = 'flex';

      setTimeout(function () {
        window.location.href = 'dashboard.html';
      }, 700);
    };
    return true;
  }

  document.addEventListener('DOMContentLoaded', function () {
    // load auth-users if missing
    if (!window.SmartRouteAuth) {
      var s = document.createElement('script');
      s.src = 'js/auth-users.js';
      s.onload = function () { enhance(); };
      document.head.appendChild(s);
    }
    // retry until doSignup exists (inline script order)
    var tries = 0;
    var t = setInterval(function () {
      tries++;
      if (enhance() || tries > 40) clearInterval(t);
    }, 50);
  });
})();
