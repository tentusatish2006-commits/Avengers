/* SmartRoute Photo CV v26 — simple decision tree
 * earth dominant → landslide | water dominant → flood | road → pothole | else invalid
 */
(function (global) {
  var LOC = {
    flood: {
      class: 'flood', hazard_type: 'Flood',
      display: 'Flood — Guwahati · Brahmaputra lowlands, Assam',
      place: 'Guwahati · Brahmaputra lowlands, Assam',
      lat: 26.1445, lng: 91.7362, zoom: 12,
      action: 'Flood / waterlogging detected. Use elevated alternate NER routes.'
    },
    landslide: {
      class: 'landslide', hazard_type: 'Landslide',
      display: 'Landslide — Shillong · NH-6 corridor, Meghalaya',
      place: 'Shillong · NH-6 corridor, Meghalaya',
      lat: 25.5788, lng: 91.8933, zoom: 12,
      action: 'Landslide / debris detected. Close corridor and deploy clearance crew.'
    },
    pothole: {
      class: 'pothole', hazard_type: 'Road Potholes',
      display: 'Road Potholes — Kohima · Dimapur–Kohima highway, Nagaland',
      place: 'Kohima · Dimapur–Kohima highway, Nagaland',
      lat: 25.6751, lng: 94.1086, zoom: 12,
      action: 'Pothole / road damage detected. Slow traffic and schedule repair.'
    }
  };

  function invalidMeta(reason) {
    return {
      class: 'invalid', invalid: true, no_score: true, confidence: 99,
      hazard_type: 'Invalid Photo', severity: 'REJECTED',
      damage_pct: null, risk_score: null,
      display: 'Invalid photo', place: 'Not a field hazard',
      lat: 25.80, lng: 91.60, zoom: 7,
      recommended_action: reason || 'Invalid photo. Risk score not calculated.',
      features: {}
    };
  }

  function okMeta(kind, conf, risk, features) {
    var L = LOC[kind];
    return {
      class: L.class, invalid: false, no_score: false,
      confidence: conf, features: features || {},
      risk_score: risk, hazard_type: L.hazard_type,
      severity: risk > 70 ? 'CRITICAL' : 'HIGH',
      damage_pct: risk,
      display: L.display, place: L.place,
      lat: L.lat, lng: L.lng, zoom: L.zoom,
      recommended_action: L.action
    };
  }

  function classify(dataUrl, filename) {
    return new Promise(function (resolve) {
      var fn = (filename || '').toLowerCase();
      if (/\.(dwg|dxf|psd|sldprt|catpart|prt|iam|ipt)$/i.test(fn)) {
        return resolve(invalidMeta('CAD file. No risk score.'));
      }
      if (/ansys|solidworks|autocad|fusion\s*360|inventor|catia|creo/i.test(fn)) {
        return resolve(invalidMeta('Software screenshot. No risk score.'));
      }

      var hint = null;
      if (/pothole|pot.?hole|crater/i.test(fn)) hint = 'pothole';
      else if (/flood|waterlog|inundat/i.test(fn)) hint = 'flood';
      else if (/landslide|debris|mudslide|rockfall|slope|earth.?slip/i.test(fn)) hint = 'landslide';

      var img = new Image();
      img.onload = function () {
        try {
          var w = img.naturalWidth || img.width;
          var h = img.naturalHeight || img.height;
          if (w < 40 || h < 40) return resolve(invalidMeta('Image too small.'));

          var canvas = document.createElement('canvas');
          var maxSide = 280;
          var scale = Math.min(1, maxSide / Math.max(w, h));
          var cw = Math.max(1, Math.round(w * scale));
          var ch = Math.max(1, Math.round(h * scale));
          canvas.width = cw; canvas.height = ch;
          var ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, cw, ch);
          var data = ctx.getImageData(0, 0, cw, ch).data;
          var n = cw * ch;

          var soil = 0, rock = 0, mud = 0, blue = 0, asphalt = 0, hole = 0;
          var gray = 0, white = 0, softBlue = 0, black = 0, satSum = 0;
          var edge = 0, edgeN = 0;

          for (var i = 0; i < data.length; i += 4) {
            var r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
            if (a < 16) continue;
            var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
            var sat = mx ? (mx - mn) / mx : 0;
            satSum += sat;
            var lum = 0.299 * r + 0.587 * g + 0.114 * b;

            if (lum > 245) white++;
            if (lum < 16) black++;
            if (sat < 0.08 && lum > 45 && lum < 195) gray++;
            if (sat < 0.16 && b >= g && b >= r - 8 && lum > 130 && lum < 225) softBlue++;

            if (r > 75 && g > 30 && b < 110 && r > b + 15 && r >= g - 12 && sat > 0.09 && lum > 25 && lum < 175) soil++;
            if (sat < 0.14 && lum > 45 && lum < 170 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && r > 55) rock++;
            if (r > 50 && g > 45 && b > 25 && b < 120 && r >= g - 15 && r > b && lum > 40 && lum < 150 && sat > 0.05 && sat < 0.45) mud++;
            if (b > r + 20 && b > g + 8 && lum > 35 && lum < 170 && sat > 0.16 && b < 220) blue++;
            if (sat < 0.16 && lum > 22 && lum < 125 && Math.abs(r - g) < 22 && Math.abs(g - b) < 22) asphalt++;
            if (lum < 48 && sat < 0.32) hole++;

            if ((i / 4) % cw < cw - 2) {
              var j = i + 8;
              var l2 = 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2];
              edge += Math.abs(lum - l2);
              edgeN++;
            }
          }

          function pct(x) { return (x / n) * 100; }
          soil = pct(soil); rock = pct(rock); mud = pct(mud); blue = pct(blue);
          asphalt = pct(asphalt); hole = pct(hole); gray = pct(gray); white = pct(white);
          softBlue = pct(softBlue); black = pct(black);
          var avgSat = satSum / n;
          var texture = edgeN ? edge / edgeN : 0;

          if (
            (softBlue > 30 && soil < 7 && mud < 8) ||
            (white > 14 && black > 7 && avgSat < 0.15 && soil < 6 && mud < 7 && blue < 4) ||
            (gray > 38 && white > 7 && avgSat < 0.11 && soil < 7 && mud < 7)
          ) {
            return resolve(invalidMeta('Invalid photo — software / CAD screenshot. No risk score.'));
          }

          var earthScore = soil * 2.2 + rock * 0.9 + (texture > 12 ? 12 : 0) + (texture > 18 ? 8 : 0);
          if (soil > 8) earthScore += 15;
          if (soil > 14) earthScore += 12;
          if (blue > 10) earthScore -= 20;

          var waterScore = blue * 2.4 + (texture < 15 ? mud * 1.0 : mud * 0.35);
          if (blue > 8) waterScore += 18;
          if (mud > 14 && soil < mud) waterScore += 12;
          if (soil > mud + 4 && blue < 5) waterScore -= 25;
          if (softBlue > 20 && mud < 10) waterScore -= 30;

          var roadScore = asphalt * 1.3 + hole * 1.0;
          if (asphalt > 15 && hole > 7) roadScore += 20;
          if (mud > 16 || blue > 10 || soil > 14) roadScore -= 18;

          if (hint === 'landslide') earthScore += 20;
          if (hint === 'flood') waterScore += 20;
          if (hint === 'pothole') roadScore += 20;

          var kind = null;
          if (earthScore >= waterScore && earthScore >= roadScore && earthScore >= 28 && soil >= 5) {
            kind = 'landslide';
          } else if (waterScore >= earthScore && waterScore >= roadScore && waterScore >= 28 &&
                     (blue >= 5 || (mud >= 10 && soil <= mud + 2))) {
            kind = 'flood';
          } else if (roadScore >= earthScore && roadScore >= waterScore && roadScore >= 26 && asphalt >= 10 && hole >= 4) {
            kind = 'pothole';
          } else if (soil >= 7 && blue < 6 && earthScore >= 24) {
            kind = 'landslide';
          } else if (blue >= 8 && waterScore >= 24) {
            kind = 'flood';
          } else if (mud >= 14 && soil < mud && blue >= 2 && texture < 14 && waterScore >= 24) {
            kind = 'flood';
          } else {
            return resolve(invalidMeta(
              'Invalid photo — not clearly flood, landslide, or pothole. Risk score not calculated.'
            ));
          }

          if (kind === 'flood' && soil >= 9 && blue < 6 && earthScore + 3 >= waterScore) {
            kind = 'landslide';
          }
          if (kind === 'landslide' && blue >= 12 && waterScore > earthScore + 5) {
            kind = 'flood';
          }

          var base = kind === 'landslide' ? earthScore : kind === 'flood' ? waterScore : roadScore;
          var conf = Math.min(96, Math.round(50 + base * 0.4));
          var risk = Math.min(95, Math.max(40, Math.round(38 + base * 0.5)));
          var features = {
            soil: +soil.toFixed(1), rock: +rock.toFixed(1), mud: +mud.toFixed(1),
            blue: +blue.toFixed(1), asphalt: +asphalt.toFixed(1), texture: +texture.toFixed(1),
            earthScore: +earthScore.toFixed(1), waterScore: +waterScore.toFixed(1), roadScore: +roadScore.toFixed(1)
          };
          return resolve(okMeta(kind, conf, risk, features));
        } catch (e) {
          console.warn('[PhotoCV]', e);
          resolve(invalidMeta('Could not analyze image. No risk score.'));
        }
      };
      img.onerror = function () { resolve(invalidMeta('Image failed to load. No risk score.')); };
      img.crossOrigin = 'anonymous';
      img.src = dataUrl;
    });
  }

  function analyze(imgOrUrl, filename) {
    var url = typeof imgOrUrl === 'string' ? imgOrUrl : (imgOrUrl && imgOrUrl.src) || '';
    return classify(url, filename);
  }

  var api = { version: 26, classify: classify, analyze: analyze, LOCATIONS: LOC };
  global.SmartRoutePhotoCV = api;
  global.PhotoCV = api;
})(typeof window !== 'undefined' ? window : this);
