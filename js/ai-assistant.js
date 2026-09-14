/**
 * SmartRoute built-in AI Assistant for North Eastern Region logistics.
 * Works offline — no API key required.
 */
(function (global) {
  'use strict';

  var ROUTES = [
    {
      name: 'Guwahati → Shillong (NH-6)',
      status: 'safe',
      risk: 28,
      eta: '3h 15m',
      note: 'Primary logistics corridor. Good surface in fair weather.'
    },
    {
      name: 'Guwahati → Dimapur → Kohima',
      status: 'moderate',
      risk: 55,
      eta: '6h 40m',
      note: 'Slope watch on Dimapur–Kohima stretch after heavy rain.'
    },
    {
      name: 'Silchar → Aizawl',
      status: 'alternate',
      risk: 48,
      eta: '5h 20m',
      note: 'Useful alternate when central Assam corridors are congested.'
    },
    {
      name: 'Shillong → Tawang approach',
      status: 'critical',
      risk: 82,
      eta: 'variable',
      note: 'Landslide / fog risk. Hold non-essential convoys until clear.'
    },
    {
      name: 'Imphal → Moreh',
      status: 'moderate',
      risk: 52,
      eta: '3h 45m',
      note: 'Border logistics route — expect checkpoint delays.'
    },
    {
      name: 'Agartala → Silchar',
      status: 'safe',
      risk: 35,
      eta: '4h 10m',
      note: 'Generally clear for supply movement.'
    }
  ];

  var INCIDENTS = [
    { place: 'Tawang', type: 'Landslide', severity: 'Critical', action: 'Reroute via lower-risk Assam corridors until pass clears.' },
    { place: 'Guwahati', type: 'Flood watch', severity: 'High', action: 'Avoid low-lying riverfront approaches during peak discharge.' },
    { place: 'Shillong', type: 'Road damage', severity: 'Moderate', action: 'Reduce speed; prefer NH-6 main carriageway.' },
    { place: 'Dimapur–Kohima', type: 'Slope instability', severity: 'High', action: 'Stagger convoys; avoid night movement if possible.' },
    { place: 'Silchar', type: 'Drainage / waterlogging', severity: 'Moderate', action: 'Use elevated bypass segments when marked open.' }
  ];

  function normalize(q) {
    return String(q || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function matchAny(q, words) {
    return words.some(function (w) { return q.indexOf(w) !== -1; });
  }

  function safestRouteAnswer() {
    var safe = ROUTES.filter(function (r) { return r.status === 'safe'; });
    var lines = safe.map(function (r) {
      return '• ' + r.name + ' — risk ' + r.risk + '/100, ETA ' + r.eta + '. ' + r.note;
    });
    return (
      'Safest active corridors in the North Eastern Region:\n' +
      lines.join('\n') +
      '\n\nRecommendation: Prefer Guwahati → Shillong (NH-6) for medicine and priority cargo unless local HQ issues a hold.'
    );
  }

  function alternateAnswer() {
    return (
      'Alternate routes when primary corridors are disrupted:\n' +
      '• Silchar → Aizawl — moderate risk, useful south-east detour.\n' +
      '• Agartala → Silchar — safer southern link.\n' +
      '• Guwahati → Dimapur (hold last segment to Kohima if slope alerts are active).\n\n' +
      'Avoid Shillong → Tawang approach until landslide clearance is confirmed.'
    );
  }

  function incidentAnswer(q) {
    var hit = INCIDENTS.find(function (i) {
      return q.indexOf(i.place.toLowerCase()) !== -1 || q.indexOf(i.type.toLowerCase()) !== -1;
    });
    if (hit) {
      return (
        hit.severity + ' — ' + hit.type + ' near ' + hit.place + '.\n' +
        'Action: ' + hit.action + '\n\n' +
        'Open AI Command map pins and Live Map for live geometry. Use safe NH-6 / Silchar alternates for diverted traffic.'
      );
    }
    var lines = INCIDENTS.map(function (i) {
      return '• [' + i.severity + '] ' + i.type + ' @ ' + i.place + ' — ' + i.action;
    });
    return 'Current NER incident summary:\n' + lines.join('\n');
  }

  function cityAnswer(q) {
    var cities = [
      { keys: ['guwahati', 'gauhati'], text: 'Guwahati is the main NER logistics hub. Brahmaputra flood watches can affect riverfront approaches; NH-6 toward Shillong remains the preferred outbound corridor.' },
      { keys: ['shillong'], text: 'Shillong (East Khasi Hills) is a priority medical & admin node. Surface damage after rain is common — keep convoy speed moderate on hill sections.' },
      { keys: ['tawang'], text: 'Tawang approach is high-risk in monsoon: landslides, fog, single-lane mountain geometry. Non-essential movement should wait for clearance.' },
      { keys: ['imphal'], text: 'Imphal links central Manipur logistics. Moreh border route may add checkpoint time; plan buffers for cross-border cargo.' },
      { keys: ['kohima', 'dimapur'], text: 'Dimapur–Kohima faces slope instability after heavy rain. Stagger trucks and prefer daylight movement.' },
      { keys: ['silchar', 'aizawl'], text: 'Silchar–Aizawl is a practical alternate when Assam central corridors are congested or partially closed.' },
      { keys: ['agartala'], text: 'Agartala supports Tripura supply chains; Agartala–Silchar is generally operational for inter-state movement.' }
    ];
    for (var i = 0; i < cities.length; i++) {
      if (matchAny(q, cities[i].keys)) return cities[i].text;
    }
    return null;
  }

  function weatherAnswer() {
    return (
      'Weather & accessibility guidance (NER):\n' +
      '• Monsoon → elevated landslide probability on Himalayan approaches (e.g. Tawang).\n' +
      '• Brahmaputra sector → flood watch on low approaches near Guwahati.\n' +
      '• Hill roads (Shillong, Kohima) → fog and surface damage; reduce speed.\n' +
      '• Prefer primary NH corridors marked green on Live Map; switch to orange alternates when red corridors activate.'
    );
  }

  function convoyAnswer() {
    return (
      'Convoy playbook:\n' +
      '1) Assign cargo to safest green corridor (usually Guwahati–Shillong).\n' +
      '2) If incident blocks path, auto-prefer Silchar–Aizawl or Agartala–Silchar alternates.\n' +
      '3) Do not push critical medical convoys onto red (critical) segments.\n' +
      '4) Update ETA after each reroute and notify receiving PHC/district desk.'
    );
  }

  function helpAnswer() {
    return (
      'I am SmartRoute AI for the North Eastern Region. Ask me about:\n' +
      '• Safest routes (Guwahati, Shillong, Silchar, Imphal, Kohima, Tawang…)\n' +
      '• Alternate / detour corridors\n' +
      '• Landslides, floods, road damage\n' +
      '• Weather impact on accessibility\n' +
      '• Convoy / medicine supply planning\n\n' +
      'Example: “Safest route from Guwahati to Shillong?”'
    );
  }

  function defaultAnswer(q) {
    return (
      'Analyzed your query for NER logistics.\n' +
      '• Primary safe spine: Guwahati → Shillong (NH-6).\n' +
      '• Alternate: Silchar → Aizawl / Agartala → Silchar.\n' +
      '• Avoid critical mountain approaches (Tawang) until cleared.\n\n' +
      'Ask a more specific city or incident for a sharper recommendation. (' + (q ? 'Got: “' + q.slice(0, 80) + '”' : 'No text') + ')'
    );
  }

  function respond(question) {
    var q = normalize(question);
    if (!q || matchAny(q, ['help', 'what can you', 'who are you', 'hi', 'hello'])) {
      return { ok: true, text: helpAnswer(), source: 'local' };
    }
    if (matchAny(q, ['safest', 'safe route', 'best route', 'recommended route', 'shortest safe'])) {
      return { ok: true, text: safestRouteAnswer(), source: 'local' };
    }
    if (matchAny(q, ['alternate', 'alternative', 'detour', 'bypass', 'reroute', 'other route'])) {
      return { ok: true, text: alternateAnswer(), source: 'local' };
    }
    if (matchAny(q, ['landslide', 'flood', 'incident', 'blocked', 'disrupted', 'rockfall', 'pothole', 'damage'])) {
      return { ok: true, text: incidentAnswer(q), source: 'local' };
    }
    if (matchAny(q, ['weather', 'rain', 'monsoon', 'fog', 'storm'])) {
      return { ok: true, text: weatherAnswer(), source: 'local' };
    }
    if (matchAny(q, ['convoy', 'medicine', 'ambulance', 'supply', 'delivery', 'truck', 'vehicle'])) {
      return { ok: true, text: convoyAnswer(), source: 'local' };
    }
    var city = cityAnswer(q);
    if (city) return { ok: true, text: city, source: 'local' };
    if (matchAny(q, ['route', 'road', 'corridor', 'nh-', 'highway', 'from', 'to'])) {
      return { ok: true, text: safestRouteAnswer() + '\n\n' + alternateAnswer(), source: 'local' };
    }
    return { ok: true, text: defaultAnswer(q), source: 'local' };
  }

  async function askCommand(question) {
    // Local assistant is primary — no API key needed
    return respond(question);
  }

  async function analyzeNERSituation(context) {
    return respond(context || 'safest routes and incidents overview');
  }

  async function analyzeFieldPhoto(description) {
    var q = normalize(description);
    if (matchAny(q, ['landslide', 'rock', 'debris', 'slope'])) {
      return {
        ok: true,
        text: 'Severity: Critical. Landslide debris on mountain carriageway. Action: Close segment, divert to safe NH corridors, dispatch clearance team.',
        source: 'local'
      };
    }
    if (matchAny(q, ['flood', 'water', 'inundat'])) {
      return {
        ok: true,
        text: 'Severity: High. Flooded approach. Action: Avoid low sections, use elevated alternate, monitor river gauges.',
        source: 'local'
      };
    }
    if (matchAny(q, ['pothole', 'damage', 'crack', 'pavement'])) {
      return {
        ok: true,
        text: 'Severity: Moderate. Surface damage. Action: Speed restriction, mark hazard, schedule repair; keep corridor open for light traffic.',
        source: 'local'
      };
    }
    return {
      ok: true,
      text: 'Severity: Moderate. Field evidence logged. Action: Verify GPS pin on Live Map and update incident status in Command Center.',
      source: 'local'
    };
  }

  global.SmartRouteAI = {
    respond: respond,
    askCommand: askCommand,
    analyzeNERSituation: analyzeNERSituation,
    analyzeFieldPhoto: analyzeFieldPhoto,
    ROUTES: ROUTES,
    INCIDENTS: INCIDENTS
  };

  // Compatibility with older SmartRouteGemini calls (no key required)
  global.SmartRouteGemini = {
    getKey: function () { return 'local-assistant'; },
    setKey: function () {},
    hasKey: function () { return true; },
    generate: async function (prompt) { return respond(prompt); },
    analyzeNERSituation: analyzeNERSituation,
    analyzeFieldPhoto: analyzeFieldPhoto,
    askCommand: askCommand
  };
})(window);
