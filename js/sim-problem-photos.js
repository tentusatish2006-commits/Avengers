/* Problem-matched photos loader */
window.SIM_PROBLEM_PHOTOS = window.SIM_PROBLEM_PHOTOS || {};
(function () {
  function load(src) {
    var s = document.createElement('script');
    s.src = src;
    s.async = false;
    document.head.appendChild(s);
  }
  load('js/sim-photo-landslide.js');
  load('js/sim-photo-road.js');
})();
