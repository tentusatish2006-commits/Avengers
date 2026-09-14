/** SmartRoute Photo CV — accepts ONLY landslide, pothole, flood. Everything else = invalid. */
window.SmartRoutePhotoCV = {
  classify: function (dataUrl, filename) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        try {
          var w = 180, h = Math.max(1, Math.round(180 * img.height / img.width));
          var canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          var ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, w, h);
          var id = ctx.getImageData(0, 0, w, h).data;
          var n = w * h;
          var earth = 0, water = 0, dark = 0, gray = 0, green = 0, skin = 0, uiBlue = 0, whiteBg = 0, edge = 0;
          var sumL = 0, sumL2 = 0;
          for (var i = 0; i < id.length; i += 4) {
            var r = id[i], g = id[i + 1], b = id[i + 2];
            var max = Math.max(r, g, b), min = Math.min(r, g, b);
            var l = (r + g + b) / 3;
            sumL += l; sumL2 += l * l;
            var sat = max === 0 ? 0 : (max - min) / max;
            if (b > r + 18 && b > g + 8 && l > 45 && l < 185 && sat > 0.15) water++;
            if (r > g + 5 && g >= b - 8 && r > 70 && l > 40 && l < 175 && sat > 0.18 && sat < 0.75) earth++;
            if (l < 38) dark++;
            if (sat < 0.14 && l > 50 && l < 150 && Math.abs(r - g) < 14 && Math.abs(g - b) < 14) gray++;
            if (g > r + 15 && g > b + 15 && l > 45) green++;
            if (r > 95 && g > 55 && b > 35 && r > g && g > b && sat > 0.18 && sat < 0.5 && l > 80 && l < 190) skin++;
            if (b > 140 && b > r + 25 && b > g + 15 && l > 100 && l < 210) uiBlue++;
            if (l > 200 && sat < 0.08) whiteBg++;
          }
          for (var y = 2; y < h - 2; y += 2) {
            for (var x = 2; x < w - 2; x += 2) {
              var idx = (y * w + x) * 4;
              var l0 = (id[idx] + id[idx + 1] + id[idx + 2]) / 3;
              var lx = (id[idx + 8] + id[idx + 9] + id[idx + 10]) / 3;
              if (Math.abs(l0 - lx) > 32) edge++;
            }
          }
          function pct(v) { return (v / n) * 100; }
          var meanL = sumL / n;
          var varL = sumL2 / n - meanL * meanL;
          var edgePct = (edge / (n / 4)) * 100;
          var f = {
            water: +pct(water).toFixed(1),
            earth: +pct(earth).toFixed(1),
            dark: +pct(dark).toFixed(1),
            gray: +pct(gray).toFixed(1),
            green: +pct(green).toFixed(1),
            uiBlue: +pct(uiBlue).toFixed(1),
            whiteBg: +pct(whiteBg).toFixed(1),
            skin: +pct(skin).toFixed(1),
            edge: +edgePct.toFixed(1),
            meanL: +meanL.toFixed(1)
          };
          var isSoftwareUI = f.uiBlue > 12 || f.whiteBg > 35 || (f.uiBlue > 6 && f.whiteBg > 15) ||
            (f.whiteBg > 20 && f.earth < 8 && f.dark < 8 && f.water < 6);
          var isPortrait = f.skin > 8;
          var isBlank = f.whiteBg > 50 || (f.meanL > 200 && f.earth < 5 && f.dark < 5);
          var lacksRoad = f.earth < 6 && f.dark < 5 && f.gray < 10 && f.water < 6;

          var scores = { landslide: 0, pothole: 0, flood: 0, invalid: 0 };
          scores.flood = f.water * 3 + (f.water > 10 ? 25 : f.water > 5 ? 12 : 0) - f.uiBlue * 2 - f.whiteBg * 0.5 - f.skin * 2;
          scores.landslide = f.earth * 2.8 + f.edge * 0.9 + f.gray * 0.5 +
            (varL > 900 ? 18 : varL > 500 ? 10 : 0) + (f.green < 30 ? 10 : -12) -
            f.water * 0.4 - f.uiBlue * 2.5 - f.whiteBg * 1.2 - f.skin * 2;
          scores.pothole = f.dark * 3.2 + f.gray * 1.8 + (f.dark > 8 ? 22 : f.dark > 4 ? 10 : 0) +
            (f.water < 10 ? 8 : -15) + (f.green < 35 ? 8 : -10) - f.uiBlue * 2.5 - f.whiteBg * 1.5 - f.skin * 2;
          scores.invalid = f.uiBlue * 4 + f.whiteBg * 1.5 + f.skin * 4 +
            (isSoftwareUI ? 50 : 0) + (isPortrait ? 40 : 0) + (isBlank ? 35 : 0) + (lacksRoad ? 25 : 0);

          var best = 'invalid', bestScore = -1e9;
          ['landslide', 'pothole', 'flood', 'invalid'].forEach(function (k) {
            if (scores[k] > bestScore) { bestScore = scores[k]; best = k; }
          });
          if (best !== 'invalid') {
            var lead = bestScore - scores.invalid;
            if (bestScore < 28 || lead < 12 || isSoftwareUI || isPortrait || lacksRoad) best = 'invalid';
          }
          var name = String(filename || '').toLowerCase();
          if (/ansys|cad|solidworks|screenshot|desktop|whatsapp|receipt|invoice/.test(name)) best = 'invalid';

          var conf = best === 'invalid'
            ? Math.min(99, Math.max(75, Math.round(60 + scores.invalid * 0.4)))
            : Math.max(55, Math.min(96, Math.round(48 + bestScore * 0.55)));

          var meta = { class: best, confidence: conf, features: f, scores: scores };
          if (best === 'landslide') {
            meta.hazard_type = 'Landslide / Slope Debris';
            meta.severity = conf > 80 ? 'CRITICAL' : 'HIGH';
            meta.damage_pct = Math.min(95, 55 + Math.round(conf * 0.35));
            meta.debris_volume_m3 = +(8 + conf * 0.22).toFixed(1);
            meta.affected_meters = Math.round(18 + conf * 0.4);
            meta.recommended_action = 'CRITICAL slope debris. Close segment, divert NER traffic, dispatch clearance.';
          } else if (best === 'pothole') {
            meta.hazard_type = 'Pothole / Road Surface Damage';
            meta.severity = conf > 85 ? 'HIGH' : 'MODERATE';
            meta.damage_pct = Math.min(88, 40 + Math.round(conf * 0.3));
            meta.debris_volume_m3 = +(1.2 + conf * 0.05).toFixed(1);
            meta.affected_meters = Math.round(6 + conf * 0.15);
            meta.recommended_action = 'Surface damage confirmed. Speed restriction, mark hazard, schedule repair.';
          } else if (best === 'flood') {
            meta.hazard_type = 'Flood / Waterlogged Road';
            meta.severity = conf > 80 ? 'CRITICAL' : 'HIGH';
            meta.damage_pct = Math.min(92, 50 + Math.round(conf * 0.35));
            meta.debris_volume_m3 = +(3 + conf * 0.1).toFixed(1);
            meta.affected_meters = Math.round(25 + conf * 0.5);
            meta.recommended_action = 'Flooded approach. Use elevated alternate routes; monitor water level.';
          } else {
            meta.hazard_type = 'Invalid Photo';
            meta.severity = 'REJECTED';
            meta.damage_pct = 0;
            meta.debris_volume_m3 = 0;
            meta.affected_meters = 0;
            meta.recommended_action = 'INVALID PHOTO: not a landslide, pothole, or flood. Upload a real field photo of one of those three only (no software screenshots, selfies, or unrelated images).';
          }
          resolve(meta);
        } catch (e) {
          resolve({
            class: 'invalid', confidence: 99, hazard_type: 'Invalid Photo', severity: 'REJECTED',
            damage_pct: 0, debris_volume_m3: 0, affected_meters: 0,
            recommended_action: 'INVALID PHOTO: analysis error.', features: {}
          });
        }
      };
      img.onerror = function () {
        resolve({
          class: 'invalid', confidence: 99, hazard_type: 'Invalid Photo', severity: 'REJECTED',
          damage_pct: 0, debris_volume_m3: 0, affected_meters: 0,
          recommended_action: 'INVALID PHOTO: image failed to load.', features: {}
        });
      };
      img.src = dataUrl;
    });
  }
};
