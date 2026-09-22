/* SmartRoute Photo CV v21
 * Landslide = brown soil/debris  |  Flood = water surface (muddy or blue)
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
        return resolve(invalidMeta('CAD file — not a field hazard photo.'));
      }

      var nameHint = null;
      if (/pothole|pot.?hole|crater/i.test(fn)) nameHint = 'pothole';
      else if (/flood|waterlog|inundat/i.test(fn)) nameHint = 'flood';
      else if (/landslide|debris|mudslide|rockfall|slope/i.test(fn)) nameHint = 'landslide';

      var img = new Image();
      img.onload = function () {
        try {
          var w = img.naturalWidth || img.width;
          var h = img.naturalHeight || img.height;
          if (w < 48 || h < 48) return resolve(invalidMeta('Image too small.');

          var canvas = document.createElement('canvas');
          var maxSide = 320;
          var scale = Math.min(1, maxSide / Math.max(w, h));
          var cw = Math.max(1, Math.round(w * scale));
          var ch = Math.max(1, Math.round(h * scale));
          canvas.width = cw;
          canvas.height = ch;
          var ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, cw, ch);
          var data = ctx.getImageData(0, 0, cw, ch).data;
          var n = cw * ch;

          var soil = 0, rock = 0, mud = 0, blueW = 0, asphalt = 0, holes = 0, green = 0;
          var uiGray = 0, uiWhite = 0, dark = 0, satSum = 0, edgeDiff = 0, edgeN = 0;

          for (var i = 0; i < data.length; i += 4) {
            var r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
            if (a < 20) continue;
            var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
            var sat = mx === 0 ? 0 : (mx - mn) / mx;
            satSum += sat;
            var lum = 0.299 * r + 0.587 * g + 0.114 * b;

            if (lum > 245) uiWhite++;
            if (sat < 0.07 && lum > 50 && lum < 190) uiGray++;
            if (lum < 42) dark++;

            if (r > 95 && g > 45 && b < 95 && r > b + 28 && r >= g && sat > 0.14 && lum > 35 && lum < 160) soil++;
            if (sat < 0.12 && lum > 55 && lum < 160 && Math.abs(r - g) < 15 && Math.abs(g - b) < 15 && r > 70) rock++;

            if (r > 60 && g > 50 && b > 30 && b < 115 &&
                r >= g - 10 && r > b + 5 &&
                lum > 45 && lum < 145 && sat > 0.06 && sat < 0.42) mud++;

            if (b > r + 25 && b > g + 12 && lum > 45 && lum < 170 && sat > 0.15) blueW++;
            if (sat < 0.14 && lum > 28 && lum < 115 && Math.abs(r - g) < 18 && Math.abs(g - b) < 18) asphalt++;
            if (lum < 48 && sat < 0.28) holes++;
            if (g > r + 18 && g > b + 12 && g > 65) green++;

            var px = (i / 4) % cw;
            var py = Math.floor((i / 4) / cw);
            if (px < cw - 2 && py < ch - 1) {
              var j = i + 8;
              var lum2 = 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2];
              edgeDiff += Math.abs(lum - lum2);
              edgeN++;
            }
          }

          function pct(x) { return (x / n) * 100; }
          soil = pct(soil); rock = pct(rock); mud = pct(mud); blueW = pct(blueW);
          asphalt = pct(asphalt); holes = pct(holes); green = pct(green);
          uiGray = pct(uiGray); uiWhite = pct(uiWhite); dark = pct(dark);
          var avgSat = satSum / n;
          var texture = edgeN ? (edgeDiff / edgeN) : 0;

          if (uiGray > 35 && uiWhite > 8 && avgSat < 0.12 && mud < 8 && soil < 8) {
            return resolve(invalidMeta('Not similar to flood, landslide, or pothole (looks like app UI).'));
          }

          var simFlood = 0;
          simFlood += Math.min(40, blueW * 2.2);
          if (texture < 18) {
            simFlood += Math.min(35, mud * 1.3);
            if (mud > 18) simFlood += 15;
          } else {
            simFlood += Math.min(12, mud * 0.4);
          }
          if (blueW > 8) simFlood += 20;
          if (blueW > 15) simFlood += 15;
          if (blueW < 4 && mud < 12) simFlood *= 0.15;
          if (soil > mud + 5 && blueW < 6) simFlood = Math.max(0, simFlood - 25);

          var simLand = 0;
          simLand += Math.min(45, soil * 2.2);
          simLand += Math.min(25, rock * 1.2);
          simLand += Math.min(20, dark * 0.45);
          if (texture > 12) simLand += 18;
          if (texture > 20) simLand += 12;
          if (soil > 10) simLand += 18;
          if (soil > 18) simLand += 15;
          if (blueW > 12) simLand -= 20;
          if (blueW > 8 && mud > soil) simLand -= 15;
          if (soil > 8 && blueW < 6) simLand += 12;

          var simPot = 0;
          simPot += Math.min(40, asphalt * 1.3);
          simPot += Math.min(28, holes * 1.0);
          if (asphalt > 18 && holes > 8) simPot += 22;
          if (mud > 18 || blueW > 12 || soil > 15) simPot -= 15;

          if (nameHint === 'flood') simFlood += 22;
          if (nameHint === 'landslide') simLand += 22;
          if (nameHint === 'pothole') simPot += 22;

          var best = 'invalid', bestSim = 0;
          if (simLand >= simFlood && simLand >= simPot) {
            best = 'landslide'; bestSim = simLand;
          } else if (simFlood >= simLand && simFlood >= simPot) {
            best = 'flood'; bestSim = simFlood;
          } else {
            best = 'pothole'; bestSim = simPot;
          }

          if (soil >= 10 && blueW < 7 && simLand >= 28) {
            best = 'landslide';
            bestSim = Math.max(simLand, 40);
          }
          if (blueW >= 12 && simFlood >= 30) {
            best = 'flood';
            bestSim = Math.max(simFlood, 40);
          }
          if (mud >= 18 && blueW >= 3 && soil < mud && texture < 16 && simFlood >= 28) {
            best = 'flood';
            bestSim = Math.max(simFlood, 38);
          }

          var THRESHOLD = nameHint ? 28 : 34;
          var signalOk =
            (best === 'flood' && (blueW >= 6 || (mud >= 12 && texture < 18))) ||
            (best === 'landslide' && (soil >= 7 || rock >= 10)) ||
            (best === 'pothole' && asphalt >= 12 && holes >= 5);

          if (bestSim < THRESHOLD || !signalOk) {
            return resolve(invalidMeta(
              'Photo is not similar enough to flood, landslide, or pothole. No risk score.'
            ));
          }

          var conf = Math.min(96, Math.round(50 + bestSim * 0.4));
          var risk = Math.min(95, Math.round(35 + bestSim * 0.55));
          var features = {
            soil: +soil.toFixed(1), rock: +rock.toFixed(1), muddy_water: +mud.toFixed(1),
            blue_water: +blueW.toFixed(1), asphalt: +asphalt.toFixed(1),
            texture: +texture.toFixed(1),
            sim_flood: +simFlood.toFixed(1), sim_landslide: +simLand.toFixed(1), sim_pothole: +simPot.toFixed(1)
          };

          if (best === 'landslide') {
            return resolve({
              class: 'landslide', invalid: false, no_score: false, confidence: conf, features: features,
              risk_score: risk, hazard_type: 'Landslide', severity: risk > 70 ? 'CRITICAL' : 'HIGH',
              damage_pct: risk,
              recommended_action: 'Landslide / debris detected. Close corridor and deploy clearance crew.'
            });
          }
          if (best === 'flood') {
            return resolve({
              class: 'flood', invalid: false, no_score: false, confidence: conf, features: features,
              risk_score: risk, hazard_type: 'Flood', severity: risk > 70 ? 'CRITICAL' : 'HIGH',
              damage_pct: risk,
              recommended_action: 'Flood / waterlogging detected. Use elevated alternate NER routes.'
            });
          }
          return resolve({
            class: 'pothole', invalid: false, no_score: false, confidence: conf, features: features,
            risk_score: Math.min(88, risk), hazard_type: 'Road Potholes', severity: 'HIGH',
            damage_pct: Math.min(85, risk),
            recommended_action: 'Pothole / road damage detected. Slow traffic and schedule repair.'
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

  var api = { version: 21, classify: classify, analyze: analyze };
  global.SmartRoutePhotoCV = api;
  global.PhotoCV = api;
})(typeof window !== 'undefined' ? window : this);
