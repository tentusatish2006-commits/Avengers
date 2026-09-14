/* SmartRoute i18n dictionary — core translations */
(function () {
  'use strict';

  var STRINGS = {
    en: {
      nav_sec_operations: 'OPERATIONS', nav_sec_intelligence: 'INTELLIGENCE', nav_sec_transport: 'TRANSPORT',
      nav_sec_monitoring: 'MONITORING', nav_sec_analytics: 'ANALYTICS', nav_sec_field: 'FIELD', nav_sec_system: 'SYSTEM',
      nav_dashboard: 'Dashboard', nav_map: 'Live Map', nav_incidents: 'Incidents', nav_alerts: 'Alerts',
      nav_emergency: 'Emergency Response', nav_route_prediction: 'AI Route Prediction',
      nav_alternate_routes: 'Alternate Routes', nav_ai_command: 'AI Command Center',
      nav_photo_analysis: 'AI Photo Analysis', nav_weather: 'Weather & Risk',
      nav_vehicle_tracking: 'Vehicle Tracking', nav_deliveries: 'Deliveries', nav_corridors: 'Risk Corridors',
      nav_districts: 'Districts', nav_infrastructure: 'Infrastructure', nav_officers: 'Field Officers',
      nav_reports: 'Reports', nav_analytics: 'Analytics', nav_simulation: 'Live Simulation',
      nav_field_report: 'Field Report', nav_officer_dashboard: 'Officer Dashboard',
      nav_language: 'Language & Region', nav_admin: 'Admin Panel', nav_settings: 'Settings',
      sign_out: 'Sign Out', live: 'LIVE', app_title: 'SmartRoute', app_sub: 'Emergency Mgmt',
      tab_profile: 'PROFILE', tab_security: 'SECURITY', tab_notifications: 'NOTIFICATIONS',
      tab_map: 'MAP', tab_gps: 'GPS', tab_alerts: 'ALERTS', tab_language: 'LANGUAGE',
      profile_title: 'Profile Settings', profile_subtitle: 'Manage officer identity and contacts',
      view_mode: 'VIEW MODE', btn_edit_profile: 'EDIT PROFILE', btn_save_changes: 'SAVE CHANGES',
      btn_cancel: 'CANCEL', btn_edit: 'EDIT', lang_title: 'Language & Region',
      lang_subtitle: 'Select interface language', lang_interface: 'Interface Language',
      lang_quick_select: 'Quick Select', lang_active_badge: 'ACTIVE', lang_applied_msg: 'Language applied'
    },
    hi: {
      nav_sec_operations: 'ऑपरेशन', nav_sec_intelligence: 'इंटेलिजेंस', nav_sec_transport: 'परिवहन',
      nav_sec_monitoring: 'निगरानी', nav_sec_analytics: 'विश्लेषण', nav_sec_field: 'फील्ड', nav_sec_system: 'सिस्टम',
      nav_dashboard: 'डैशबोर्ड', nav_map: 'लाइव मानचित्र', nav_incidents: 'घटनाएँ', nav_alerts: 'अलर्ट',
      nav_emergency: 'आपातकालीन प्रतिक्रिया', nav_route_prediction: 'एआई मार्ग पूर्वानुमान',
      nav_alternate_routes: 'वैकल्पिक मार्ग', nav_ai_command: 'एआई कमांड सेंटर',
      nav_photo_analysis: 'एआई फोटो विश्लेषण', nav_weather: 'मौसम और जोखिम',
      nav_vehicle_tracking: 'वाहन ट्रैकिंग', nav_deliveries: 'डिलीवरी', nav_corridors: 'जोखिम गलियारे',
      nav_districts: 'जिले', nav_infrastructure: 'अवसंरचना', nav_officers: 'फील्ड अधिकारी',
      nav_reports: 'रिपोर्ट', nav_analytics: 'एनालिटिक्स', nav_simulation: 'लाइव सिमुलेशन',
      nav_field_report: 'फील्ड रिपोर्ट', nav_officer_dashboard: 'अधिकारी डैशबोर्ड',
      nav_language: 'भाषा और क्षेत्र', nav_admin: 'एडमिन पैनल', nav_settings: 'सेटिंग्स',
      sign_out: 'साइन आउट', live: 'लाइव', app_title: 'स्मार्टरूट', app_sub: 'आपातकालीन प्रबंधन',
      tab_profile: 'प्रोफ़ाइल', tab_security: 'सुरक्षा', tab_notifications: 'सूचनाएँ',
      tab_map: 'मानचित्र', tab_gps: 'जीपीएस', tab_alerts: 'अलर्ट', tab_language: 'भाषा',
      profile_title: 'प्रोफ़ाइल सेटिंग्स', profile_subtitle: 'अधिकारी पहचान प्रबंधित करें',
      view_mode: 'देखें मोड', btn_edit_profile: 'प्रोफ़ाइल संपादित करें', btn_save_changes: 'सहेजें',
      btn_cancel: 'रद्द करें', btn_edit: 'संपादित', lang_title: 'भाषा और क्षेत्र',
      lang_subtitle: 'इंटरफ़ेस भाषा चुनें', lang_interface: 'इंटरफ़ेस भाषा',
      lang_quick_select: 'त्वरित चयन', lang_active_badge: 'सक्रिय', lang_applied_msg: 'भाषा लागू'
    },
    te: {
      nav_sec_operations: 'ఆపరేషన్స్', nav_sec_intelligence: 'ఇంటెలిజెన్స్', nav_sec_transport: 'రవాణా',
      nav_sec_monitoring: 'పర్యవేక్షణ', nav_sec_analytics: 'విశ్లేషణ', nav_sec_field: 'ఫీల్డ్', nav_sec_system: 'సిస్టమ్',
      nav_dashboard: 'డాష్‌బోర్డ్', nav_map: 'లైవ్ మ్యాప్', nav_incidents: 'సంఘటనలు', nav_alerts: 'హెచ్చరికలు',
      nav_emergency: 'అత్యవసర ప్రతిస్పందన', nav_route_prediction: 'AI మార్గ అంచనా',
      nav_alternate_routes: 'ప్రత్యామ్నాయ మార్గాలు', nav_ai_command: 'AI కమాండ్ సెంటర్',
      nav_photo_analysis: 'AI ఫోటో విశ్లేషణ', nav_weather: 'వాతావరణం & ప్రమాదం',
      nav_vehicle_tracking: 'వాహన ట్రాకింగ్', nav_deliveries: 'డెలివరీలు', nav_corridors: 'ప్రమాద కారిడార్లు',
      nav_districts: 'జిల్లాలు', nav_infrastructure: 'మౌలిక సదుపాయాలు', nav_officers: 'ఫీల్డ్ అధికారులు',
      nav_reports: 'నివేదికలు', nav_analytics: 'అనలిటిక్స్', nav_simulation: 'లైవ్ సిమ్యులేషన్',
      nav_field_report: 'ఫీల్డ్ రిపోర్ట్', nav_officer_dashboard: 'అధికారి డాష్‌బోర్డ్',
      nav_language: 'భాష & ప్రాంతం', nav_admin: 'అడ్మిన్ ప్యానెల్', nav_settings: 'సెట్టింగులు',
      sign_out: 'సైన్ అవుట్', live: 'లైవ్', app_title: 'స్మార్ట్‌రూట్', app_sub: 'అత్యవసర నిర్వహణ',
      tab_profile: 'ప్రొఫైల్', tab_security: 'భద్రత', tab_notifications: 'నోటిఫికేషన్లు',
      tab_map: 'మ్యాప్', tab_gps: 'GPS', tab_alerts: 'హెచ్చరికలు', tab_language: 'భాష',
      profile_title: 'ప్రొఫైల్ సెట్టింగులు', profile_subtitle: 'అధికారి గుర్తింపు నిర్వహించండి',
      view_mode: 'వీక్షణ మోడ్', btn_edit_profile: 'ప్రొఫైల్ సవరించు', btn_save_changes: 'సేవ్',
      btn_cancel: 'రద్దు', btn_edit: 'సవరించు', lang_title: 'భాష & ప్రాంతం',
      lang_subtitle: 'ఇంటర్‌ఫేస్ భాష ఎంచుకోండి', lang_interface: 'ఇంటర్‌ఫేస్ భాష',
      lang_quick_select: 'త్వరిత ఎంపిక', lang_active_badge: 'యాక్టివ్', lang_applied_msg: 'భాష వర్తింపజేయబడింది'
    },
    as: {
      nav_sec_operations: 'অপাৰেশ্বন', nav_sec_intelligence: 'ইন্টেলিজেন্স', nav_sec_transport: 'পৰিবহণ',
      nav_sec_monitoring: 'নিৰীক্ষণ', nav_sec_analytics: 'বিশ্লেষণ', nav_sec_field: 'ফিল্ড', nav_sec_system: 'চিস্টেম',
      nav_dashboard: 'ডেশ্বব’ৰ্ড', nav_map: 'লাইভ মানচিত্ৰ', nav_incidents: 'ঘটনাসমূহ', nav_alerts: 'সতৰ্কবাৰ্তা',
      nav_emergency: 'জৰুৰীকালীন সঁহাৰি', nav_route_prediction: 'এআই পথ পূৰ্বানুমান',
      nav_alternate_routes: 'বিকল্প পথ', nav_ai_command: 'এআই কমাণ্ড চেণ্টাৰ',
      nav_photo_analysis: 'এআই ফটো বিশ্লেষণ', nav_weather: 'বতৰ আৰু বিপদ',
      nav_vehicle_tracking: 'যান ট্ৰেকিং', nav_deliveries: 'ডেলিভাৰী', nav_corridors: 'বিপদ কৰিড’ৰ',
      nav_districts: 'জিলা', nav_infrastructure: 'আন্তঃগাঁথনি', nav_officers: 'ফিল্ড বিষয়া',
      nav_reports: 'প্ৰতিবেদন', nav_analytics: 'এনালিটিক্স', nav_simulation: 'লাইভ ছিমুলেশ্বন',
      nav_field_report: 'ফিল্ড ৰিপ’ৰ্ট', nav_officer_dashboard: 'অধিকাৰী ডেশ্বব’ৰ্ড',
      nav_language: 'ভাষা আৰু অঞ্চল', nav_admin: 'এডমিন পেনেল', nav_settings: 'ছেটিংছ',
      sign_out: 'ছাইন আউট', live: 'লাইভ', app_title: 'স্মাৰ্টৰুট', app_sub: 'জৰুৰীকালীন ব্যৱস্থাপনা'
    },
    bn: {
      nav_sec_operations: 'অপারেশন', nav_sec_intelligence: 'ইন্টেলিজেন্স', nav_sec_transport: 'পরিবহন',
      nav_sec_monitoring: 'মনিটরিং', nav_sec_analytics: 'অ্যানালিটিক্স', nav_sec_field: 'ফিল্ড', nav_sec_system: 'সিস্টেম',
      nav_dashboard: 'ড্যাশবোর্ড', nav_map: 'লাইভ মানচিত্র', nav_incidents: 'ঘটনা', nav_alerts: 'সতর্কতা',
      nav_emergency: 'জরুরি সাড়া', nav_route_prediction: 'এআই রুট পূর্বাভাস',
      nav_alternate_routes: 'বিকল্প রুট', nav_ai_command: 'এআই কমান্ড সেন্টার',
      nav_photo_analysis: 'এআই ফটো বিশ্লেষণ', nav_weather: 'আবহাওয়া ও ঝুঁকি',
      nav_vehicle_tracking: 'যান ট্র্যাকিং', nav_deliveries: 'ডেলিভারি', nav_corridors: 'ঝুঁকি করিডোর',
      nav_districts: 'জেলা', nav_infrastructure: 'অবকাঠামো', nav_officers: 'ফিল্ড অফিসার',
      nav_reports: 'রিপোর্ট', nav_analytics: 'অ্যানালিটিক্স', nav_simulation: 'লাইভ সিমুলেশন',
      nav_field_report: 'ফিল্ড রিপোর্ট', nav_officer_dashboard: 'অফিসার ড্যাশবোর্ড',
      nav_language: 'ভাষা ও অঞ্চল', nav_admin: 'অ্যাডমিন প্যানেল', nav_settings: 'সেটিংস',
      sign_out: 'সাইন আউট', live: 'লাইভ', app_title: 'স্মার্টরুট', app_sub: 'জরুরি ব্যবস্থাপনা'
    },
    ta: {
      nav_dashboard: 'டாஷ்போர்டு', nav_map: 'நேரடி வரைபடம்', nav_incidents: 'சம்பவங்கள்', nav_alerts: 'எச்சரிக்கைகள்',
      nav_emergency: 'அவசர பதில்', nav_route_prediction: 'AI வழி முன்னறிவிப்பு',
      nav_language: 'மொழி & பகுதி', nav_admin: 'நிர்வாக பலகை', nav_settings: 'அமைப்புகள்',
      sign_out: 'வெளியேறு', live: 'நேரடி', app_title: 'ஸ்மார்ட்ரூட்', app_sub: 'அவசர மேலாண்மை',
      nav_sec_operations: 'செயல்பாடுகள்', nav_sec_intelligence: 'நுண்ணறிவு', nav_sec_system: 'அமைப்பு'
    },
    es: {
      nav_dashboard: 'Panel', nav_map: 'Mapa en vivo', nav_incidents: 'Incidentes', nav_alerts: 'Alertas',
      nav_emergency: 'Respuesta de emergencia', nav_route_prediction: 'Predicción de rutas IA',
      nav_language: 'Idioma y región', nav_admin: 'Panel de admin', nav_settings: 'Ajustes',
      sign_out: 'Cerrar sesión', live: 'EN VIVO', app_title: 'SmartRoute', app_sub: 'Gestión de emergencias',
      nav_sec_operations: 'OPERACIONES', nav_sec_intelligence: 'INTELIGENCIA', nav_sec_system: 'SISTEMA'
    },
    fr: {
      nav_dashboard: 'Tableau de bord', nav_map: 'Carte en direct', nav_incidents: 'Incidents', nav_alerts: 'Alertes',
      nav_emergency: 'Réponse d’urgence', nav_route_prediction: 'Prédiction d’itinéraires IA',
      nav_language: 'Langue et région', nav_admin: 'Panneau admin', nav_settings: 'Paramètres',
      sign_out: 'Déconnexion', live: 'EN DIRECT', app_title: 'SmartRoute', app_sub: 'Gestion d’urgence',
      nav_sec_operations: 'OPÉRATIONS', nav_sec_intelligence: 'RENSEIGNEMENT', nav_sec_system: 'SYSTÈME'
    }
  };

  ['as','bn','ta','es','fr','te','hi'].forEach(function (code) {
    if (!STRINGS[code]) STRINGS[code] = {};
    Object.keys(STRINGS.en).forEach(function (k) {
      if (!STRINGS[code][k]) STRINGS[code][k] = STRINGS.en[k];
    });
  });

  function getLang() {
    try { return localStorage.getItem('sr_language') || 'en'; } catch (e) { return 'en'; }
  }

  window.SmartRouteI18n = {
    _currentLang: getLang(),
    languages: [
      { code: 'en', name: 'English', native: 'English' },
      { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
      { code: 'as', name: 'Assamese', native: 'অসমীয়া' },
      { code: 'bn', name: 'Bengali', native: 'বাংলা' },
      { code: 'te', name: 'Telugu', native: 'తెలుగు' },
      { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
      { code: 'es', name: 'Spanish', native: 'Español' },
      { code: 'fr', name: 'French', native: 'Français' }
    ],
    t: function (key, code) {
      code = code || this._currentLang || getLang();
      var pack = STRINGS[code] || STRINGS.en;
      return (pack && pack[key]) || (STRINGS.en && STRINGS.en[key]) || key;
    },
    getLanguage: function () { return this._currentLang || getLang(); },
    getLanguageInfo: function (code) {
      code = code || this.getLanguage();
      return this.languages.find(function (l) { return l.code === code; }) || this.languages[0];
    },
    setLanguage: function (code) {
      code = String(code || 'en').toLowerCase();
      this._currentLang = code;
      try { localStorage.setItem('sr_language', code); } catch (e) {}
      document.documentElement.lang = code;
      this.applyLanguage(code);
    },
    applyLanguage: function (code) {
      code = code || this.getLanguage();
      this._currentLang = code;
      document.querySelectorAll('[data-i18n]').forEach(function (el) {
        var key = el.getAttribute('data-i18n');
        if (!key) return;
        var tr = SmartRouteI18n.t(key, code);
        if (tr && tr !== key) {
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.setAttribute('placeholder', tr);
          else el.textContent = tr;
        }
      });
      if (typeof this.applyDeep === 'function') {
        try { this.applyDeep(code); } catch (e) {}
      }
    }
  };

  function bootApply() {
    var code = getLang();
    SmartRouteI18n._currentLang = code;
    if (code !== 'en') SmartRouteI18n.applyLanguage(code);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootApply);
  else bootApply();

  console.log('[SmartRoute i18n] dictionary ready', SmartRouteI18n.t('nav_dashboard', 'hi'));
})();
