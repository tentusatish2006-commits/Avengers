/* SmartRoute Photo CV v23
 * Invalid photos (CAD, UI, screenshots, random) → NEVER a risk score
 * Only clear field flood / landslide / pothole → score
 */
(function (global) {
  function invalidMeta(reason) {
    return {
      class: 'invalid',
      invalid: true,
      no_score: true,
      confidence: 99,
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
          if (w < 64 || h < 64) {
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
          var satSum = 0, edgeDiff = 0, edgeN = 0;
          var veryLightBlue = 0;

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
            if (sat < 0.18 && b >= g && b >= r - 5 && lum > 100 && lum < 230) uiBlueGray++;
            if (b > 140 && g > 120 && r > 100 && b >= g && lum > 140 && sat < 0.25) veryLightBlue++;
            if (lum < 42) dark++;
            if (g > r + 18 && g > b + 12 && g > 65) green++;

            if (r > 95 && g > 45 && b < 95 && r > b + 28 && r >= g && sat > 0.14 && lum > 35 && lum < 160) soil++;
            if (sat < 0.12 && lum > 55 && lum < 160 && Math.abs(r - g) < 15 && Math.abs(g - b) < 15 && r > 70) rock++;

            if (r > 60 && g > 50 && b > 30 && b < 115 &&
                r >= g - 10 && r > b + 5 &&
                lum > 45 && lum < 145 && sat > 0.08 && sat < 0.45) mud++;

            if (b > r + 28 && b > g + 14 && lum > 45 && lum < 155 && sat > 0.20 && sat < 0.75 && b < 200) blueW++;

            if (sat < 0.14 && lum > 28 && lum < 115 && Math.abs(r - g) < 18 && Math.abs(g - b) < 18) asphalt++;
            if (lum < 48 && sat < 0.28) holes++;

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

          if (uiBlueGray > 22 && avgSat < 0.20) {
            return resolve(invalidMeta('Invalid photo — software / CAD screenshot. No risk score.'));
          }
          if (veryLightBlue > 18 && soil < 8 && mud < 10) {
            return resolve(invalidMeta('Invalid photo — CAD viewport detected. No risk score.'));
          }
          if (uiGray > 28 && uiWhite > 5 && avgSat < 0.15 && mud < 10 && soil < 10) {
            return resolve(invalidMeta('Invalid photo — app UI screenshot. No risk score.'));
          }
          if (uiWhite > 12 && nearBlack > 6 && avgSat < 0.18 && soil < 6 && mud < 8) {
            return resolve(invalidMeta('Invalid photo — desktop application window. No risk score.'));
          }
          if (avgSat < 0.07 && uiGray > 20) {
            return resolve(invalidMeta('Invalid photo — not a field hazard. No risk score.'));
          }
          if (green > 45 && soil < 6 && mud < 8 && blueW < 5 && asphalt < 10) {
            return resolve(invalidMeta('Invalid photo — not a road hazard scene. No risk score.'));
          }

          var simFlood = 0;
          simFlood += Math.min(40, blueW * 2.2);
          if (texture < 16 && uiBlueGray < 15) {
            simFlood += Math.min(30, mud * 1.2);
            if (mud > 20) simFlood += 12;
          }
          if (blueW > 10) simFlood += 18;
          if (blueW > 16) simFlood += 12;
          if (blueW < 5 && mud < 14) simFlood = 0;
          if (soil > mud + 6 && blueW < 6) simFlood = Math.max(0, simFlood - 30);
          if (uiBlueGray > 15 || veryLightBlue > 12) simFlood = 0;

          var simLand = 0;
          simLand += Math.min(45, soil * 2.2);
          simLand += Math.min(22, rock * 1.2);
          if (texture > 14) simLand += 15;
          if (soil > 12) simLand += 16;
          if (soil > 20) simLand += 12;
          if (blueW > 10) simLand -= 25;
          if (soil < 8) simLand = Math.max(0, simLand - 20);
          if (uiBlueGray > 15) simLand = Math.max(0, simLand - 20);

          var simPot = 0;
          simPot += Math.min(40, asphalt * 1.3);
          simPot += Math.min(25, holes * 1.0);
          if (asphalt > 20 && holes > 10) simPot += 20;
          if (mud > 16 || blueW > 10 || soil > 14) simPot -= 20;
          if (asphalt < 12) simPot = Math.max(0, simPot - 15);
          if (uiBlueGray > 15) simPot = 0;

          if (nameHint === 'flood') simFlood += 12;
          if (nameHint === 'landslide') simLand += 12;
          if (nameHint === 'pothole') simPot += 12;

          var best = 'invalid', bestSim = 0;
          if (simLand >= simFlood && simLand >= simPot) {
            best = 'landslide'; bestSim = simLand;
          } else if (simFlood >= simLand && simFlood >= simPot) {
            best = 'flood'; bestSim = simFlood;
          } else {
            best = 'pothole'; bestSim = simPot;
          }

          if (soil >= 14 && blueW < 6 && uiBlueGray < 12 && simLand >= 42) {
            best = 'landslide'; bestSim = Math.max(simLand, 45);
          }
          if (blueW >= 14 && uiBlueGray < 12 && simFlood >= 42) {
            best = 'flood'; bestSim = Math.max(simFlood, 45);
          }

          var THRESHOLD = nameHint ? 45 : 52;
          var strongSignal = false;
          if (best === 'flood') {
            strongSignal = (blueW >= 12 && uiBlueGray < 12) ||
              (mud >= 20 && texture < 14 && blueW >= 5 && uiBlueGray < 12);
          } else if (best === 'landslide') {
            strongSignal = (soil >= 14) || (soil >= 10 && rock >= 12);
          } else if (best === 'pothole') {
            strongSignal = (asphalt >= 18 && holes >= 10);
          }

          if (bestSim < THRESHOLD || !strongSignal || best === 'invalid') {
            return resolve(invalidMeta(
              'Invalid photo — not clearly flood, landslide, or pothole. Risk score not calculated.'
            ));
          }

          var conf = Math.min(96, Math.round(55 + bestSim * 0.35));
          var risk = Math.min(95, Math.max(40, Math.round(40 + bestSim * 0.5)));
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

  var api = { version: 23, classify: classify, analyze: analyze };
  global.SmartRoutePhotoCV = api;
  global.PhotoCV = api;
})(typeof window !== 'undefined' ? window : this);
