/* SmartRoute Photo CV v20
 * Rule: if image is SIMILAR to flood / landslide / pothole → risk score
 *       otherwise → invalid, no score
 */
(function (global) {
  function invalidMeta(reason) {
    return {
      class: 'invalid', invalid: true, no_score: true, confidence: 95,
      hazard_type: 'Invalid Photo', severity: 'REJECTED',
      damage_pct: null, risk_score: null,
      recommended_action: reason || 'Photo is not similar to flood, landslide, or pothole. No risk score.',
      features: {}
    };
  }

  function classify(dataUrl, filename) {
    return new Promise(function (resolve) {
      var fn = (filename || '').toLowerCase();
      if (/\.(dwg|dxf|psd|sldprt|catpart)$/i.test(fn)) {
        return resolve(invalidMeta('CAD file — not similar to a field hazard photo.'));
      }

      var nameHint = null;
      if (/pothole|pot.?hole|crater/i.test(fn)) nameHint = 'pothole';
      else if (/flood|waterlog|inundat/i.test(fn)) nameHint = 'flood';
      else if (/landslide|debris|mudslide|rockfall/i.test(fn)) nameHint = 'landslide';

      var img = new Image();
      img.onload = function () {
        try {
          var w = img.naturalWidth || img.width;
          var h = img.naturalHeight || img.height;
          if (w < 48 || h < 48) return resolve(invalidMeta('Image too small.'));

          var canvas = document.createElement('canvas');
          var maxSide = 320;
          var scale = Math.min(1, maxSide / Math.max(w, h));
          canvas.width = Math.max(1, Math.round(w * scale));
          canvas.height = Math.max(1, Math.round(h * scale));
          var ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          var n = canvas.width * canvas.height;

          var soil = 0, mud = 0, blueW = 0, asphalt = 0, holes = 0, green = 0;
          var uiGray = 0, uiWhite = 0, dark = 0, satSum = 0;

          for (var i = 0; i < data.length; i += 4) {
            var r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
            if (a < 20) continue;
            var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
            var sat = mx === 0 ? 0 : (mx - mn) / mx;
            satSum += sat;
            var lum = 0.299 * r + 0.587 * g + 0.114 * b;

            if (lum > 245) uiWhite++;
            if (sat < 0.07 && lum > 50 && lum < 190) uiGray++;
            if (lum < 45) dark++;

            if (r > 90 && g > 50 && b < 100 && r > b + 20 && r >= g - 8 && sat > 0.1) soil++;
            if (r > 65 && g > 50 && b > 25 && b < 125 && r >= g - 8 && r > b + 8 &&
                lum > 38 && lum < 155 && sat > 0.07 && sat < 0.55) mud++;
            if (b > r + 25 && b > g + 12 && lum > 45 && lum < 170 && sat > 0.15) blueW++;
            if (sat < 0.15 && lum > 28 && lum < 125 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20) asphalt++;
            if (lum < 50 && sat < 0.3) holes++;
            if (g > r + 18 && g > b + 12 && g > 65) green++;
          }

          function pct(x) { return (x / n) * 100; }
          soil = pct(soil); mud = pct(mud); blueW = pct(blueW);
          asphalt = pct(asphalt); holes = pct(holes); green = pct(green);
          uiGray = pct(uiGray); uiWhite = pct(uiWhite); dark = pct(dark);
          var avgSat = satSum / n;

          if (uiGray > 35 && uiWhite > 8 && avgSat < 0.12 && mud < 8 && soil < 8) {
            return resolve(invalidMeta('Not similar to flood, landslide, or pothole (looks like app UI).'));
          }
          if (avgSat < 0.05 && uiGray > 30) {
            return resolve(invalidMeta('Not similar to a field hazard photo.'));
          }

          var simFlood = 0;
          simFlood += Math.min(40, mud * 1.5);
          simFlood += Math.min(35, blueW * 2.0);
          if (mud > 12) simFlood += 20;
          if (mud > 20) simFlood += 15;
          if (blueW > 10) simFlood += 18;
          if (blueW > 18) simFlood += 12;
          if (mud < 6 && blueW < 5) simFlood *= 0.2;

          var simLand = 0;
          simLand += Math.min(50, soil * 2.0);
          simLand += Math.min(15, dark * 0.4);
          if (soil > 12) simLand += 20;
          if (soil > 20) simLand += 15;
          if (mud > 18 || blueW > 12) simLand -= 15;

          var simPot = 0;
          simPot += Math.min(40, asphalt * 1.3);
          simPot += Math.min(30, holes * 1.1);
          if (asphalt > 18 && holes > 8) simPot += 25;
          if (asphalt > 22 && mud < 12 && blueW < 10) simPot += 12;
          if (mud > 20 || blueW > 15) simPot -= 12;

          if (nameHint === 'flood') simFlood += 25;
          if (nameHint === 'landslide') simLand += 25;
          if (nameHint === 'pothole') simPot += 25;

          var best = 'invalid', bestSim = 0;
          if (simFlood >= simLand && simFlood >= simPot) {
            best = 'flood'; bestSim = simFlood;
          } else if (simLand >= simFlood && simLand >= simPot) {
            best = 'landslide'; bestSim = simLand;
          } else {
            best = 'pothole'; bestSim = simPot;
          }

          if (mud > 15 && simFlood >= 28) {
            best = 'flood';
            bestSim = Math.max(simFlood, 40);
          }

          var THRESHOLD = nameHint ? 30 : 36;
          var signalOk =
            (best === 'flood' && (mud >= 10 || blueW >= 7)) ||
            (best === 'landslide' && soil >= 8) ||
            (best === 'pothole' && asphalt >= 12 && holes >= 5);

          if (bestSim < THRESHOLD || !signalOk) {
            return resolve(invalidMeta(
              'Photo is not similar enough to flood, landslide, or pothole. No risk score.'
            ));
          }

          var conf = Math.min(96, Math.round(50 + bestSim * 0.4));
          var risk = Math.min(95, Math.round(35 + bestSim * 0.55));
          var features = {
            soil: +soil.toFixed(1), muddy_flood: +mud.toFixed(1), blue_water: +blueW.toFixed(1),
            asphalt: +asphalt.toFixed(1), holes: +holes.toFixed(1),
            sim_flood: +simFlood.toFixed(1), sim_landslide: +simLand.toFixed(1), sim_pothole: +simPot.toFixed(1)
          };

          if (best === 'flood') {
            return resolve({
              class: 'flood', invalid: false, no_score: false, confidence: conf, features: features,
              risk_score: risk, hazard_type: 'Flood', severity: risk > 70 ? 'CRITICAL' : 'HIGH',
              damage_pct: risk,
              recommended_action: 'Flood / waterlogging similar scene detected. Use elevated alternate NER routes.'
            });
          }
          if (best === 'landslide') {
            return resolve({
              class: 'landslide', invalid: false, no_score: false, confidence: conf, features: features,
              risk_score: risk, hazard_type: 'Landslide', severity: risk > 70 ? 'CRITICAL' : 'HIGH',
              damage_pct: risk,
              recommended_action: 'Landslide / debris similar scene detected. Close corridor and deploy clearance crew.'
            });
          }
          return resolve({
            class: 'pothole', invalid: false, no_score: false, confidence: conf, features: features,
            risk_score: Math.min(88, risk), hazard_type: 'Road Potholes', severity: 'HIGH',
            damage_pct: Math.min(85, risk),
            recommended_action: 'Pothole / road damage similar scene detected. Slow traffic and schedule repair.'
          });
        } catch (err) {
          console.warn('[PhotoCV]', err);
          resolve(invalidMeta('Could not analyze image. No risk score.'));
        }
      };
      img.onerror = function () {
        resolve(invalidMeta('Image failed to load. No risk score.'));
      };
      img.crossOrigin = 'anonymous';
      img.src = dataUrl;
    });
  }

  function analyze(imgOrUrl, filename) {
    var url = typeof imgOrUrl === 'string' ? imgOrUrl : (imgOrUrl && imgOrUrl.src) || '';
    return classify(url, filename);
  }

  var api = { version: 20, classify: classify, analyze: analyze };
  global.SmartRoutePhotoCV = api;
  global.PhotoCV = api;
})(typeof window !== 'undefined' ? window : this);
