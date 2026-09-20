/* Patch: accept http(s) photo URLs (SIM_PHOTO_* hosted images) */
(function () {
  function ok(u) {
    if (!u) return false;
    var s = String(u);
    return (s.indexOf('data:image') === 0 && s.length > 50) || s.indexOf('http') === 0 || s.indexOf('assets/') === 0;
  }
  window.isPhotoData = ok;
  window.isPhotoSrc = ok;
  if (typeof window.photoForIncident === 'function') {
    var orig = window.photoForIncident;
    window.photoForIncident = function (type) {
      var t = String(type || '').toLowerCase();
      var flood = window.SIM_PHOTO_FLOOD;
      var slide = window.SIM_PHOTO_LANDSLIDE;
      var hole = window.SIM_PHOTO_POTHOLE;
      if (t.indexOf('flood') >= 0) return ok(flood) ? flood : (flood || 'https://images.unsplash.com/photo-1547683905-f86c17adf3d6?w=640&q=80');
      if (t.indexOf('landslide') >= 0 || t.indexOf('debris') >= 0) return ok(slide) ? slide : (slide || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=640&q=80');
      return ok(hole) ? hole : (hole || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=640&q=80');
    };
  }
  if (typeof window.photoFor === 'function') {
    window.photoFor = function (kind) {
      if (kind === 'flood') return window.SIM_PHOTO_FLOOD || 'https://images.unsplash.com/photo-1547683905-f86c17adf3d6?w=640&q=80';
      if (kind === 'landslide') return window.SIM_PHOTO_LANDSLIDE || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=640&q=80';
      if (kind === 'pothole') return window.SIM_PHOTO_POTHOLE || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=640&q=80';
      return window.SIM_PHOTO_LANDSLIDE || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=640&q=80';
    };
  }
})();
