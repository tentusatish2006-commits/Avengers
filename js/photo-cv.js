/* SmartRoute Photo CV v24
 * Balance: real flood/landslide/pothole → score
 *          CAD / UI / random → invalid, no score
 */
(function (global) {
  function invalidMeta(reason) {
    return {
      class: 'invalid',
      invalid: true,
      no_score: true,
      confidence: 98,
      hazard_type: 'Invalid Photo',
      severity: 'REJECTED',
      damage_pct: null,
      risk_score: null,
      recommended_action: reason || 'Invalid photo. Risk score not calculated.',
      features: {}
    };
  }

  function classify(dataUrl, filename) {
    return new Promise(function (resolve) {
      var fn = (filename || '').toLowerCase();

      if (/\.(dwg|dxf|psd|sldprt|catpart|prt|iam|ipt)$/i.test(fn)) {
        return resolve(invalidMeta('CAD / design file. No risk score.'));
      }
      if (/ansys|solidworks|autocad|fusion\s*360|blender|inventor|catia|creo|nx\s*cad/i.test(fn)) {
        return resolve(invalidMeta('Software screenshot (filename). No risk score.'));
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
          if (w < 48 || h < 48) {
            return resolve(invalidMeta('Image too small. No risk score.'));
          }

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
          var uiGray = 0, uiWhite = 0, uiBlueGray = 0, nearBlack = 0, dark = 0;
          var satSum = 0, edgeDiff = 0, edgeN = 0, veryLightBlue = 0;

          for (var i = 0; i < data.length; i += 4) {
            var r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
            if (a < 20) continue;
            var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
            var sat = mx === 0 ? 0 : (mx - mn) / mx;
            satSum += sat;
            var lum = 0.299 * r + 0.587 * g + 0.114 * b;

            if (lum > 245) uiWhite++;
            if (lum < 18) nearBlack++;
            if (sat < 0.07 && lum > 50 && lum < 190) uiGray++;
            if (sat < 0.15 && b >= g && b >= r - 5 && lum > 120 && lum < 220) uiBlueGray++;
            if (b > 150 && g > 130 && r > 110 && b >= g && lum > 155 && sat < 0.22) veryLightBlue++;
            if (lum < 42) dark++;
            if (g > r + 18 && g > b + 12 && g > 65) green++;

            if (r > 85 && g > 40 && b < 100 && r > b + 22 && r >= g - 5 && sat > 0.12 && lum > 30 && lum < 165) soil++;
            if (sat < 0.12 && lum > 50 && lum < 165 && Math.abs(r - g) < 18 && Math.abs(g - b) < 18 && r > 65) rock++;

            if (r > 55 && g > 45 && b > 25 && b < 120 &&
                r >= g - 12 && r > b + 3 &&
                lum > 40 && lum < 150 && sat > 0.06 && sat < 0.48) mud++;

            if (b > r + 22 && b > g + 10 && lum > 40 && lum < 165 && sat > 0.18 && sat < 0.80 && b < 210) blueW++;

            if (sat < 0.15 && lum > 25 && lum < 120 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20) asphalt++;
            if (lum < 50 && sat < 0.30) holes++;

            var px = (i / 4) % cw;
            if (px < cw - 2) {
              var j = i + 8;
              var lum2 = 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2];
              edgeDiff += Math.abs(lum - lum2);
              edgeN++;
            }
          }

          function pct(x) { return (x / n) * 100; }
          soil = pct(soil); rock = pct(rock); mud = pct(mud); blueW = pct(blueW);
          asphalt = pct(asphalt); holes = pct(holes); green = pct(green);
          uiGray = pct(uiGray); uiWhite = pct(uiWhite); uiBlueGray = pct(uiBlueGray);
          nearBlack = pct(nearBlack); dark = pct(dark); veryLightBlue = pct(veryLightBlue);
          var avgSat = satSum / n;
          var texture = edgeN ? (edgeDiff / edgeN) : 0;

          var isCad =
            (uiBlueGray > 28 && avgSat < 0.18 && soil < 6 && mud < 8) ||
            (veryLightBlue > 25 && soil < 6 && mud < 8) ||
            (uiWhite > 15 && nearBlack > 8 && avgSat < 0.16 && soil < 5 && mud < 6 && blueW < 4) ||
            (uiGray > 35 && uiWhite > 8 && avgSat < 0.12 && mud < 8 && soil < 8);

          if (isCad) {
            return resolve(invalidMeta('Invalid photo — software / CAD screenshot. No risk score.'));
          }

          var simFlood = 0;
          simFlood += Math.min(42, blueW * 2.0);
          simFlood += Math.min(35, mud * 1.35);
          if (mud > 12) simFlood += 14;
          if (mud > 20) simFlood += 12;
          if (blueW > 8) simFlood += 16;
          if (blueW > 14) simFlood += 10;
          if (blueW < 3 && mud < 8) simFlood *= 0.25;
          if (soil > mud + 8 && blueW < 5) simFlood = Math.max(0, simFlood - 22);
          if (uiBlueGray > 25 && mud < 10) simFlood = Math.max(0, simFlood - 40);

          var simLand = 0;
          simLand += Math.min(48, soil * 2.0);
          simLand += Math.min(24, rock * 1.15);
          if (texture > 12) simLand += 14;
          if (soil > 10) simLand += 16;
          if (soil > 16) simLand += 12;
          if (blueW > 12) simLand -= 18;
          if (soil < 6) simLand = Math.max(0, simLand - 15);

          var simPot = 0;
          simPot += Math.min(42, asphalt * 1.25);
          simPot += Math.min(28, holes * 1.0);
          if (asphalt > 16 && holes > 8) simPot += 18;
          if (mud > 18 || blueW > 12 || soil > 16) simPot -= 15;
          if (asphalt < 10) simPot = Math.max(0, simPot - 12);

          if (nameHint === 'flood') simFlood += 15;
          if (nameHint === 'landslide') simLand += 15;
          if (nameHint === 'pothole') simPot += 15;

          var best = 'invalid', bestSim = 0;
          if (simLand >= simFlood && simLand >= simPot) {
            best = 'landslide'; bestSim = simLand;
          } else if (simFlood >= simLand && simFlood >= simPot) {
            best = 'flood'; bestSim = simFlood;
          } else {
            best = 'pothole'; bestSim = simPot;
          }

          if (soil >= 10 && blueW < 8 && simLand >= 30) {
            best = 'landslide';
            bestSim = Math.max(simLand, 38);
          }
          if ((blueW >= 10 || mud >= 14) && uiBlueGray < 22 && simFlood >= 30) {
            best = 'flood';
            bestSim = Math.max(simFlood, 38);
          }
          if (asphalt >= 14 && holes >= 7 && mud < 16 && soil < 14 && simPot >= 28) {
            best = 'pothole';
            bestSim = Math.max(simPot, 36);
          }

          var THRESHOLD = nameHint ? 32 : 36;
          var signalOk = false;
          if (best === 'flood') {
            signalOk = (blueW >= 6) || (mud >= 10) || (mud >= 8 && blueW >= 3);
          } else if (best === 'landslide') {
            signalOk = (soil >= 7) || (soil >= 5 && rock >= 8);
          } else if (best === 'pothole') {
            signalOk = (asphalt >= 12 && holes >= 5);
          }

          if (bestSim < THRESHOLD || !signalOk) {
            return resolve(invalidMeta(
              'Invalid photo — not clearly flood, landslide, or pothole. Risk score not calculated.'
            ));
          }

          var conf = Math.min(96, Math.round(52 + bestSim * 0.38));
          var risk = Math.min(95, Math.max(38, Math.round(36 + bestSim * 0.52)));
          var features = {
            soil: +soil.toFixed(1), rock: +rock.toFixed(1), muddy_water: +mud.toFixed(1),
            blue_water: +blueW.toFixed(1), ui_bluegray: +uiBlueGray.toFixed(1),
            asphalt: +asphalt.toFixed(1), texture: +texture.toFixed(1),
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

  var api = { version: 24, classify: classify, analyze: analyze };
  global.SmartRoutePhotoCV = api;
  global.PhotoCV = api;
})(typeof window !== 'undefined' ? window : this);
