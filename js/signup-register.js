/* Override signup to always save into SmartRouteAuth registry */
(function () {
  function registerFromForm() {
    var pass = ((document.getElementById('password') || {}).value || '');
    var confirmPass = ((document.getElementById('confirm-password') || {}).value || '');
    if (pass !== confirmPass) {
      alert('Passcodes do not match.');
      return false;
    }
    if (!pass || pass.length < 3) {
      alert('Passcode must be at least 3 characters.');
      return false;
    }

    var activeRole = document.querySelector('.role-card.active .role-title');
    var role = activeRole ? activeRole.innerText.trim() : 'ADMINISTRATOR';
    var name = ((document.getElementById('full-name') || {}).value || '').trim();
    var badge = ((document.getElementById('badge-id') || {}).value || '').trim();
    var dept = ((document.getElementById('department') || {}).value || '');
    var region = ((document.getElementById('region') || {}).value || '');
    var email = ((document.getElementById('email') || {}).value || '').trim();

    if (!name && !badge && !email) {
      alert('Enter full name, badge ID, or email.');
      return false;
    }

    if (!window.SmartRouteAuth) {
      alert('Auth system not loaded. Refresh and try again.');
      return false;
    }

    try {
      SmartRouteAuth.registerUser({
        username: name || badge || email,
        officerId: badge,
        email: email,
        password: pass,
        role: role,
        department: dept,
        region: region
      });
    } catch (err) {
      alert(err.message || 'Registration failed');
      return false;
    }

    var loading = document.getElementById('loading');
    if (loading) loading.style.display = 'flex';
    setTimeout(function () {
      window.location.replace('dashboard.html');
    }, 600);
    return false;
  }

  function wire() {
    window.doSignup = registerFromForm;
    var form = document.getElementById('signup-form');
    if (form) {
      form.onsubmit = function (e) {
        e.preventDefault();
        registerFromForm();
        return false;
      };
    }
    var btn = document.querySelector('.btn-signup');
    if (btn) {
      btn.onclick = function (e) {
        e.preventDefault();
        registerFromForm();
        return false;
      };
    }
  }

  function boot() {
    if (!window.SmartRouteAuth) {
      var s = document.createElement('script');
      s.src = 'js/auth-users.js';
      s.onload = wire;
      document.head.appendChild(s);
    } else {
      wire();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  // late bind in case form is painted later
  setTimeout(wire, 300);
  setTimeout(wire, 1000);
})();
