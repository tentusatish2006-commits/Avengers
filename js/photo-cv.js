/* SmartRoute Photo CV v14 — landslide / pothole / flood */
(function (global) {
  function classify(dataUrl, filename) {
    return new Promise(function (resolve) {
      var fn = (filename || '').toLowerCase();
      if (/\.(dwg|dxf|psd)$/i.test(fn) || /screenshot.*(ui|cad)/i.test(fn)) {
        return resolve(invalidMeta(99, 'Software / CAD UI file detected from filename.'));
      }
      var img = new Image();
      img.onload = function () {
        try {
          var w = img.naturalWidth || img.width;
          var h = img.naturalHeight || img.height;
          if (w < 40 || h < 40) return resolve(invalidMeta(95, 'Image too small.'));
          var canvas = document.createElement('canvas');
          var maxSide = 320;
          var scale = Math.min(1, maxSide / Math.max(w, h));
          canvas.width = Math.max(1, Math.round(w * scale));
          canvas.height = Math.max(1, Math.round(h * scale));
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          var n = canvas.width * canvas.height;
          var B = 0, G = 0, D = 0, U = 0, GR = 0, WH = 0, MW = 0, satSum = 0;
          for (var i = 0; i < data.length; i += 4) {
            var r = data[i], g = data[i + 1], b = data[i + 2];
            var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
            var sat = mx === 0 ? 0 : (mx - mn) / mx;
            satSum += sat;
            var lum = 0.299 * r + 0.587 * g + 0.114 * b;
            if (lum < 55) D++;
            if (r > 90 && g > 60 && b < 90 && r > b + 20) B++;
            if (Math.abs(r - g) < 25 && Math.abs(g - b) < 25 && lum > 40 && lum < 180) G++;
            if (b > r + 15 && b > g + 10 && lum < 160) U++;
            if (g > r + 15 && g > b + 10) GR++;
            if (lum < 70 && sat < 0.25 && (b > 40 || r > 40)) WH++;
            if (r > 70 && g > 55 && b > 40 && b < 120 && lum < 140 && sat > 0.12) MW++;
          }
          function pct(x) { return (x / n) * 100; }
          B = pct(B); G = pct(G); D = pct(D); U = pct(U); GR = pct(GR); WH = pct(WH); MW = pct(MW);
          var avgSat = satSum / n;
          if (avgSat < 0.04 && G > 55) {
            return resolve(invalidMeta(92, 'Looks like a software UI or blank image — not a field hazard photo.'));
          }
          var scoreLand = 0, scoreFlood = 0, scorePot = 0;
          scoreLand += Math.min(40, B * 1.2);
          scoreLand += Math.min(25, D * 0.6);
          scoreLand += Math.min(15, Math.max(0, 20 - U));
          scoreFlood += Math.min(40, U * 1.4);
          scoreFlood += Math.min(30, MW * 1.1);
          scoreFlood += Math.min(15, Math.max(0, 15 - B * 0.3));
          scorePot += Math.min(35, G * 0.7);
          scorePot += Math.min(30, WH * 1.5);
          scorePot += Math.min(20, D * 0.4);
          if (MW > 8 && U > 4) scoreFlood += 20;
          if (U > 15) scoreFlood += 20;
          if (U > 25) scoreFlood += 15;
          if (B > 10 && U < 8) { scoreLand += 20; scoreFlood = Math.max(0, scoreFlood - 20); }
          if (U > 20) { scoreFlood += 25; scoreLand = Math.max(0, scoreLand - 15); }
          if (G > 40 && WH > 8 && B < 5) scorePot += 25;

          var TH = 22;
          var best = 'invalid', bestScore = 0;
          if (scoreLand >= scorePot && scoreLand >= scoreFlood) { best = 'landslide'; bestScore = scoreLand; }
          else if (scoreFlood >= scoreLand && scoreFlood >= scorePot) { best = 'flood'; bestScore = scoreFlood; }
          else { best = 'pothole'; bestScore = scorePot; }

          if (bestScore < TH) {
            if (scoreLand >= 15 || scorePot >= 15 || scoreFlood >= 15) {
              if (scoreFlood >= scoreLand && scoreFlood >= scorePot) best = 'flood';
              else if (scorePot >= scoreLand) best = 'pothole';
              else best = 'landslide';
              bestScore = Math.max(scoreLand, scorePot, scoreFlood);
            } else {
              return resolve(invalidMeta(88, 'INVALID PHOTO — not a clear landslide, pothole, or flood.'));
            }
          }

          var conf = Math.min(96, Math.round(55 + bestScore * 0.35));
          var features = { brown: +B.toFixed(1), gray: +G.toFixed(1), dark: +D.toFixed(1), blue: +U.toFixed(1), green: +GR.toFixed(1), wet_holes: +WH.toFixed(1), mud_water: +MW.toFixed(1) };

          if (best === 'landslide') {
            resolve({ class: 'landslide', confidence: conf, features: features, risk_score: Math.min(95, Math.round(55 + B + D / 2)), no_score: false, hazard_type: 'Landslide Debris', severity: 'CRITICAL', damage_pct: Math.min(95, Math.round(55 + B)), debris_volume_m3: +(8 + B / 3).toFixed(1), affected_meters: Math.round(20 + B), recommended_action: 'Landslide debris detected. Close corridor and deploy clearance crew.' });
          } else if (best === 'flood') {
            resolve({ class: 'flood', confidence: conf, features: features, risk_score: Math.min(92, Math.round(50 + U + MW / 2)), no_score: false, hazard_type: 'Flood / Waterlogged Road', severity: 'CRITICAL', damage_pct: Math.min(90, Math.round(45 + U + MW / 2)), debris_volume_m3: +(4 + (U + MW) / 4).toFixed(1), affected_meters: Math.round(25 + U + MW / 2), recommended_action: 'Flood / waterlogging detected. Use elevated alternate NER routes.' });
          } else {
            resolve({ class: 'pothole', confidence: conf, features: features, risk_score: Math.min(88, Math.round(40 + G / 2 + D)), no_score: false, hazard_type: 'Road Potholes / Surface Damage', severity: 'HIGH', damage_pct: Math.min(85, Math.round(35 + G / 2 + WH)), debris_volume_m3: +(1 + WH / 5).toFixed(1), affected_meters: Math.round(12 + G / 2), recommended_action: 'Potholes / surface damage detected. Slow traffic and schedule patch repair.' });
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

  var api = { version: 14, classify: classify, analyze: analyze };
  global.SmartRoutePhotoCV = api;
  global.PhotoCV = api;
})(typeof window !== 'undefined' ? window : this);
