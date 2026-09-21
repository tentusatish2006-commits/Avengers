/* SmartRoute Photo CV v16 — strict invalid (no score); distinct flood/landslide/pothole */
(function (global) {
  function classify(dataUrl, filename) {
    return new Promise(function (resolve) {
      var fn = (filename || '').toLowerCase();
      if (/\.(dwg|dxf|psd)$/i.test(fn)) {
        return resolve(invalidMeta(99, 'Software / CAD file — not a field photo.'));
      }
      var nameHint = null;
      if (/pothole|pot.?hole|crater|asphalt.?damage|road.?hole/i.test(fn)) nameHint = 'pothole';
      else if (/flood|waterlog|inundat|submerged|overflow/i.test(fn)) nameHint = 'flood';
      else if (/landslide|debris|slope|mudslide|rockfall/i.test(fn)) nameHint = 'landslide';

      var img = new Image();
      img.onload = function () {
        try {
          var w = img.naturalWidth || img.width;
          var h = img.naturalHeight || img.height;
          if (w < 48 || h < 48) return resolve(invalidMeta(95, 'Image too small for analysis.'));

          var canvas = document.createElement('canvas');
          var maxSide = 360;
          var scale = Math.min(1, maxSide / Math.max(w, h));
          canvas.width = Math.max(1, Math.round(w * scale));
          canvas.height = Math.max(1, Math.round(h * scale));
          var ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          var n = canvas.width * canvas.height;

          var B = 0, G = 0, D = 0, U = 0, GR = 0, WH = 0, MW = 0, ASP = 0;
          var satSum = 0, lumSum = 0;

          for (var i = 0; i < data.length; i += 4) {
            var r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
            if (a < 20) continue;
            var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
            var sat = mx === 0 ? 0 : (mx - mn) / mx;
            satSum += sat;
            var lum = 0.299 * r + 0.587 * g + 0.114 * b;
            lumSum += lum;
            if (lum < 50) D++;
            if (r > 85 && g > 50 && b < 100 && r > b + 20 && r >= g - 5) B++;
            if (Math.abs(r - g) < 25 && Math.abs(g - b) < 25 && lum > 40 && lum < 185) G++;
            if (sat < 0.16 && lum > 28 && lum < 130 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20) ASP++;
            if (b > r + 25 && b > g + 15 && lum > 45 && lum < 175 && sat > 0.15) U++;
            if (g > r + 18 && g > b + 12 && g > 60) GR++;
            if (lum < 58 && sat < 0.32) WH++;
            if (r > 60 && g > 48 && b > 40 && b < 120 && lum < 130 && sat > 0.12 && sat < 0.5) MW++;
          }

          function pct(x) { return (x / n) * 100; }
          B = pct(B); G = pct(G); D = pct(D); U = pct(U); GR = pct(GR);
          WH = pct(WH); MW = pct(MW); ASP = pct(ASP);
          var avgSat = satSum / n;

          if (avgSat < 0.04 && G > 55) {
            return resolve(invalidMeta(93, 'Not a field hazard photo (looks blank or UI).'));
          }

          var scoreLand = 0, scoreFlood = 0, scorePot = 0;

          scoreLand += Math.min(50, B * 1.5);
          scoreLand += Math.min(18, D * 0.4);
          if (B > 8) scoreLand += 12;
          if (B > 15) scoreLand += 15;
          if (U > 12) scoreLand -= 10;

          scoreFlood += Math.min(45, U * 1.8);
          scoreFlood += Math.min(22, MW * 0.85);
          if (U > 8) scoreFlood += 15;
          if (U > 15) scoreFlood += 20;
          if (U > 25) scoreFlood += 15;
          if (U < 5) scoreFlood *= 0.3;

          scorePot += Math.min(42, ASP * 1.15);
          scorePot += Math.min(30, WH * 1.2);
          scorePot += Math.min(18, G * 0.4);
          if (ASP > 15 && WH > 5) scorePot += 25;
          if (ASP > 20 && U < 16) scorePot += 18;
          if (WH > 8 && U <= 14 && ASP > 10) scorePot += 22;

          if (ASP > 18 && ASP >= U) {
            scoreFlood = Math.max(0, scoreFlood - 28);
            scorePot += 10;
          }
          if (U > 20 && ASP < 12) {
            scoreFlood += 18;
            scorePot = Math.max(0, scorePot - 12);
          }
          if (B > 14 && U < 10 && ASP < 20) {
            scoreLand += 16;
            scoreFlood = Math.max(0, scoreFlood - 12);
          }
          if (U >= 4 && U <= 16 && ASP > 14 && WH > 6) {
            scorePot += 28;
            scoreFlood = Math.max(0, scoreFlood - 25);
          }

          if (nameHint === 'pothole') scorePot += 40;
          if (nameHint === 'flood') scoreFlood += 40;
          if (nameHint === 'landslide') scoreLand += 40;

          var best = 'invalid';
          var bestScore = 0;
          if (scoreLand >= scoreFlood && scoreLand >= scorePot) {
            best = 'landslide'; bestScore = scoreLand;
          } else if (scoreFlood >= scoreLand && scoreFlood >= scorePot) {
            best = 'flood'; bestScore = scoreFlood;
          } else {
            best = 'pothole'; bestScore = scorePot;
          }

          if (best === 'flood' && ASP > U + 4 && ASP > 14) {
            best = 'pothole'; bestScore = scorePot;
          }
          if (best === 'flood' && U < 10) {
            if (scorePot >= 25) { best = 'pothole'; bestScore = scorePot; }
            else if (scoreLand >= 25) { best = 'landslide'; bestScore = scoreLand; }
          }

          var MIN_SCORE = nameHint ? 22 : 28;
          if (bestScore < MIN_SCORE) {
            return resolve(invalidMeta(90, 'INVALID PHOTO — not a clear landslide, pothole, or flood field photo. No risk score.'));
          }

          var conf = Math.min(96, Math.round(52 + bestScore * 0.4));
          var features = {
            brown: +B.toFixed(1), gray: +G.toFixed(1), dark: +D.toFixed(1),
            blue: +U.toFixed(1), green: +GR.toFixed(1), wet_holes: +WH.toFixed(1),
            mud_water: +MW.toFixed(1), asphalt: +ASP.toFixed(1)
          };

          if (best === 'landslide') {
            return resolve({
              class: 'landslide', invalid: false, no_score: false, confidence: conf, features: features,
              risk_score: Math.min(95, Math.round(50 + B * 1.2 + D * 0.3)),
              hazard_type: 'Landslide', severity: 'CRITICAL',
              damage_pct: Math.min(95, Math.round(50 + B)),
              recommended_action: 'Landslide debris on corridor. Close road and deploy clearance crew.'
            });
          }
          if (best === 'flood') {
            return resolve({
              class: 'flood', invalid: false, no_score: false, confidence: conf, features: features,
              risk_score: Math.min(94, Math.round(48 + U * 1.1 + MW * 0.4)),
              hazard_type: 'Flood', severity: 'CRITICAL',
              damage_pct: Math.min(92, Math.round(45 + U)),
              recommended_action: 'Flood / waterlogging. Use elevated alternate NER routes.'
            });
          }
          return resolve({
            class: 'pothole', invalid: false, no_score: false, confidence: conf, features: features,
            risk_score: Math.min(88, Math.round(38 + ASP * 0.6 + WH * 0.8)),
            hazard_type: 'Road Potholes', severity: 'HIGH',
            damage_pct: Math.min(85, Math.round(35 + ASP * 0.5 + WH)),
            recommended_action: 'Potholes / surface damage. Slow traffic and schedule repair.'
          });
        } catch (err) {
          console.warn('[PhotoCV]', err);
          resolve(invalidMeta(90, 'Could not analyze image. No risk score.'));
        }
      };
      img.onerror = function () {
        resolve(invalidMeta(99, 'Image failed to load. No risk score.'));
      };
      img.crossOrigin = 'anonymous';
      img.src = dataUrl;
    });
  }

  function invalidMeta(conf, reason) {
    return {
      class: 'invalid', invalid: true, no_score: true, confidence: conf || 90,
      hazard_type: 'Invalid Photo', severity: 'REJECTED',
      damage_pct: null, risk_score: null,
      recommended_action: reason || 'Upload a clear landslide, pothole, or flood field photo.',
      features: {}
    };
  }

  function analyze(imgOrUrl, filename) {
    var url = typeof imgOrUrl === 'string' ? imgOrUrl : (imgOrUrl && imgOrUrl.src) || '';
    return classify(url, filename);
  }

  var api = { version: 16, classify: classify, analyze: analyze };
  global.SmartRoutePhotoCV = api;
  global.PhotoCV = api;
})(typeof window !== 'undefined' ? window : this);
