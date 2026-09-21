/* SmartRoute Photo CV v17 — invalid photos get NO risk score */
(function (global) {
  function classify(dataUrl, filename) {
    return new Promise(function (resolve) {
      var fn = (filename || '').toLowerCase();
      if (/\.(dwg|dxf|psd)$/i.test(fn)) {
        return resolve(invalidMeta(99, 'Not a field photo.'));
      }
      var nameHint = null;
      if (/pothole|pot.?hole|crater|road.?hole/i.test(fn)) nameHint = 'pothole';
      else if (/flood|waterlog|inundat|submerged/i.test(fn)) nameHint = 'flood';
      else if (/landslide|debris|slope|mudslide|rockfall/i.test(fn)) nameHint = 'landslide';

      var img = new Image();
      img.onload = function () {
        try {
          var w = img.naturalWidth || img.width;
          var h = img.naturalHeight || img.height;
          if (w < 64 || h < 64) return resolve(invalidMeta(95, 'Image too small. No risk score.'));

          var canvas = document.createElement('canvas');
          var maxSide = 320;
          var scale = Math.min(1, maxSide / Math.max(w, h));
          canvas.width = Math.max(1, Math.round(w * scale));
          canvas.height = Math.max(1, Math.round(h * scale));
          var ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          var n = canvas.width * canvas.height;

          var B = 0, G = 0, D = 0, U = 0, GR = 0, WH = 0, MW = 0, ASP = 0, satSum = 0;

          for (var i = 0; i < data.length; i += 4) {
            var r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
            if (a < 20) continue;
            var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
            var sat = mx === 0 ? 0 : (mx - mn) / mx;
            satSum += sat;
            var lum = 0.299 * r + 0.587 * g + 0.114 * b;
            if (lum < 48) D++;
            if (r > 95 && g > 55 && b < 95 && r > b + 25 && r >= g) B++;
            if (Math.abs(r - g) < 22 && Math.abs(g - b) < 22 && lum > 45 && lum < 175) G++;
            if (sat < 0.14 && lum > 30 && lum < 120 && Math.abs(r - g) < 18 && Math.abs(g - b) < 18) ASP++;
            if (b > r + 30 && b > g + 18 && lum > 50 && lum < 165 && sat > 0.18) U++;
            if (g > r + 20 && g > b + 15 && g > 70) GR++;
            if (lum < 55 && sat < 0.28) WH++;
            if (r > 70 && g > 55 && b > 45 && b < 110 && lum < 120 && sat > 0.14 && sat < 0.48) MW++;
          }

          function pct(x) { return (x / n) * 100; }
          B = pct(B); G = pct(G); D = pct(D); U = pct(U); GR = pct(GR);
          WH = pct(WH); MW = pct(MW); ASP = pct(ASP);
          var avgSat = satSum / n;

          if (avgSat < 0.05 && G > 50) {
            return resolve(invalidMeta(94, 'Invalid photo — looks blank or UI. No risk score.'));
          }
          if (GR > 45 && B < 6 && U < 5 && WH < 8) {
            return resolve(invalidMeta(92, 'Invalid photo — not a road hazard scene. No risk score.'));
          }

          var scoreLand = 0, scoreFlood = 0, scorePot = 0;
          scoreLand += Math.min(55, B * 1.8);
          scoreLand += Math.min(15, D * 0.35);
          if (B > 12) scoreLand += 18;
          if (B > 20) scoreLand += 15;
          if (U > 10) scoreLand -= 15;

          scoreFlood += Math.min(50, U * 2.0);
          scoreFlood += Math.min(20, MW * 0.8);
          if (U > 10) scoreFlood += 20;
          if (U > 18) scoreFlood += 18;
          if (U < 6) scoreFlood *= 0.2;

          scorePot += Math.min(45, ASP * 1.2);
          scorePot += Math.min(32, WH * 1.25);
          if (ASP > 18 && WH > 8) scorePot += 30;
          if (ASP > 22 && U < 12) scorePot += 15;
          if (WH > 10 && ASP > 12 && U <= 14) scorePot += 20;

          if (ASP > 20 && ASP >= U) scoreFlood = Math.max(0, scoreFlood - 35);
          if (U > 22 && ASP < 10) scorePot = Math.max(0, scorePot - 20);
          if (B > 16 && U < 8) scoreFlood = Math.max(0, scoreFlood - 15);
          if (U >= 4 && U <= 14 && ASP > 16 && WH > 8) {
            scorePot += 25;
            scoreFlood = Math.max(0, scoreFlood - 30);
          }

          if (nameHint === 'pothole') scorePot += 45;
          if (nameHint === 'flood') scoreFlood += 45;
          if (nameHint === 'landslide') scoreLand += 45;

          var best = 'invalid';
          var bestScore = 0;
          if (scoreLand >= scoreFlood && scoreLand >= scorePot) {
            best = 'landslide'; bestScore = scoreLand;
          } else if (scoreFlood >= scoreLand && scoreFlood >= scorePot) {
            best = 'flood'; bestScore = scoreFlood;
          } else {
            best = 'pothole'; bestScore = scorePot;
          }

          if (best === 'flood' && (ASP > U + 3 || U < 8)) {
            if (scorePot >= 30) { best = 'pothole'; bestScore = scorePot; }
            else if (scoreLand >= 30) { best = 'landslide'; bestScore = scoreLand; }
            else { best = 'invalid'; bestScore = 0; }
          }

          var MIN_SCORE = nameHint ? 35 : 42;
          var signalOk = false;
          if (best === 'landslide' && B >= 8) signalOk = true;
          if (best === 'flood' && U >= 8) signalOk = true;
          if (best === 'pothole' && (ASP >= 12 || WH >= 8)) signalOk = true;
          if (nameHint && bestScore >= 35) signalOk = true;

          if (bestScore < MIN_SCORE || !signalOk || best === 'invalid') {
            return resolve(invalidMeta(91, 'INVALID PHOTO — not a clear landslide, pothole, or flood. Risk score not calculated.'));
          }

          var conf = Math.min(96, Math.round(55 + bestScore * 0.35));
          var features = {
            brown: +B.toFixed(1), gray: +G.toFixed(1), dark: +D.toFixed(1),
            blue: +U.toFixed(1), green: +GR.toFixed(1), wet_holes: +WH.toFixed(1),
            mud_water: +MW.toFixed(1), asphalt: +ASP.toFixed(1)
          };

          if (best === 'landslide') {
            return resolve({
              class: 'landslide', invalid: false, no_score: false, confidence: conf, features: features,
              risk_score: Math.min(95, Math.round(52 + B * 1.1)),
              hazard_type: 'Landslide', severity: 'CRITICAL',
              damage_pct: Math.min(95, Math.round(50 + B)),
              recommended_action: 'Landslide debris detected. Close corridor and deploy clearance crew.'
            });
          }
          if (best === 'flood') {
            return resolve({
              class: 'flood', invalid: false, no_score: false, confidence: conf, features: features,
              risk_score: Math.min(94, Math.round(50 + U * 1.0)),
              hazard_type: 'Flood', severity: 'CRITICAL',
              damage_pct: Math.min(92, Math.round(45 + U)),
              recommended_action: 'Flood / waterlogging. Use elevated alternate NER routes.'
            });
          }
          return resolve({
            class: 'pothole', invalid: false, no_score: false, confidence: conf, features: features,
            risk_score: Math.min(88, Math.round(40 + ASP * 0.5 + WH * 0.7)),
            hazard_type: 'Road Potholes', severity: 'HIGH',
            damage_pct: Math.min(85, Math.round(35 + ASP * 0.4 + WH)),
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

  var api = { version: 17, classify: classify, analyze: analyze };
  global.SmartRoutePhotoCV = api;
  global.PhotoCV = api;
})(typeof window !== 'undefined' ? window : this);
