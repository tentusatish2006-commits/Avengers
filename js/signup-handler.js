/* Hook signup form: register account + session + go dashboard */
(function () {
  'use strict';

  function runSignup() {
    var passEl = document.getElementById('password');
    var confirmEl = document.getElementById('confirm-password');
    if (!passEl || !confirmEl) return;

    var pass = passEl.value;
    var confirmPass = confirmEl.value;
    if (pass !== confirmPass) {
      alert('Passcodes do not match.');
      return;
    }
    if (!pass) {
      alert('Enter a security passcode.');
      return;
    }

    var activeRole = document.querySelector('.role-card.active .role-title');
    var role = activeRole ? activeRole.innerText.trim() : 'ADMINISTRATOR';
    var name = (document.getElementById('full-name') || {}).value || '';
    var badge = (document.getElementById('badge-id') || {}).value || '';
    var dept = (document.getElementById('department') || {}).value || '';
    var region = (document.getElementById('region') || {}).value || '';
    var email = (document.getElementById('email') || {}).value || '';
    name = String(name).trim();
    badge = String(badge).trim();
    email = String(email).trim();

    if (!name && !badge && !email) {
      alert('Enter name, badge ID, or email.');
      return;
    }

    function finishGo() {
      var loading = document.getElementById('loading');
      if (loading) loading.style.display = 'flex';
      setTimeout(function () {
        window.location.replace('dashboard.html');
      }, 400);
    }

    function ensureAuth(cb) {
      if (window.SmartRouteAuth) return cb();
      var s = document.createElement('script');
      s.src = 'js/auth-users.js?v=auth2';
      s.onload = cb;
      s.onerror = cb;
      document.head.appendChild(s);
    }

    ensureAuth(function () {
      try {
        if (window.SmartRouteAuth && SmartRouteAuth.registerUser) {
          SmartRouteAuth.registerUser({
            username: name,
            officerId: badge,
            email: email,
            password: pass,
            role: role,
            department: dept,
            region: region
          });
        } else {
          // Fallback session keys
          localStorage.setItem('sr_username', name || badge || email);
          localStorage.setItem('sr_officer_id', badge);
          localStorage.setItem('sr_email', email);
          localStorage.setItem('sr_user_role', role);
          localStorage.setItem('sr_department', dept);
          localStorage.setItem('sr_region', region);
          localStorage.setItem('sr_logged_in', '1');
          var payload = { username: name || badge, officerId: badge, email: email, role: role };
          localStorage.setItem('sr_user', JSON.stringify(payload));
          sessionStorage.setItem('sr_user', JSON.stringify(payload));
        }
        finishGo();
      } catch (err) {
        alert('Signup failed: ' + (err && err.message ? err.message : 'try again'));
      }
    });
  }

  // Override global doSignup used by form onsubmit
  window.doSignup = runSignup;

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('signup-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        runSignup();
      });
    }
  });
})();
