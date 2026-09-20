/* SmartRoute Photo CV v10 — landslide / pothole / flood only; analyze pixels, not filename */
(function (global) {
  'use strict';

  function classify(dataUrl, filename) {
    return new Promise(function (resolve) {
      var name = String(filename || '').toLowerCase();
      // Only reject obvious software/UI names — NOT phone Screenshot of real roads
      if (/ansys|autocad|\.dwg|figma|wireframe|spreadsheet|excel\.|powerpoint|\.ppt|mockup-ui|desktop-ui/i.test(name)) {
        return resolve(invalidMeta(99, 'Software / CAD UI file detected from filename.'));
      }

      var img = new Image();
      img.onload = function () {
        try {
          var w = 240, h = Math.max(48, Math.round(240 * img.height / Math.max(1, img.width)));
          var c = document.createElement('canvas');
          c.width = w; c.height = h;
          var ctx = c.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, w, h);
          var d = ctx.getImageData(0, 0, w, h).data;
          var n = w * h;

          var brown = 0, gray = 0, dark = 0, blue = 0, green = 0, skin = 0, ui = 0, bright = 0;
          var wetHole = 0, edge = 0, mudWater = 0;

          for (var i = 0; i < d.length; i += 4) {
            var r = d[i], g = d[i + 1], b = d[i + 2];
            var l = (r + g + b) / 3;
            var max = Math.max(r, g, b), min = Math.min(r, g, b);
            var sat = max ? (max - min) / max : 0;

            if (r > 50 && r >= g - 8 && (r - b) > 10 && l > 25 && l < 200 && sat > 0.06) brown++;
            if (sat < 0.22 && l > 28 && l < 175 && Math.abs(r - g) < 22 && Math.abs(g - b) < 22) gray++;
            if (l < 50) dark++;
            if (l > 215) bright++;
            if (b > r + 6 && b > g - 8 && l > 30 && l < 195 && sat > 0.06) blue++;
            if (l > 40 && l < 140 && sat < 0.25 && r > 60 && r >= g - 5 && r >= b - 5 && (r - b) < 40) mudWater++;
            if (g > r + 10 && g > b + 8 && sat > 0.12) green++;
            if (r > 100 && g > 65 && r > g + 12 && sat > 0.15 && sat < 0.55 && l > 70 && l < 200) skin++;
            if ((b > 180 && b > r + 50 && sat > 0.45) || (r > 220 && g < 60 && b < 60 && sat > 0.5)) ui++;
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
          var S = pct(skin), UI = pct(ui), GR = pct(green), BR = pct(bright);
          var WH = pct(wetHole), MW = pct(mudWater);
          var edgeRate = edge / Math.max(1, (w * h) / 9);
          var satA = satAvg(d, n);

          if (UI > 14 || S > 18 || BR > 55) {
            return resolve(invalidMeta(92, 'Looks like a software UI, selfie, or blank image — not a field hazard photo.'));
          }
          if (B < 2 && G < 5 && U < 3 && MW < 5 && WH < 3 && GR < 5) {
            return resolve(invalidMeta(88, 'No road / terrain hazard features found.'));
          }

          var scoreLand = 0, scorePot = 0, scoreFlood = 0;

          if (B > 10 && GR < 40) scoreLand += 35;
          if (B > 8 && D > 4) scoreLand += 25;
          if (B > 6 && G > 6 && U < 15) scoreLand += 20;
          if (edgeRate > 0.015 && B > 6) scoreLand += 15;

          if (G > 12 && D > 3) scorePot += 35;
          if (G > 10 && satA < 0.25) scorePot += 25;
          if (WH > 4 || (G > 10 && D > 6)) scorePot += 25;
          if (G > 12 && B < 25) scorePot += 15;
          if (edgeRate > 0.012 && G > 10) scorePot += 10;

          if (U > 8) scoreFlood += 35;
          if (MW > 12) scoreFlood += 35;
          if (U > 6 && G > 5) scoreFlood += 20;
          if ((U > 5 || MW > 10) && BR < 35) scoreFlood += 15;
          if (MW > 8 && D > 3) scoreFlood += 15;

          // Road-dominant: water in holes = pothole, not open flood
          if (G > 25 && scorePot >= 30) {
            scorePot += 25;
            scoreFlood = Math.max(0, scoreFlood - 20);
          }
          if ((U > 15 || MW > 15) && G < 20) {
            scoreFlood += 20;
          }

          var best = 'invalid';
          var bestScore = 0;
          var TH = 40;
          if (scoreLand >= TH && scoreLand >= scorePot && scoreLand >= scoreFlood) {
            best = 'landslide'; bestScore = scoreLand;
          } else if (scorePot >= TH && scorePot >= scoreLand && scorePot >= scoreFlood) {
            best = 'pothole'; bestScore = scorePot;
          } else if (scoreFlood >= TH && scoreFlood >= scoreLand && scoreFlood >= scorePot) {
            best = 'flood'; bestScore = scoreFlood;
          }

          if (best === 'invalid') {
            return resolve(invalidMeta(85, 'Photo does not clearly show landslide, pothole, or flood. Risk score not calculated.'));
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
          } else if (best === 'pothole') {
            resolve({
              class: 'pothole', confidence: conf, features: features,
              risk_score: Math.min(88, Math.round(40 + G / 2 + D)), no_score: false,
              hazard_type: 'Road Potholes / Surface Damage', severity: 'HIGH',
              damage_pct: Math.min(85, Math.round(35 + G / 2 + WH)), debris_volume_m3: +(1 + WH / 5).toFixed(1),
              affected_meters: Math.round(12 + G / 2),
              recommended_action: 'Potholes / surface damage detected. Slow traffic and schedule patch repair.'
            });
          } else {
            resolve({
              class: 'flood', confidence: conf, features: features,
              risk_score: Math.min(92, Math.round(50 + U + MW / 2)), no_score: false,
              hazard_type: 'Flood / Waterlogged Road', severity: 'CRITICAL',
              damage_pct: Math.min(90, Math.round(45 + U + MW / 2)), debris_volume_m3: +(4 + (U + MW) / 4).toFixed(1),
              affected_meters: Math.round(25 + U + MW / 2),
              recommended_action: 'Flood / waterlogging detected. Use elevated alternate NER routes.'
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

  global.SmartRoutePhotoCV = { version: 10, classify: classify };
})(window);
