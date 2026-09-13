/**
 * SmartRoute — Gemini live API helper
 * Set key in browser only (never commit secrets):
 *   localStorage.setItem('sr_gemini_key', 'YOUR_KEY')
 *   or window.SMARTROUTE_GEMINI_KEY = 'YOUR_KEY'
 *   or use the API key field on AI Command Center
 */
(function (global) {
  'use strict';

  var MODEL = 'gemini-2.0-flash';
  var BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';

  function getKey() {
    try {
      return (
        global.SMARTROUTE_GEMINI_KEY ||
        localStorage.getItem('sr_gemini_key') ||
        ''
      );
    } catch (e) {
      return global.SMARTROUTE_GEMINI_KEY || '';
    }
  }

  function setKey(key) {
    try {
      if (key) localStorage.setItem('sr_gemini_key', key);
      else localStorage.removeItem('sr_gemini_key');
    } catch (e) {}
    global.SMARTROUTE_GEMINI_KEY = key || '';
  }

  function hasKey() {
    return !!getKey();
  }

  async function generate(prompt, opts) {
    opts = opts || {};
    var key = getKey();
    if (!key) {
      return {
        ok: false,
        text: 'Gemini API key not set. Open AI Command Center and paste your key, or run in console:\nlocalStorage.setItem("sr_gemini_key", "YOUR_KEY")',
        offline: true
      };
    }
    var url = BASE + MODEL + ':generateContent?key=' + encodeURIComponent(key);
    var body = {
      contents: [{ role: 'user', parts: [{ text: String(prompt || '') }] }],
      generationConfig: {
        temperature: opts.temperature != null ? opts.temperature : 0.4,
        maxOutputTokens: opts.maxTokens || 512
      }
    };
    try {
      var res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      var data = await res.json();
      if (!res.ok) {
        var err = (data.error && data.error.message) || ('HTTP ' + res.status);
        return { ok: false, text: 'Gemini error: ' + err, raw: data };
      }
      var text = '';
      try {
        text = data.candidates[0].content.parts
          .map(function (p) { return p.text || ''; })
          .join('');
      } catch (e) {
        text = JSON.stringify(data).slice(0, 400);
      }
      return { ok: true, text: text, raw: data };
    } catch (e) {
      return { ok: false, text: 'Network error calling Gemini: ' + e.message };
    }
  }

  async function analyzeNERSituation(context) {
    var prompt =
      'You are SmartRoute AI for India North Eastern Region logistics command center. ' +
      'Answer in clear short bullets (max 80 words). Focus on safest roads, alternates, and risks.\n' +
      'Context:\n' +
      (context || 'Heavy rain and landslide risk on NER highways.');
    var r = await generate(prompt);
    if (!r.ok) {
      return {
        ok: true,
        text:
          '• Prefer Guwahati–Shillong (NH-6) when primary is disrupted.\n' +
          '• Hold convoys near Tawang Pass until rockfall clears.\n' +
          '• Use Silchar–Aizawl as moderate alternate.',
        offline: true,
        error: r.text
      };
    }
    return r;
  }

  async function analyzeFieldPhoto(description) {
    var prompt =
      'You are a vision logistics AI for North East India roads. ' +
      'Given this field report, give severity (Critical/High/Moderate) and one action in under 50 words.\n' +
      'Description: ' +
      (description || 'Rockfall blocking single-lane mountain road near Tawang.');
    return generate(prompt, { maxTokens: 200 });
  }

  async function askCommand(question) {
    var prompt =
      'You are the AI Command Center for SmartRoute North Eastern Region ' +
      '(Assam, Meghalaya, Arunachal, Nagaland, Manipur, Mizoram, Tripura, Sikkim). ' +
      'Answer the officer question with practical routing / logistics advice. Keep under 100 words.\n' +
      'Question: ' +
      (question || 'What is the safest route from Guwahati to Shillong?');
    return generate(prompt, { maxTokens: 400, temperature: 0.35 });
  }

  global.SmartRouteGemini = {
    getKey: getKey,
    setKey: setKey,
    hasKey: hasKey,
    generate: generate,
    analyzeNERSituation: analyzeNERSituation,
    analyzeFieldPhoto: analyzeFieldPhoto,
    askCommand: askCommand
  };
})(window);
