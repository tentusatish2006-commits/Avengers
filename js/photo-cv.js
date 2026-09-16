/* SmartRoute Photo CV v9 — ONLY landslide / pothole / flood; invalid = no risk score */
(function (global) {
  'use strict';

  function classify(dataUrl, filename) {
    return new Promise(function (resolve) {
      var name = String(filename || '').toLowerCase();
      // Filename / screenshot rejection
      if (/screenshot|ansys|cad|desktop|mockup|ui\b|figma|wireframe|spreadsheet|excel|word|ppt|slide/i.test(name)) {
        return resolve(invalidMeta(99, 'Screenshot / software UI detected from filename.'));
      }

      var img = new Image();
      img.onload = function () {
        try {
          var w = 220, h = Math.max(40, Math.round(220 * img.height / Math.max(1, img.width)));
          var c = document.createElement('canvas');
          c.width = w; c.height = h;
          var ctx = c.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, w, h);
          var d = ctx.getImageData(0, 0, w, h).data;
          var n = w * h;

          var brown = 0, gray = 0, dark = 0, blue = 0, green = 0, skin = 0, ui = 0, bright = 0, edge = 0;
          for (var i = 0; i < d.length; i += 4) {
            var r = d[i], g = d[i + 1], b = d[i + 2];
            var l = (r + g + b) / 3;
            var max = Math.max(r, g, b), min = Math.min(r, g, b);
            var sat = max ? (max - min) / max : 0;

            // earth / mud / debris
            if (r > 55 && r >= g - 5 && (r - b) > 12 && l > 30 && l < 195 && sat > 0.08) brown++;
            // asphalt / wet road gray
            if (sat < 0.16 && l > 35 && l < 165 && Math.abs(r - g) < 18 && Math.abs(g - b) < 18) gray++;
            if (l < 45) dark++;
            if (l > 210) bright++;
            // water
            if (b > r + 8 && b > g - 5 && l > 35 && l < 190 && sat > 0.08) blue++;
            // vegetation
            if (g > r + 10 && g > b + 8 && sat > 0.12) green++;
            // skin-like (people/selfies)
            if (r > 100 && g > 65 && r > g + 12 && sat > 0.15 && sat < 0.55 && l > 70 && l < 200) skin++;
            // UI neon panels (screenshots)
            if ((b > 150 && b > r + 35 && sat > 0.35) || (r > 200 && g < 80 && b < 80 && sat > 0.4)) ui++;
          }

          // simple horizontal edge density (roads / UI lines)
          for (var y = 1; y < h; y += 3) {
            for (var x = 1; x < w; x += 3) {
              var idx = (y * w + x) * 4;
              var idx2 = ((y - 1) * w + x) * 4;
              var l1 = (d[idx] + d[idx + 1] + d[idx + 2]) / 3;
              var l0 = (d[idx2] + d[idx2 + 1] + d[idx2 + 2]) / 3;
              if (Math.abs(l1 - l0) > 40) edge++;
            }
          }

          function pct(x) { return (x / n) * 100; }
          var B = pct(brown), G = pct(gray), D = pct(dark), U = pct(blue);
          var S = pct(skin), UI = pct(ui), GR = pct(green), BR = pct(bright);
          var edgeRate = edge / Math.max(1, (w * h) / 9);

          // Hard reject: UI / screenshots / people-heavy / blank
          if (UI > 10 || S > 12 || BR > 45) {
            return resolve(invalidMeta(92, 'Looks like a screenshot, UI, or non-field photo.'));
          }
          if (B < 4 && G < 8 && U < 5 && GR < 8) {
            return resolve(invalidMeta(88, 'No road / terrain hazard features found.'));
          }

          // STRICT scores — must clearly match one class
          var scoreLand = 0, scorePot = 0, scoreFlood = 0;
          if (B > 14 && GR < 35) scoreLand += 40;
          if (B > 10 && D > 5) scoreLand += 25;
          if (B > 8 && G > 8 && U < 12) scoreLand += 20;
          if (edgeRate > 0.02 && B > 8) scoreLand += 10;

          if (G > 20 && D > 5) scorePot += 40;
          if (G > 15 && satAvg(d, n) < 0.2) scorePot += 25;
          if (G > 18 && B < 20 && U < 12) scorePot += 20;
          if (D > 8 && G > 12) scorePot += 15;

          if (U > 12 && B < 25) scoreFlood += 40;
          if (U > 9 && G > 8) scoreFlood += 25;
          if (U > 8 && BR < 30) scoreFlood += 20;
          if (U > 7 && D > 4) scoreFlood += 15;

          var best = 'invalid';
          var bestScore = 0;
          if (scoreLand >= 55 && scoreLand >= scorePot && scoreLand >= scoreFlood) {
            best = 'landslide'; bestScore = scoreLand;
          } else if (scorePot >= 55 && scorePot >= scoreLand && scorePot >= scoreFlood) {
            best = 'pothole'; bestScore = scorePot;
          } else if (scoreFlood >= 55 && scoreFlood >= scoreLand && scoreFlood >= scorePot) {
            best = 'flood'; bestScore = scoreFlood;
          }

          if (best === 'invalid') {
            return resolve(invalidMeta(85, 'Photo does not clearly show landslide, pothole, or flood. Risk score not calculated.'));
          }

          var conf = Math.min(96, Math.round(55 + bestScore * 0.35));
          var features = {
            brown: +B.toFixed(1), gray: +G.toFixed(1), dark: +D.toFixed(1), blue: +U.toFixed(1)
          };

          if (best === 'landslide') {
            resolve({
              class: 'landslide', confidence: conf, features: features,
              hazard_type: 'Landslide / Slope Debris', severity: 'CRITICAL',
              damage_pct: Math.min(92, Math.round(55 + B)), debris_volume_m3: +(8 + B / 3).toFixed(1),
              affected_meters: Math.round(20 + B),
              recommended_action: 'Landslide debris detected. Close corridor, divert NER traffic, dispatch clearance team.'
            });
          } else if (best === 'pothole') {
            resolve({
              class: 'pothole', confidence: conf, features: features,
              hazard_type: 'Pothole / Road Surface Damage', severity: 'HIGH',
              damage_pct: Math.min(85, Math.round(45 + G / 2)), debris_volume_m3: +(1.5 + D / 5).toFixed(1),
              affected_meters: Math.round(8 + G / 2),
              recommended_action: 'Potholes detected. Reduce speed, mark hazards, schedule road repair.'
            });
          } else {
            resolve({
              class: 'flood', confidence: conf, features: features,
              hazard_type: 'Flood / Waterlogged Road', severity: 'CRITICAL',
              damage_pct: Math.min(90, Math.round(50 + U)), debris_volume_m3: +(4 + U / 4).toFixed(1),
              affected_meters: Math.round(25 + U),
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

  global.SmartRoutePhotoCV = { version: 9, classify: classify };
})(window);
