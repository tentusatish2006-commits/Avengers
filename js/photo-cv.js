/* SmartRoute Photo CV v19 — real flood (muddy brown water); soft filename rules */
(function (global) {
  function invalidMeta(conf, reason) {
    return {
      class: 'invalid', invalid: true, no_score: true, confidence: conf || 95,
      hazard_type: 'Invalid Photo', severity: 'REJECTED',
      damage_pct: null, risk_score: null,
      recommended_action: reason || 'Upload a real field photo of landslide, pothole, or flood only.',
      features: {}
    };
  }

  function classify(dataUrl, filename) {
    return new Promise(function (resolve) {
      var fn = (filename || '').toLowerCase();

      // Only CAD extensions — NOT generic "screenshot" (phones use that for real photos)
      if (/\.(dwg|dxf|psd|sldprt|catpart|prt)$/i.test(fn)) {
        return resolve(invalidMeta(99, 'CAD / software file — not a field photo. No risk score.'));
      }
      var softUiName = /ansys|solidworks|autocad|fusion360|blender/i.test(fn);

      var nameHint = null;
      if (/pothole|pot.?hole|crater|road.?hole/i.test(fn)) nameHint = 'pothole';
      else if (/flood|waterlog|inundat|submerged/i.test(fn)) nameHint = 'flood';
      else if (/landslide|debris|slope|mudslide|rockfall/i.test(fn)) nameHint = 'landslide';

      var img = new Image();
      img.onload = function () {
        try {
          var w = img.naturalWidth || img.width;
          var h = img.naturalHeight || img.height;
          if (w < 64 || h < 64) {
            return resolve(invalidMeta(95, 'Image too small. No risk score.'));
          }

          var canvas = document.createElement('canvas');
          var maxSide = 360;
          var scale = Math.min(1, maxSide / Math.max(w, h));
          canvas.width = Math.max(1, Math.round(w * scale));
          canvas.height = Math.max(1, Math.round(h * scale));
          var ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          var n = canvas.width * canvas.height;

          var B = 0, G = 0, D = 0, U = 0, GR = 0, WH = 0, MW = 0, ASP = 0, MUD = 0;
          var satSum = 0;
          var pureWhite = 0, pureGray = 0, pureBlueGray = 0, nearBlack = 0;

          for (var i = 0; i < data.length; i += 4) {
            var r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
            if (a < 20) continue;
            var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
            var sat = mx === 0 ? 0 : (mx - mn) / mx;
            satSum += sat;
            var lum = 0.299 * r + 0.587 * g + 0.114 * b;

            if (lum > 245) pureWhite++;
            if (lum < 18) nearBlack++;
            if (sat < 0.06 && lum > 40 && lum < 200) pureGray++;
            if (sat < 0.12 && b >= g && b >= r && lum > 90 && lum < 210) pureBlueGray++;

            if (lum < 48) D++;
            if (r > 95 && g > 55 && b < 95 && r > b + 25 && r >= g) B++;
            if (Math.abs(r - g) < 22 && Math.abs(g - b) < 22 && lum > 45 && lum < 175) G++;
            if (sat < 0.14 && lum > 30 && lum < 120 && Math.abs(r - g) < 18 && Math.abs(g - b) < 18) ASP++;
            if (b > r + 28 && b > g + 16 && lum > 50 && lum < 165 && sat > 0.18 && sat < 0.75) U++;
            if (g > r + 20 && g > b + 15 && g > 70) GR++;
            if (lum < 55 && sat < 0.28) WH++;
            // Muddy brown flood water
            if (r > 70 && g > 55 && b > 30 && b < 120 &&
                r >= g - 5 && r > b + 10 &&
                lum > 40 && lum < 150 && sat > 0.08 && sat < 0.55) {
              MUD++; MW++;
            }
          }

          function pct(x) { return (x / n) * 100; }
          B = pct(B); G = pct(G); D = pct(D); U = pct(U); GR = pct(GR);
          WH = pct(WH); MW = pct(MW); ASP = pct(ASP); MUD = pct(MUD);
          var avgSat = satSum / n;
          var pctWhite = pct(pureWhite);
          var pctGray = pct(pureGray);
          var pctBG = pct(pureBlueGray);
          var pctBlack = pct(nearBlack);

          var looksLikeUi = false;
          if (pctBG > 30 && avgSat < 0.16) looksLikeUi = true;
          if (pctGray > 40 && pctWhite > 10 && avgSat < 0.12) looksLikeUi = true;
          if (pctWhite > 15 && pctBlack > 10 && avgSat < 0.15 && B < 4 && MUD < 8) looksLikeUi = true;
          if (softUiName && looksLikeUi) {
            return resolve(invalidMeta(98, 'Invalid photo — software / CAD screenshot. No risk score.'));
          }
          if (looksLikeUi && MUD < 10 && U < 8 && B < 8) {
            return resolve(invalidMeta(98, 'Invalid photo — desktop / app UI screenshot. No risk score.'));
          }

          var scoreLand = 0, scoreFlood = 0, scorePot = 0;

          scoreLand += Math.min(55, B * 1.9);
          scoreLand += Math.min(12, D * 0.3);
          if (B > 14) scoreLand += 20;
          if (B > 22) scoreLand += 15;
          if (U > 10 || MUD > 20) scoreLand -= 12;

          // Flood = blue water OR muddy brown flood
          scoreFlood += Math.min(45, U * 2.0);
          scoreFlood += Math.min(50, MUD * 1.6);
          scoreFlood += Math.min(20, MW * 0.6);
          if (U > 10) scoreFlood += 15;
          if (MUD > 15) scoreFlood += 22;
          if (MUD > 25) scoreFlood += 15;
          if (U < 5 && MUD < 10) scoreFlood *= 0.25;
          if (pctBG > 20 && MUD < 10) scoreFlood = Math.max(0, scoreFlood - 45);

          scorePot += Math.min(45, ASP * 1.25);
          scorePot += Math.min(30, WH * 1.2);
          if (ASP > 20 && WH > 8) scorePot += 28;
          if (ASP > 24 && U < 12 && MUD < 12) scorePot += 12;

          if (ASP > 20 && ASP >= U && MUD < 12) scoreFlood = Math.max(0, scoreFlood - 30);
          if ((U > 18 || MUD > 20) && ASP < 12) scorePot = Math.max(0, scorePot - 15);

          if (nameHint === 'pothole') scorePot += 45;
          if (nameHint === 'flood') scoreFlood += 45;
          if (nameHint === 'landslide') scoreLand += 45;

          var best = 'invalid', bestScore = 0;
          if (scoreLand >= scoreFlood && scoreLand >= scorePot) {
            best = 'landslide'; bestScore = scoreLand;
          } else if (scoreFlood >= scoreLand && scoreFlood >= scorePot) {
            best = 'flood'; bestScore = scoreFlood;
          } else {
            best = 'pothole'; bestScore = scorePot;
          }

          if (MUD > 18 && scoreFlood >= 30) {
            best = 'flood';
            bestScore = Math.max(scoreFlood, 40);
          }

          if (best === 'flood' && U < 6 && MUD < 12 && pctBG > 15) {
            best = 'invalid'; bestScore = 0;
          }

          var MIN_SCORE = nameHint ? 32 : 38;
          var signalOk = false;
          if (best === 'landslide' && B >= 8) signalOk = true;
          if (best === 'flood' && (U >= 8 || MUD >= 12)) signalOk = true;
          if (best === 'pothole' && ASP >= 12 && WH >= 5) signalOk = true;
          if (nameHint && bestScore >= 32 && best === nameHint) signalOk = true;

          if (best === 'invalid' || bestScore < MIN_SCORE || !signalOk) {
            return resolve(invalidMeta(96, 'INVALID PHOTO — not a clear field landslide, pothole, or flood. Risk score not calculated.'));
          }

          var conf = Math.min(96, Math.round(55 + bestScore * 0.35));
          var features = {
            brown: +B.toFixed(1), gray: +G.toFixed(1), dark: +D.toFixed(1),
            blue: +U.toFixed(1), green: +GR.toFixed(1), wet_holes: +WH.toFixed(1),
            mud_water: +MW.toFixed(1), muddy_flood: +MUD.toFixed(1),
            asphalt: +ASP.toFixed(1), avg_sat: +avgSat.toFixed(3)
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
              risk_score: Math.min(94, Math.round(48 + Math.max(U, MUD * 0.8))),
              hazard_type: 'Flood', severity: 'CRITICAL',
              damage_pct: Math.min(92, Math.round(45 + Math.max(U, MUD * 0.7))),
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

  function analyze(imgOrUrl, filename) {
    var url = typeof imgOrUrl === 'string' ? imgOrUrl : (imgOrUrl && imgOrUrl.src) || '';
    return classify(url, filename);
  }

  var api = { version: 19, classify: classify, analyze: analyze };
  global.SmartRoutePhotoCV = api;
  global.PhotoCV = api;
})(typeof window !== 'undefined' ? window : this);
