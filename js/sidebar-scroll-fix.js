/* Inject sidebar scroll fix stylesheet if not already present */
(function () {
  if (document.getElementById('sr-sidebar-scroll-fix')) return;
  var link = document.createElement('link');
  link.id = 'sr-sidebar-scroll-fix';
  link.rel = 'stylesheet';
  link.href = 'css/sidebar-scroll-fix.css';
  document.head.appendChild(link);
})();
