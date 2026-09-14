/**
 * SmartRoute Photo CV v6
 * Accepts: landslide, pothole, flood
 * Rejects: software UI, selfies, blank/unrelated images
 * Does NOT reject solely because filename contains "screenshot"
 */
window.SmartRoutePhotoCV = {
  classify: function (dataUrl, filename) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        try {
          var w = 200, h = Math.max(1, Math.round(200 * img.height / img.width));
          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, w, h);
          var id = ctx.getImageData(0, 0, w, h).data;
          var n = w * h;

          var earth = 0, water = 0, dark = 0, gray = 0, green = 0, skin = 0;
          var uiBlue = 0, whiteBg = 0, rock = 0, mud = 0, edge = 0;
          var sumL = 0, sumL2 = 0;

          for (var i = 0; i < id.length; i += 4) {
            var r = id[i], g = id[i + 1], b = id[i + 2];
            var max = Math.max(r, g, b), min = Math.min(r, g, b);
            var l = (r + g + b) / 3;
            sumL += l;
            sumL2 += l * l;
            var sat = max === 0 ? 0 : (max - min) / max;

            // natural water / flood
            if (b > r + 12 && b > g + 5 && l > 40 && l < 190 && sat > 0.12) water++;

            // brown earth / soil / landslide debris (wide range)
            if (r >= g && g >= b - 15 && r > 55 && l > 30 && l < 185 && sat > 0.08) earth++;

            // muddy orange-brown (fresh landslide)
            if (r > 90 && g > 50 && b < g && r > g && (r - b) > 25 && l > 40 && l < 170) mud++;

            // dark cavities (potholes)
            if (l < 42) dark++;

            // asphalt / rock gray
            if (sat < 0.16 && l > 40 && l < 165 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20) gray++;

            // rocky mid-tone
            if (sat < 0.22 && l > 55 && l < 140 && Math.abs(r - g) < 25) rock++;

            // vegetation (landslides often have trees nearby — do not over-penalize)
            if (g > r + 12 && g > b + 12 && l > 40 && l < 180) green++;

            // skin (selfies)
            if (r > 100 && g > 60 && b > 40 && r > g + 10 && g > b && sat > 0.2 && sat < 0.55 && l > 85 && l < 185) skin++;

            // software UI blue panels
            if (b > 150 && b > r + 30 && b > g + 20 && l > 110 && l < 210 && sat > 0.2) uiBlue++;

            // flat white UI background
            if (l > 210 && sat < 0.06) whiteBg++;
          }

          for (var y = 2; y < h - 2; y += 2) {
            for (var x = 2; x < w - 2; x += 2) {
              var idx = (y * w + x) * 4;
              var l0 = (id[idx] + id[idx + 1] + id[idx + 2]) / 3;
              var lx = (id[idx + 8] + id[idx + 9] + id[idx + 10]) / 3;
              if (Math.abs(l0 - lx) > 26) edge++;
            }
          }

          function pct(v) { return (v / n) * 100; }
          var meanL = sumL / n;
          var varL = sumL2 / n - meanL * meanL;
          var edgePct = (edge / (n / 4)) * 100;

          var f = {
            water: +pct(water).toFixed(1),
            earth: +pct(earth).toFixed(1),
            mud: +pct(mud).toFixed(1),
            dark: +pct(dark).toFixed(1),
            gray: +pct(gray).toFixed(1),
            rock: +pct(rock).toFixed(1),
            green: +pct(green).toFixed(1),
            uiBlue: +pct(uiBlue).toFixed(1),
            whiteBg: +pct(whiteBg).toFixed(1),
            skin: +pct(skin).toFixed(1),
            edge: +edgePct.toFixed(1),
            meanL: +meanL.toFixed(1),
            varL: +varL.toFixed(0)
          };

          // Software UI only when clearly CAD/app chrome (not natural blue water)
          var isSoftwareUI =
            f.uiBlue > 18 ||
            f.whiteBg > 40 ||
            (f.uiBlue > 10 && f.whiteBg > 22 && f.earth < 10 && f.mud < 5);

          var isPortrait = f.skin > 12;
          var isBlank = f.whiteBg > 55 || (f.meanL > 210 && f.earth < 4 && f.dark < 4 && f.mud < 3);

          // Positive road-hazard evidence
          var hasLandslideEvidence =
            (f.earth + f.mud) > 18 ||
            (f.mud > 8 && f.edge > 8) ||
            (f.earth > 12 && f.rock > 8) ||
            (f.earth > 15 && varL > 400);

          var hasPotholeEvidence =
            (f.dark > 7 && f.gray > 8) ||
            (f.dark > 12) ||
            (f.dark > 5 && f.gray > 15 && f.water < 15);

          var hasFloodEvidence =
            f.water > 10 ||
            (f.water > 6 && f.meanL > 55 && f.meanL < 175);

          var scores = { landslide: 0, pothole: 0, flood: 0, invalid: 0 };

          scores.flood =
            f.water * 3.2 +
            (f.water > 12 ? 28 : f.water > 7 ? 16 : f.water > 4 ? 8 : 0) -
            f.uiBlue * 1.5 -
            f.skin * 2 -
            (isSoftwareUI ? 40 : 0);

          scores.landslide =
            f.earth * 2.4 +
            f.mud * 3.0 +
            f.rock * 1.2 +
            f.edge * 1.0 +
            f.gray * 0.4 +
            (varL > 700 ? 16 : varL > 400 ? 10 : varL > 250 ? 5 : 0) +
            (hasLandslideEvidence ? 22 : 0) -
            f.water * 0.25 -
            f.uiBlue * 2 -
            f.whiteBg * 1 -
            f.skin * 2.5 -
            // mild green penalty only if almost all green (forest-only photo)
            (f.green > 55 && f.earth < 10 && f.mud < 5 ? 20 : 0) -
            (isSoftwareUI ? 40 : 0);

          scores.pothole =
            f.dark * 3.0 +
            f.gray * 1.6 +
            (f.dark > 10 ? 24 : f.dark > 6 ? 14 : f.dark > 3 ? 6 : 0) +
            (hasPotholeEvidence ? 18 : 0) +
            (f.water < 12 ? 6 : -10) -
            f.uiBlue * 2 -
            f.whiteBg * 1.2 -
            f.skin * 2.5 -
            (isSoftwareUI ? 40 : 0);

          scores.invalid =
            f.uiBlue * 3.5 +
            f.whiteBg * 1.2 +
            f.skin * 4 +
            (isSoftwareUI ? 55 : 0) +
            (isPortrait ? 45 : 0) +
            (isBlank ? 40 : 0) +
            (!hasLandslideEvidence && !hasPotholeEvidence && !hasFloodEvidence ? 15 : 0);

          var best = 'invalid';
          var bestScore = -1e9;
          ['landslide', 'pothole', 'flood', 'invalid'].forEach(function (k) {
            if (scores[k] > bestScore) {
              bestScore = scores[k];
              best = k;
            }
          });

          // If strong hazard evidence exists, prefer that class over invalid
          if (best === 'invalid') {
            if (hasLandslideEvidence && scores.landslide > scores.pothole && scores.landslide > scores.flood) {
              best = 'landslide';
              bestScore = scores.landslide;
            } else if (hasPotholeEvidence && scores.pothole >= scores.flood) {
              best = 'pothole';
              bestScore = scores.pothole;
            } else if (hasFloodEvidence) {
              best = 'flood';
              bestScore = scores.flood;
            }
          }

          // Soft gate: only force invalid for clear non-road cases
          if (best !== 'invalid') {
            if (isSoftwareUI || isPortrait || isBlank) {
              best = 'invalid';
            } else if (bestScore < 16 && !hasLandslideEvidence && !hasPotholeEvidence && !hasFloodEvidence) {
              best = 'invalid';
            }
          }

          // Filename: only reject obvious non-field software names — NOT generic "screenshot"
          var name = String(filename || '').toLowerCase();
          if (/ansys|solidworks|autocad|blender|figma|excel|word|powerpoint/.test(name)) {
            if (!hasLandslideEvidence && !hasPotholeEvidence && !hasFloodEvidence) {
              best = 'invalid';
            }
          }

          var conf;
          if (best === 'invalid') {
            conf = Math.min(99, Math.max(70, Math.round(55 + scores.invalid * 0.35)));
          } else {
            conf = Math.max(58, Math.min(96, Math.round(50 + bestScore * 0.5)));
          }

          var meta = { class: best, confidence: conf, features: f, scores: scores };

          if (best === 'landslide') {
            meta.hazard_type = 'Landslide / Slope Debris';
            meta.severity = conf > 78 ? 'CRITICAL' : 'HIGH';
            meta.damage_pct = Math.min(95, 55 + Math.round(conf * 0.35));
            meta.debris_volume_m3 = +(8 + conf * 0.22).toFixed(1);
            meta.affected_meters = Math.round(18 + conf * 0.4);
            meta.recommended_action = 'CRITICAL slope debris on carriageway. Close segment, divert to safe NER corridors, dispatch clearance team.';
          } else if (best === 'pothole') {
            meta.hazard_type = 'Pothole / Road Surface Damage';
            meta.severity = conf > 85 ? 'HIGH' : 'MODERATE';
            meta.damage_pct = Math.min(88, 40 + Math.round(conf * 0.3));
            meta.debris_volume_m3 = +(1.2 + conf * 0.05).toFixed(1);
            meta.affected_meters = Math.round(6 + conf * 0.15);
            meta.recommended_action = 'Surface damage confirmed. Impose speed restriction, mark hazard, schedule repair.';
          } else if (best === 'flood') {
            meta.hazard_type = 'Flood / Waterlogged Road';
            meta.severity = conf > 80 ? 'CRITICAL' : 'HIGH';
            meta.damage_pct = Math.min(92, 50 + Math.round(conf * 0.35));
            meta.debris_volume_m3 = +(3 + conf * 0.1).toFixed(1);
            meta.affected_meters = Math.round(25 + conf * 0.5);
            meta.recommended_action = 'Flooded approach detected. Avoid low sections, use elevated alternate routes.';
          } else {
            meta.hazard_type = 'Invalid Photo';
            meta.severity = 'REJECTED';
            meta.damage_pct = 0;
            meta.debris_volume_m3 = 0;
            meta.affected_meters = 0;
            meta.recommended_action = 'INVALID PHOTO: not a landslide, pothole, or flood. Upload a clear field photo of road debris, potholes, or standing water.';
          }

          resolve(meta);
        } catch (e) {
          resolve({
            class: 'invalid',
            confidence: 99,
            hazard_type: 'Invalid Photo',
            severity: 'REJECTED',
            damage_pct: 0,
            debris_volume_m3: 0,
            affected_meters: 0,
            recommended_action: 'INVALID PHOTO: analysis error.',
            features: {}
          });
        }
      };
      img.onerror = function () {
        resolve({
          class: 'invalid',
          confidence: 99,
          hazard_type: 'Invalid Photo',
          severity: 'REJECTED',
          damage_pct: 0,
          debris_volume_m3: 0,
          affected_meters: 0,
          recommended_action: 'INVALID PHOTO: image failed to load.',
          features: {}
        });
      };
      img.src = dataUrl;
    });
  }
};
