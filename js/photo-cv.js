/* SmartRoute Photo CV v13 — landslide / pothole / flood; accepts real field photos */
(function (global) {
  'use strict';

  function classify(dataUrl, filename) {
    return new Promise(function (resolve) {
      var name = String(filename || '').toLowerCase();
      if (/ansys|autocad|\.dwg|figma|wireframe|spreadsheet|excel\.|powerpoint|\.pptx?$/i.test(name)) {
        return resolve(invalidMeta(99, 'Software / CAD UI file detected from filename.'));
      }

      var img = new Image();
      img.onload = function () {
        try {
          var canvas = document.createElement('canvas');
          var maxSide = 320;
          var scale = Math.min(1, maxSide / Math.max(img.width, img.height));
          var w = Math.max(1, Math.round(img.width * scale));
          var h = Math.max(1, Math.round(img.height * scale));
          canvas.width = w; canvas.height = h;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          var d = ctx.getImageData(0, 0, w, h).data;
          var n = w * h;
          var brown = 0, gray = 0, dark = 0, blue = 0, ui = 0, green = 0, bright = 0, wetHole = 0, mudWater = 0, edge = 0;

          for (var i = 0; i < d.length; i += 4) {
            var r = d[i], g = d[i + 1], b = d[i + 2];
            var l = (r + g + b) / 3;
            var max = Math.max(r, g, b), min = Math.min(r, g, b);
            var sat = max ? (max - min) / max : 0;
            if (l > 220) bright++;
            if (l < 45) dark++;
            if (r > 70 && g > 40 && b < 110 && r >= g && r > b + 10) brown++;
            if (Math.abs(r - g) < 22 && Math.abs(g - b) < 22 && l > 30 && l < 200) gray++;
            if (b > r + 8 && b > g + 5 && b > 50) blue++;
            if (g > r + 12 && g > b + 8 && g > 45) green++;
            if (r > 210 && g > 210 && b > 210 && sat < 0.08) ui++;
            if (l < 110 && sat > 0.1 && r > 35 && g > 25 && b < 100) mudWater++;
            if (l < 80 && sat < 0.25 && Math.abs(r - g) < 20) wetHole++;
          }

          for (var y = 1; y < h; y += 3) {
            for (var x = 1; x < w; x += 3) {
              var idx = (y * w + x) * 4;
              var idx2 = ((y - 1) * w + x) * 4;
              var l1 = (d[idx] + d[idx + 1] + d[idx + 2]) / 3;
              var l0 = (d[idx2] + d[idx2 + 1] + d[idx2 + 2]) / 3;
              if (Math.abs(l1 - l0) > 30) edge++;
            }
          }

          function pct(x) { return (x / n) * 100; }
          var B = pct(brown), G = pct(gray), D = pct(dark), U = pct(blue);
          var UI = pct(ui), GR = pct(green), BR = pct(bright);
          var WH = pct(wetHole), MW = pct(mudWater);
          var edgeRate = edge / Math.max(1, (w * h) / 9);
          var satA = satAvg(d, n);

          if (UI > 25 && BR > 55) {
            return resolve(invalidMeta(92, 'Looks like a software UI or blank image — not a field hazard photo.'));
          }

          var scoreLand = 0, scorePot = 0, scoreFlood = 0;
          if (B > 8) scoreLand += 45;
          if (B > 5 && D > 2) scoreLand += 25;
          if (B > 4 && MW > 8) scoreLand += 20;
          if (edgeRate > 0.01 && B > 5) scoreLand += 15;
          if (B > 12) scoreLand += 20;
          if (MW > 15 && B > 5) scoreLand += 15;

          if (G > 12) scorePot += 35;
          if (G > 10 && satA < 0.3) scorePot += 25;
          if (WH > 4 && G > 8) scorePot += 25;
          if (G > 15 && D > 8) scorePot += 20;
          if (WH > 10) scorePot += 15;

          if (U > 8) scoreFlood += 45;
          if (U > 5 && G > 8) scoreFlood += 25;
          if (MW > 8 && U > 4) scoreFlood += 20;
          if (U > 15) scoreFlood += 20;
          if (U > 25) scoreFlood += 15;

          if (B > 10 && U < 8) { scoreLand += 20; scoreFlood = Math.max(0, scoreFlood - 20); }
          if (U > 20) { scoreFlood += 25; scoreLand = Math.max(0, scoreLand - 15); }
          if (G > 40 && WH > 8 && B < 5) scorePot += 25;

          var TH = 28;
          var best = 'invalid', bestScore = 0;
          if (scoreLand >= scorePot && scoreLand >= scoreFlood) { best = 'landslide'; bestScore = scoreLand; }
          else if (scoreFlood >= scoreLand && scoreFlood >= scorePot) { best = 'flood'; bestScore = scoreFlood; }
          else { best = 'pothole'; bestScore = scorePot; }

          if (bestScore < TH) {
            if (B >= 2 || U >= 3 || G >= 8 || MW >= 5 || WH >= 3) {
              bestScore = Math.max(scoreLand, scoreFlood, scorePot, 30);
            } else {
              return resolve(invalidMeta(88, 'INVALID PHOTO — not a clear landslide, pothole, or flood.'));
            }
          }

          var conf = Math.min(96, Math.round(55 + bestScore * 0.35));
          var features = { brown: +B.toFixed(1), gray: +G.toFixed(1), dark: +D.toFixed(1), blue: +U.toFixed(1), green: +GR.toFixed(1), wet_holes: +WH.toFixed(1), mud_water: +MW.toFixed(1) };

          if (best === 'landslide') {
            resolve({ class: 'landslide', confidence: conf, features: features, risk_score: Math.min(95, Math.round(55 + B + D / 2)), no_score: false, hazard_type: 'Landslide Debris', severity: 'CRITICAL', damage_pct: Math.min(95, Math.round(55 + B)), debris_volume_m3: +(8 + B / 3).toFixed(1), affected_meters: Math.round(20 + B), recommended_action: 'Landslide debris detected. Close corridor and deploy clearance crew.' });
          } else if (best === 'flood') {
            resolve({ class: 'flood', confidence: conf, features: features, risk_score: Math.min(92, Math.round(50 + U + MW / 2)), no_score: false, hazard_type: 'Flood / Waterlogged Road', severity: 'CRITICAL', damage_pct: Math.min(90, Math.round(45 + U + MW / 2)), debris_volume_m3: +(4 + (U + MW) / 4).toFixed(1), affected_meters: Math.round(25 + U + MW / 2), recommended_action: 'Flood / waterlogging detected. Use elevated alternate NER routes.' });
          } else {
            resolve({ class: 'pothole', confidence: conf, features: features, risk_score: Math.min(88, Math.round(40 + G / 2 + D)), no_score: false, hazard_type: 'Road Potholes / Surface Damage', severity: 'HIGH', damage_pct: Math.min(85, Math.round(35 + G / 2 + WH)), debris_volume_m3: +(1 + WH / 5).toFixed(1), affected_meters: Math.round(12 + G / 2), recommended_action: 'Potholes / surface damage detected. Slow traffic and schedule patch repair.' });
          }
        } catch (err) {
          console.warn('[PhotoCV]', err);
          resolve(invalidMeta(90, 'Could not analyze image.'));
        }
      };
      img.onerror = function () { resolve(invalidMeta(99, 'Image failed to load.')); };
      img.crossOrigin = 'anonymous';
      img.src = dataUrl;
    });
  }

  function satAvg(d, n) {
    var s = 0, c = 0;
    for (var i = 0; i < d.length; i += 16) {
      var r = d[i], g = d[i + 1], b = d[i + 2];
      var max = Math.max(r, g, b), min = Math.min(r, g, b);
      s += max ? (max - min) / max : 0; c++;
    }
    return c ? s / c : 0;
  }

  function invalidMeta(conf, reason) {
    return { class: 'invalid', invalid: true, confidence: conf || 90, hazard_type: 'Invalid Photo', severity: 'REJECTED', damage_pct: 0, debris_volume_m3: 0, affected_meters: 0, recommended_action: reason || 'Upload only landslide, pothole, or flood field photos.', features: {}, risk_score: null, no_score: true };
  }

  function analyze(imgOrUrl, filename) {
    var url = typeof imgOrUrl === 'string' ? imgOrUrl : (imgOrUrl && imgOrUrl.src);
    return classify(url, filename);
  }

  var api = { version: 13, classify: classify, analyze: analyze };
  global.SmartRoutePhotoCV = api;
  global.PhotoCV = api;
})(window);
