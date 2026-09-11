/* SmartRoute auth helpers */
function requireAuthNav(target) {
  const logged = localStorage.getItem('sr_logged_in') === '1' || !!localStorage.getItem('sr_username');
  if (logged) {
    window.location.href = target;
    return false;
  }
  try { localStorage.setItem('sr_return_to', target); } catch (e) {}
  alert('Please Login or Sign Up to access the Command Center.');
  window.location.href = 'login.html';
  return false;
}

// Patch homepage CTAs if present
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('a[href="dashboard.html"]').forEach(function (a) {
    if (a.classList.contains('btn') || a.closest('.cta-buttons')) {
      a.setAttribute('href', '#');
      a.addEventListener('click', function (e) {
        e.preventDefault();
        requireAuthNav('dashboard.html');
      });
    }
  });
  document.querySelectorAll('a[href="map.html"]').forEach(function (a) {
    if (a.classList.contains('btn') || a.closest('.cta-buttons')) {
      a.setAttribute('href', '#');
      a.addEventListener('click', function (e) {
        e.preventDefault();
        requireAuthNav('map.html');
      });
    }
  });
});
