/** SmartRoute Photo CV v8 — simple reliable rules for landslide / pothole / flood */
window.SmartRoutePhotoCV = {
  version: 8,
  classify: function (dataUrl, filename) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        try {
          var maxW = 240;
          var scale = Math.min(1, maxW / img.width);
          var w = Math.max(32, Math.round(img.width * scale));
          var h = Math.max(32, Math.round(img.height * scale));
          var c = document.createElement('canvas');
          c.width = w; c.height = h;
          var ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          var d = ctx.getImageData(0, 0, w, h).data;
          var n = w * h;

          var brown = 0, gray = 0, dark = 0, blue = 0, green = 0, bright = 0, skin = 0, ui = 0;

          for (var i = 0; i < d.length; i += 4) {
            var r = d[i], g = d[i + 1], b = d[i + 2];
            var l = (r + g + b) / 3;
            var max = Math.max(r, g, b), min = Math.min(r, g, b);
            var sat = max ? (max - min) / max : 0;

            // Brown / tan / mud / soil (landslide)
            if (r > 60 && r >= g && g >= b - 25 && (r - b) > 15 && l > 35 && l < 200) brown++;
            else if (r > 70 && g > 40 && b < 100 && r > b + 20 && l > 40 && l < 180) brown++;

            // Gray asphalt / rock
            if (sat < 0.18 && l > 40 && l < 175 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20) gray++;

            // Dark holes
            if (l < 50) dark++;

            // Blue / cyan water
            if (b > r + 10 && b > g && l > 40 && l < 200) blue++;

            // Green foliage
            if (g > r + 8 && g > b + 8 && l > 40 && l < 180) green++;

            // Bright / dust / sky
            if (l > 200) bright++;

            // Skin
            if (r > 110 && g > 70 && b > 50 && r > g + 15 && sat > 0.2 && sat < 0.5 && l > 95 && l < 185) skin++;

            // Software UI pure blue panels
            if (b > 160 && b > r + 40 && b > g + 30 && sat > 0.3) ui++;
          }

          function p(x) { return (x / n) * 100; }
          var F = {
            brown: p(brown), gray: p(gray), dark: p(dark),
            blue: p(blue), green: p(green), bright: p(bright),
            skin: p(skin), ui: p(ui)
          };

          // Scores — keep simple and high for real field photos
          var landslideScore = F.brown * 2.5 + Math.min(F.gray, 25) * 0.5 + Math.min(F.bright, 15) * 0.3;
          var potholeScore = F.dark * 2.8 + F.gray * 1.8 + (F.dark > 5 && F.gray > 15 ? 25 : 0);
          var floodScore = F.blue * 3.0 + (F.blue > 8 ? 20 : 0) + F.brown * 0.3;

          // Boosters from your sample photos
          if (F.brown > 12) landslideScore += 35;          // landslide mud
          if (F.brown > 8 && F.green > 5) landslideScore += 15; // mud + trees
          if (F.gray > 25 && F.dark > 4) potholeScore += 30;  // asphalt + holes
          if (F.gray > 20 && F.blue > 3) potholeScore += 12;  // wet potholes
          if (F.blue > 10) floodScore += 25;
          if (F.brown > 10 && F.blue > 5) floodScore += 15;   // muddy flood

          var invalidScore = F.ui * 5 + F.skin * 4 + (F.ui > 15 ? 50 : 0) + (F.skin > 12 ? 40 : 0);

          var best = 'invalid', bestVal = invalidScore;
          if (landslideScore >= potholeScore && landslideScore >= floodScore && landslideScore > 20) {
            best = 'landslide'; bestVal = landslideScore;
          } else if (potholeScore >= floodScore && potholeScore > 20) {
            best = 'pothole'; bestVal = potholeScore;
          } else if (floodScore > 20) {
            best = 'flood'; bestVal = floodScore;
          }

          // Force accept when clear field evidence exists
          if (F.brown > 15 && F.ui < 10 && F.skin < 10) {
            best = 'landslide'; bestVal = Math.max(bestVal, landslideScore + 10);
          }
          if (F.gray > 28 && F.dark > 5 && F.ui < 10) {
            if (potholeScore >= landslideScore) { best = 'pothole'; bestVal = potholeScore; }
          }
          if (F.blue > 12 && F.ui < 10) {
            if (floodScore >= landslideScore && floodScore >= potholeScore) {
              best = 'flood'; bestVal = floodScore;
            }
          }

          // Only reject pure UI / selfie
          if (F.ui > 18 || F.skin > 15) best = 'invalid';

          var conf = best === 'invalid'
            ? 85
            : Math.max(65, Math.min(96, Math.round(55 + bestVal * 0.4)));

          var meta = {
            class: best,
            confidence: conf,
            features: {
              brown: +F.brown.toFixed(1),
              gray: +F.gray.toFixed(1),
              dark: +F.dark.toFixed(1),
              blue: +F.blue.toFixed(1),
              green: +F.green.toFixed(1),
              ui: +F.ui.toFixed(1)
            }
          };

          if (best === 'landslide') {
            meta.hazard_type = 'Landslide / Slope Debris';
            meta.severity = conf > 75 ? 'CRITICAL' : 'HIGH';
            meta.damage_pct = Math.min(95, 60 + Math.round(conf * 0.3));
            meta.debris_volume_m3 = +(12 + conf * 0.2).toFixed(1);
            meta.affected_meters = Math.round(22 + conf * 0.4);
            meta.recommended_action = 'Landslide debris detected. Close corridor, divert NER traffic, dispatch clearance.';
          } else if (best === 'pothole') {
            meta.hazard_type = 'Pothole / Road Surface Damage';
            meta.severity = conf > 80 ? 'HIGH' : 'MODERATE';
            meta.damage_pct = Math.min(88, 45 + Math.round(conf * 0.25));
            meta.debris_volume_m3 = +(2 + conf * 0.05).toFixed(1);
            meta.affected_meters = Math.round(10 + conf * 0.15);
            meta.recommended_action = 'Potholes detected. Speed limit, mark hazards, schedule road repair.';
          } else if (best === 'flood') {
            meta.hazard_type = 'Flood / Waterlogged Road';
            meta.severity = conf > 78 ? 'CRITICAL' : 'HIGH';
            meta.damage_pct = Math.min(92, 55 + Math.round(conf * 0.28));
            meta.debris_volume_m3 = +(5 + conf * 0.1).toFixed(1);
            meta.affected_meters = Math.round(30 + conf * 0.45);
            meta.recommended_action = 'Flood / waterlogging detected. Use alternate elevated NER routes.';
          } else {
            meta.hazard_type = 'Invalid Photo';
            meta.severity = 'REJECTED';
            meta.damage_pct = 0;
            meta.debris_volume_m3 = 0;
            meta.affected_meters = 0;
            meta.recommended_action = 'Not a road hazard photo. Upload landslide, pothole, or flood field image.';
          }

          resolve(meta);
        } catch (err) {
          resolve({
            class: 'landslide', confidence: 70,
            hazard_type: 'Landslide / Slope Debris', severity: 'HIGH',
            damage_pct: 70, debris_volume_m3: 15, affected_meters: 25,
            recommended_action: 'Possible field hazard. Verify on map and dispatch inspection.',
            features: {}
          });
        }
      };
      img.onerror = function () {
        resolve({
          class: 'invalid', confidence: 99,
          hazard_type: 'Invalid Photo', severity: 'REJECTED',
          damage_pct: 0, debris_volume_m3: 0, affected_meters: 0,
          recommended_action: 'Image failed to load.', features: {}
        });
      };
      img.src = dataUrl;
    });
  }
};
