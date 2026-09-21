/* SmartRoute Photo CV v15 — better pothole vs flood vs landslide */
(function (global) {
  function classify(dataUrl, filename) {
    return new Promise(function (resolve) {
      var fn = (filename || '').toLowerCase();
      if (/\.(dwg|dxf|psd)$/i.test(fn) || /screenshot.*(ui|cad)/i.test(fn)) {
        return resolve(invalidMeta(99, 'Software / CAD UI file detected from filename.'));
      }
      var nameHint = null;
      if (/pothole|pot.?hole|road.?damage|crater|asphalt/i.test(fn)) nameHint = 'pothole';
      else if (/flood|waterlog|inundat|submerged/i.test(fn)) nameHint = 'flood';
      else if (/landslide|debris|slope|mudslide/i.test(fn)) nameHint = 'landslide';

      var img = new Image();
      img.onload = function () {
        try {
          var w = img.naturalWidth || img.width;
          var h = img.naturalHeight || img.height;
          if (w < 40 || h < 40) return resolve(invalidMeta(95, 'Image too small.'));
          var canvas = document.createElement('canvas');
          var maxSide = 360;
          var scale = Math.min(1, maxSide / Math.max(w, h));
          canvas.width = Math.max(1, Math.round(w * scale));
          canvas.height = Math.max(1, Math.round(h * scale));
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          var n = canvas.width * canvas.height;

          var B = 0, G = 0, D = 0, U = 0, GR = 0, WH = 0, MW = 0, ASP = 0, satSum = 0;
          for (var i = 0; i < data.length; i += 4) {
            var r = data[i], g = data[i + 1], b = data[i + 2];
            var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
            var sat = mx === 0 ? 0 : (mx - mn) / mx;
            satSum += sat;
            var lum = 0.299 * r + 0.587 * g + 0.114 * b;
            if (lum < 55) D++;
            if (r > 90 && g > 55 && b < 95 && r > b + 18 && r >= g) B++;
            if (Math.abs(r - g) < 28 && Math.abs(g - b) < 28 && lum > 35 && lum < 190) G++;
            if (sat < 0.18 && lum > 30 && lum < 140 && Math.abs(r - g) < 22 && Math.abs(g - b) < 22) ASP++;
            if (b > r + 22 && b > g + 12 && lum > 40 && lum < 170 && sat > 0.12) U++;
            if (g > r + 15 && g > b + 10) GR++;
            if (lum < 65 && sat < 0.35 && (b > 35 || r > 35)) WH++;
            if (r > 65 && g > 50 && b > 35 && b < 115 && lum < 135 && sat > 0.1 && sat < 0.45) MW++;
          }
          function pct(x) { return (x / n) * 100; }
          B = pct(B); G = pct(G); D = pct(D); U = pct(U); GR = pct(GR);
          WH = pct(WH); MW = pct(MW); ASP = pct(ASP);
          var avgSat = satSum / n;

          if (avgSat < 0.035 && G > 60) {
            return resolve(invalidMeta(92, 'Looks like a software UI or blank image.'));
          }

          var scoreLand = 0, scoreFlood = 0, scorePot = 0;
          scoreLand += Math.min(45, B * 1.35);
          scoreLand += Math.min(20, D * 0.45);
          scoreLand += Math.min(12, Math.max(0, 12 - U));

          scoreFlood += Math.min(35, U * 1.5);
          scoreFlood += Math.min(25, MW * 0.9);
          if (U < 6) scoreFlood *= 0.45;
          if (U > 12) scoreFlood += 18;
          if (U > 20) scoreFlood += 15;

          scorePot += Math.min(40, ASP * 1.1);
          scorePot += Math.min(35, WH * 1.4);
          scorePot += Math.min(20, G * 0.45);
          scorePot += Math.min(15, D * 0.35);
          if (WH > 6 && ASP > 12) scorePot += 28;
          if (WH > 10 && U < 18) scorePot += 18;
          if (ASP > 18 && ASP > U) scorePot += 22;
          if (ASP > 25 && U < 15) scorePot += 15;

          if (B > 12 && U < 10) { scoreLand += 18; scoreFlood = Math.max(0, scoreFlood - 22); }
          if (ASP > 20 && U < 14) { scoreFlood = Math.max(0, scoreFlood - 30); scorePot += 12; }
          if (U > 22 && ASP < 10) { scoreFlood += 20; scorePot = Math.max(0, scorePot - 15); }
          if (U >= 5 && U <= 18 && ASP > 15 && WH > 5) {
            scorePot += 25;
            scoreFlood = Math.max(0, scoreFlood - 20);
          }

          if (nameHint === 'pothole') scorePot += 35;
          if (nameHint === 'flood') scoreFlood += 35;
          if (nameHint === 'landslide') scoreLand += 35;

          var best = 'pothole', bestScore = scorePot;
          if (scoreLand >= scorePot && scoreLand >= scoreFlood) { best = 'landslide'; bestScore = scoreLand; }
          else if (scoreFlood >= scoreLand && scoreFlood >= scorePot) { best = 'flood'; bestScore = scoreFlood; }
          else { best = 'pothole'; bestScore = scorePot; }

          if (best === 'flood' && ASP > U + 5 && ASP > 15) {
            best = 'pothole'; bestScore = scorePot;
          }
          if (best === 'flood' && U < 14 && (ASP > 12 || G > 25)) {
            best = 'pothole'; bestScore = Math.max(scorePot, 28);
          }

          var TH = 18;
          if (bestScore < TH) {
            if (scoreLand >= 12 || scorePot >= 12 || scoreFlood >= 12) {
              bestScore = Math.max(scoreLand, scorePot, scoreFlood);
              if (scoreFlood >= scoreLand && scoreFlood >= scorePot) best = 'flood';
              else if (scorePot >= scoreLand) best = 'pothole';
              else best = 'landslide';
              if (best === 'flood' && ASP > U + 3 && ASP > 12) best = 'pothole';
            } else {
              return resolve(invalidMeta(88, 'INVALID PHOTO — not a clear landslide, pothole, or flood.'));
            }
          }

          var conf = Math.min(96, Math.round(55 + bestScore * 0.35));
          var features = {
            brown: +B.toFixed(1), gray: +G.toFixed(1), dark: +D.toFixed(1),
            blue: +U.toFixed(1), green: +GR.toFixed(1), wet_holes: +WH.toFixed(1),
            mud_water: +MW.toFixed(1), asphalt: +ASP.toFixed(1)
          };

          if (best === 'landslide') {
            resolve({ class: 'landslide', confidence: conf, features: features, risk_score: Math.min(95, Math.round(55 + B + D / 2)), no_score: false, hazard_type: 'Landslide Debris', severity: 'CRITICAL', damage_pct: Math.min(95, Math.round(55 + B)), debris_volume_m3: +(8 + B / 3).toFixed(1), affected_meters: Math.round(20 + B), recommended_action: 'Landslide debris detected. Close corridor and deploy clearance crew.' });
          } else if (best === 'flood') {
            resolve({ class: 'flood', confidence: conf, features: features, risk_score: Math.min(92, Math.round(50 + U + MW / 2)), no_score: false, hazard_type: 'Flood / Waterlogged Road', severity: 'CRITICAL', damage_pct: Math.min(90, Math.round(45 + U + MW / 2)), debris_volume_m3: +(4 + (U + MW) / 4).toFixed(1), affected_meters: Math.round(25 + U + MW / 2), recommended_action: 'Flood / waterlogging detected. Use elevated alternate NER routes.' });
          } else {
            resolve({ class: 'pothole', confidence: conf, features: features, risk_score: Math.min(88, Math.round(40 + ASP / 2 + WH)), no_score: false, hazard_type: 'Road Potholes / Surface Damage', severity: 'HIGH', damage_pct: Math.min(85, Math.round(35 + ASP / 2 + WH)), debris_volume_m3: +(1 + WH / 5).toFixed(1), affected_meters: Math.round(12 + G / 2), recommended_action: 'Potholes / surface damage detected. Slow traffic and schedule patch repair.' });
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

  function invalidMeta(conf, reason) {
    return { class: 'invalid', invalid: true, confidence: conf || 90, hazard_type: 'Invalid Photo', severity: 'REJECTED', damage_pct: 0, debris_volume_m3: 0, affected_meters: 0, recommended_action: reason || 'Upload only landslide, pothole, or flood field photos.', features: {}, risk_score: null, no_score: true };
  }

  function analyze(imgOrUrl, filename) {
    var url = typeof imgOrUrl === 'string' ? imgOrUrl : (imgOrUrl && imgOrUrl.src) || '';
    return classify(url, filename);
  }

  var api = { version: 15, classify: classify, analyze: analyze };
  global.SmartRoutePhotoCV = api;
  global.PhotoCV = api;
})(typeof window !== 'undefined' ? window : this);
