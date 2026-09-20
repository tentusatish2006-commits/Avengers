/* SmartRoute Photo CV v12 — landslide / pothole / flood only; no risk score on invalid */
(function (global) {
  'use strict';

  function classify(dataUrl, filename) {
    return new Promise(function (resolve) {
      var name = String(filename || '').toLowerCase();
      if (/ansys|autocad|\.dwg|figma|wireframe|spreadsheet|excel\.|powerpoint|\.ppt|mockup-ui|desktop-ui/i.test(name)) {
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
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          var data = ctx.getImageData(0, 0, w, h).data;
          var d = data;
          var n = (w * h);
          var brown = 0, gray = 0, dark = 0, blue = 0, ui = 0, green = 0, bright = 0, wetHole = 0, mudWater = 0, edge = 0;

          for (var i = 0; i < d.length; i += 4) {
            var r = d[i], g = d[i + 1], b = d[i + 2];
            var l = (r + g + b) / 3;
            var max = Math.max(r, g, b), min = Math.min(r, g, b);
            var sat = max ? (max - min) / max : 0;
            if (l > 220) bright++;
            if (l < 45) dark++;
            if (r > 90 && g > 50 && b < 90 && r > b + 20 && g > b) brown++;
            if (Math.abs(r - g) < 18 && Math.abs(g - b) < 18 && l > 40 && l < 180) gray++;
            if (b > r + 15 && b > g + 10 && b > 60) blue++;
            if (g > r + 15 && g > b + 10 && g > 50) green++;
            if (r > 200 && g > 200 && b > 200 && sat < 0.1) ui++;
            if (l < 100 && sat > 0.15 && r > 40 && g > 30 && b < 90) mudWater++;
            if (l < 70 && sat < 0.2 && Math.abs(r - g) < 15) wetHole++;
          }

          for (var y = 1; y < h; y += 3) {
            for (var x = 1; x < w; x += 3) {
              var idx = (y * w + x) * 4;
              var idx2 = ((y - 1) * w + x) * 4;
              var l1 = (d[idx] + d[idx + 1] + d[idx + 2]) / 3;
              var l0 = (d[idx2] + d[idx2 + 1] + d[idx2 + 2]) / 3;
              if (Math.abs(l1 - l0) > 35) edge++;
            }
          }

          function pct(x) { return (x / n) * 100; }
          var B = pct(brown), G = pct(gray), D = pct(dark), U = pct(blue);
          var UI = pct(ui), GR = pct(green), BR = pct(bright);
          var WH = pct(wetHole), MW = pct(mudWater);
          var edgeRate = edge / Math.max(1, (w * h) / 9);
          var satA = satAvg(d, n);

          if (UI > 14 || BR > 60) {
            return resolve(invalidMeta(92, 'Looks like a software UI or blank image — not a field hazard photo.'));
          }
          if (B < 2 && G < 5 && U < 3 && MW < 5 && WH < 3 && GR < 5) {
            return resolve(invalidMeta(88, 'No road / terrain hazard features found.'));
          }

          var scoreLand = 0, scorePot = 0, scoreFlood = 0;

          if (B > 12) scoreLand += 40;
          if (B > 8 && D > 3) scoreLand += 25;
          if (B > 6 && GR > 2) scoreLand += 15;
          if (edgeRate > 0.012 && B > 8) scoreLand += 15;
          if (B > 20) scoreLand += 20;

          if (G > 15 && B < 30) scorePot += 35;
          if (G > 12 && satA < 0.25 && B < 35) scorePot += 25;
          if (WH > 5 && G > 10 && B < 40) scorePot += 25;
          if (G > 18 && B < 25) scorePot += 15;

          if (U > 10) scoreFlood += 40;
          if (MW > 15) scoreFlood += 35;
          if (U > 7 && G > 5 && B < 35) scoreFlood += 20;
          if ((U > 8 || MW > 12) && BR < 40) scoreFlood += 15;

          if (B > 25) {
            scoreLand += 30;
            scorePot = Math.max(0, scorePot - 35);
            scoreFlood = Math.max(0, scoreFlood - 15);
          }
          if (G > 30 && B < 20) {
            scorePot += 20;
            scoreFlood = Math.max(0, scoreFlood - 25);
          }
          if ((U > 12 || MW > 18) && B < 40) {
            scoreFlood += 25;
            scorePot = Math.max(0, scorePot - 15);
          }

          var best = 'invalid';
          var bestScore = 0;
          var TH = 48;
          if (scoreLand >= TH && scoreLand >= scorePot && scoreLand >= scoreFlood) {
            best = 'landslide'; bestScore = scoreLand;
          } else if (scoreFlood >= TH && scoreFlood >= scoreLand && scoreFlood >= scorePot) {
            best = 'flood'; bestScore = scoreFlood;
          } else if (scorePot >= TH && scorePot >= scoreLand && scorePot >= scoreFlood) {
            best = 'pothole'; bestScore = scorePot;
          }

          if (best === 'invalid' || bestScore < TH) {
            return resolve(invalidMeta(88, 'INVALID PHOTO — not a clear landslide, pothole, or flood. Risk score is NOT calculated.'));
          }

          var conf = Math.min(96, Math.round(55 + bestScore * 0.35));
          var features = {
            brown: +B.toFixed(1), gray: +G.toFixed(1), dark: +D.toFixed(1),
            blue: +U.toFixed(1), green: +GR.toFixed(1), wet_holes: +WH.toFixed(1), mud_water: +MW.toFixed(1)
          };

          if (best === 'landslide') {
            resolve({
              class: 'landslide', confidence: conf, features: features,
              risk_score: Math.min(95, Math.round(55 + B + D / 2)), no_score: false,
              hazard_type: 'Landslide Debris', severity: 'CRITICAL',
              damage_pct: Math.min(95, Math.round(55 + B)), debris_volume_m3: +(8 + B / 3).toFixed(1),
              affected_meters: Math.round(20 + B),
              recommended_action: 'Landslide debris detected. Close corridor and deploy clearance crew.'
            });
          } else if (best === 'flood') {
            resolve({
              class: 'flood', confidence: conf, features: features,
              risk_score: Math.min(92, Math.round(50 + U + MW / 2)), no_score: false,
              hazard_type: 'Flood / Waterlogged Road', severity: 'CRITICAL',
              damage_pct: Math.min(90, Math.round(45 + U + MW / 2)), debris_volume_m3: +(4 + (U + MW) / 4).toFixed(1),
              affected_meters: Math.round(25 + U + MW / 2),
              recommended_action: 'Flood / waterlogging detected. Use elevated alternate NER routes.'
            });
          } else {
            resolve({
              class: 'pothole', confidence: conf, features: features,
              risk_score: Math.min(88, Math.round(40 + G / 2 + D)), no_score: false,
              hazard_type: 'Road Potholes / Surface Damage', severity: 'HIGH',
              damage_pct: Math.min(85, Math.round(35 + G / 2 + WH)), debris_volume_m3: +(1 + WH / 5).toFixed(1),
              affected_meters: Math.round(12 + G / 2),
              recommended_action: 'Potholes / surface damage detected. Slow traffic and schedule patch repair.'
            });
          }
        } catch (err) {
          resolve(invalidMeta(90, 'Could not analyze image. Upload a clear field photo of landslide, pothole, or flood.'));
        }
      };
      img.onerror = function () {
        resolve(invalidMeta(99, 'Image failed to load.'));
      };
      img.src = dataUrl;
    });
  }

  function satAvg(d, n) {
    var s = 0, c = 0;
    for (var i = 0; i < d.length; i += 16) {
      var r = d[i], g = d[i + 1], b = d[i + 2];
      var max = Math.max(r, g, b), min = Math.min(r, g, b);
      s += max ? (max - min) / max : 0;
      c++;
    }
    return c ? s / c : 0;
  }

  function invalidMeta(conf, reason) {
    return {
      class: 'invalid',
      confidence: conf || 90,
      hazard_type: 'Invalid Photo',
      severity: 'REJECTED',
      damage_pct: 0,
      debris_volume_m3: 0,
      affected_meters: 0,
      recommended_action: reason || 'Upload only landslide, pothole, or flood field photos.',
      features: {},
      risk_score: null,
      no_score: true
    };
  }

  global.SmartRoutePhotoCV = { version: 12, classify: classify };
})(window);
