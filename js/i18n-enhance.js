/* Deep i18n: switch all UI text from English to selected language */
(function () {
  'use strict';

  var ALL_KEYS = [
    'nav_sec_operations','nav_sec_intelligence','nav_sec_transport','nav_sec_monitoring',
    'nav_sec_analytics','nav_sec_field','nav_sec_system',
    'nav_dashboard','nav_map','nav_incidents','nav_alerts','nav_emergency',
    'nav_route_prediction','nav_alternate_routes','nav_ai_command','nav_photo_analysis','nav_weather',
    'nav_vehicle_tracking','nav_deliveries','nav_corridors','nav_districts','nav_infrastructure',
    'nav_officers','nav_reports','nav_analytics','nav_simulation','nav_field_report',
    'nav_officer_dashboard','nav_language','nav_admin','nav_settings','sign_out','live',
    'app_title','app_sub','app_name',
    'tab_profile','tab_security','tab_notifications','tab_map','tab_gps','tab_alerts','tab_language',
    'profile_title','profile_subtitle','view_mode','editing_active',
    'btn_edit_profile','btn_save_changes','btn_cancel','btn_reset_defaults',
    'lang_title','lang_subtitle','lang_interface','lang_interface_desc','lang_quick_select',
    'lang_active_badge','lang_applied_msg'
  ];

  var PHRASES = {
    'Live Map': { hi: 'लाइव मानचित्र', as: 'লাইভ মানচিত্ৰ', bn: 'লাইভ মানচিত্র', te: 'లైవ్ మ్యాప్', ta: 'நேரடி வரைபடம்', kn: 'ಲೈವ್ ನಕ್ಷೆ', mr: 'लाइव्ह नकाशा', gu: 'લાઇવ નકશો', ml: 'ലൈവ് മാപ്പ്', pa: 'ਲਾਈਵ ਨਕਸ਼ਾ', or: 'ଲାଇଭ୍ ମାନଚିତ୍ର', ne: 'लाइभ नक्सा', es: 'Mapa en vivo', fr: 'Carte en direct' },
    'Dashboard': { hi: 'डैशबोर्ड', as: 'ডেশ্বব’ৰ্ড', bn: 'ড্যাশবোর্ড', te: 'డాష్‌బోర్డ్', ta: 'டாஷ்போர்டு', kn: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', mr: 'डॅशबोर्ड', gu: 'ડેશબોર્ડ', ml: 'ഡാഷ്ബോർഡ്', pa: 'ਡੈਸ਼ਬੋਰਡ', or: 'ଡ୍ୟାସବୋର୍ଡ', ne: 'ड्यासबोर्ड', es: 'Panel', fr: 'Tableau de bord' },
    'Incidents': { hi: 'घटनाएँ', as: 'ঘটনাসমূহ', bn: 'ঘটনা', te: 'సంఘటనలు', ta: 'சம்பவங்கள்', kn: 'ಘಟನೆಗಳು', mr: 'घटना', gu: 'ઘટનાઓ', ml: 'സംഭവങ്ങൾ', pa: 'ਘਟਨਾਵਾਂ', or: 'ଘଟଣା', ne: 'घटनाहरू', es: 'Incidentes', fr: 'Incidents' },
    'Alerts': { hi: 'अलर्ट', as: 'সতৰ্কবাৰ্তা', bn: 'সতর্কতা', te: 'హెచ్చరికలు', ta: 'எச்சரிக்கைகள்', kn: 'ಎಚ್ಚರಿಕೆಗಳು', mr: 'अलर्ट', gu: 'એલર્ટ', ml: 'അലേർട്ടുകൾ', pa: 'ਅਲਰਟ', or: 'ସତର୍କତା', ne: 'अलर्ट', es: 'Alertas', fr: 'Alertes' },
    'Emergency Response': { hi: 'आपातकालीन प्रतिक्रिया', as: 'জৰুৰীকালীন সঁহাৰি', bn: 'জরুরি সাড়া', te: 'అత్యవసర ప్రతిస్పందన', ta: 'அவசர பதில்', kn: 'ತುರ್ತು ಪ್ರತಿಕ್ರಿಯೆ', mr: 'आपत्कालीन प्रतिसाद', gu: 'કટોકટી પ્રતિભાવ', ml: 'അടിയന്തര പ്രതികരണം', pa: 'ਐਮਰਜੈਂਸੀ ਜਵਾਬ', or: 'ଜରୁରୀ ପ୍ରତିକ୍ରିୟା', ne: 'आपतकालीन प्रतिक्रिया', es: 'Respuesta de emergencia', fr: 'Réponse d’urgence' },
    'AI Route Prediction': { hi: 'एआई मार्ग पूर्वानुमान', as: 'এআই পথ পূৰ্বানুমান', bn: 'এআই রুট পূর্বাভাস', te: 'AI మార్గ అంచనా', ta: 'AI வழி முன்னறிவிப்பு', kn: 'AI ಮಾರ್ಗ ಮುನ್ಸೂಚನೆ', mr: 'एआय मार्ग अंदाज', gu: 'AI માર્ગ આગાહી', ml: 'AI റൂട്ട് പ്രവചനം', pa: 'AI ਰੂਟ ਭਵਿੱਖਬਾਣੀ', or: 'AI ରୁଟ୍ ପୂର୍ବାନୁମାନ', ne: 'एआई मार्ग पूर्वानुमान', es: 'Predicción de rutas IA', fr: 'Prédiction d’itinéraires IA' },
    'Alternate Routes': { hi: 'वैकल्पिक मार्ग', as: 'বিকল্প পথ', bn: 'বিকল্প রুট', te: 'ప్రత్యామ్నాయ మార్గాలు', ta: 'மாற்று வழிகள்', kn: 'ಪರ್ಯಾಯ ಮಾರ್ಗಗಳು', mr: 'पर्यायी मार्ग', gu: 'વૈકલ્પિક માર્ગો', ml: 'ബദൽ റൂട്ടുകൾ', pa: 'ਵਿਕਲਪਕ ਰਸਤੇ', or: 'ବିକଳ୍ପ ରୁଟ୍', ne: 'वैकल्पिक मार्ग', es: 'Rutas alternativas', fr: 'Itinéraires alternatifs' },
    'Vehicle Tracking': { hi: 'वाहन ट्रैकिंग', as: 'বাহন ট্ৰেকিং', bn: 'যান ট্র্যাকিং', te: 'వాహన ట్రాకింగ్', ta: 'வாகன கண்காணிப்பு', kn: 'ವಾಹನ ಟ್ರ್ಯಾಕಿಂಗ್', mr: 'वाहन ट्रॅकिंग', gu: 'વાહન ટ્રેકિંગ', ml: 'വാഹന ട്രാക്കിംഗ്', pa: 'ਵਾਹਨ ਟ੍ਰੈਕਿੰਗ', or: 'ଯାନ ଟ୍ରାକିଂ', ne: 'सवारी ट्र्याकिङ', es: 'Seguimiento de vehículos', fr: 'Suivi des véhicules' },
    'Settings': { hi: 'सेटिंग्स', as: 'ছেটিংছ', bn: 'সেটিংস', te: 'సెట్టింగ్‌లు', ta: 'அமைப்புகள்', kn: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು', mr: 'सेटिंग्ज', gu: 'સેટિંગ્સ', ml: 'ക്രമീകരണങ്ങൾ', pa: 'ਸੈਟਿੰਗਾਂ', or: 'ସେଟିଂସ', ne: 'सेटिङहरू', es: 'Configuración', fr: 'Paramètres' },
    'Language & Region': { hi: 'भाषा और क्षेत्र', as: 'ভাষা আৰু অঞ্চল', bn: 'ভাষা ও অঞ্চল', te: 'భాష & ప్రాంతం', ta: 'மொழி & பகுதி', kn: 'ಭಾಷೆ & ಪ್ರದೇಶ', mr: 'भाषा आणि प्रदेश', gu: 'ભાષા અને પ્રદેશ', ml: 'ഭാഷയും മേഖലയും', pa: 'ਭਾਸ਼ਾ ਅਤੇ ਖੇਤਰ', or: 'ଭାଷା ଏବଂ ଅଞ୍ଚଳ', ne: 'भाषा र क्षेत्र', es: 'Idioma y región', fr: 'Langue et région' },
    'Admin Panel': { hi: 'एडमिन पैनल', as: 'এডমিন পেনেল', bn: 'অ্যাডমিন প্যানেল', te: 'అడ్మిన్ ప్యానెల్', ta: 'நிர்வாக பலகை', kn: 'ಅಡ್ಮಿನ್ ಪ್ಯಾನೆಲ್', mr: 'अॅडмин पॅनेल', gu: 'એડમિન પેનલ', ml: 'അഡ്‌മിൻ പാനൽ', pa: 'ਐਡਮਿਨ ਪੈਨਲ', or: 'ଆଡମିନ୍ ପ୍ୟାନେଲ', ne: 'एडमिन प्यानल', es: 'Panel de administración', fr: 'Panneau d’administration' },
    'Field Report': { hi: 'फील्ड रिपोर्ट', as: 'ফিল্ড ৰিপোৰ্ট', bn: 'ফিল্ড রিপোর্ট', te: 'ఫీల్డ్ రిపోర్ట్', ta: 'கள அறிக்கை', kn: 'ಫೀಲ್ಡ್ ರಿಪೋರ್ಟ್', mr: 'फील्ड अहवाल', gu: 'ફીલ્ડ રિપોર્ટ', ml: 'ഫീൽഡ് റിപ്പോർട്ട്', pa: 'ਫੀਲਡ ਰਿਪੋਰਟ', or: 'ଫିଲ୍ଡ ରିପୋର୍ଟ', ne: 'फिल्ड रिपोर्ट', es: 'Informe de campo', fr: 'Rapport de terrain' },
    'Field Officers': { hi: 'फील्ड अधिकारी', as: 'ফিল্ড বিষয়া', bn: 'ফিল্ড অফিসার', te: 'ఫీల్డ్ అధికారులు', ta: 'கள அதிகாரிகள்', kn: 'ಫೀಲ್ಡ್ ಅಧಿಕಾರಿಗಳು', mr: 'फील्ड अधिकारी', gu: 'ફીલ્ડ અધિકારીઓ', ml: 'ഫീൽഡ് ഓഫീസർമാർ', pa: 'ਫੀਲਡ ਅਫਸਰ', or: 'ଫିଲ୍ଡ ଅଧିକାରୀ', ne: 'फिल्ड अधिकृत', es: 'Oficiales de campo', fr: 'Agents de terrain' },
    'Weather & Risk': { hi: 'मौसम और जोखिम', as: 'বতৰ আৰু বিপদ', bn: 'আবহাওয়া ও ঝুঁকি', te: 'వాతావరణం & ప్రమాదం', ta: 'வானிலை & ஆபத்து', kn: 'ಹವಾಮಾನ & ಅಪಾಯ', mr: 'हवामान आणि धोका', gu: 'હવામાન અને જોખમ', ml: 'കാലാവസ്ഥയും അപകടവും', pa: 'ਮੌਸਮ ਅਤੇ ਖਤਰਾ', or: 'ପାଣିପାଗ ଏବଂ ବିପଦ', ne: 'मौसम र जोखिम', es: 'Clima y riesgo', fr: 'Météo et risque' },
    'Reports': { hi: 'रिपोर्ट', as: 'প্ৰতিবেদন', bn: 'রিপোর্ট', te: 'నివేదికలు', ta: 'அறிக்கைகள்', kn: 'ವರದಿಗಳು', mr: 'अहवाल', gu: 'રિપોર્ટ્સ', ml: 'റിപ്പോർട്ടുകൾ', pa: 'ਰਿਪੋਰਟਾਂ', or: 'ରିପୋର୍ଟ', ne: 'रिपोर्टहरू', es: 'Informes', fr: 'Rapports' },
    'Analytics': { hi: 'एनालिटिक्स', as: 'এনালিটিক্স', bn: 'অ্যানালিটিক্স', te: 'విశ్లేషణలు', ta: 'பகுப்பாய்வு', kn: 'ವಿಶ್ಲೇಷಣೆ', mr: 'विश्लेषण', gu: 'એનાલિટિક્સ', ml: 'അനലിറ്റിക്സ്', pa: 'ਵਿਸ਼ਲੇਸ਼ਣ', or: 'ବିଶ୍ଳେଷଣ', ne: 'एनालिटिक्स', es: 'Analítica', fr: 'Analytique' },
    'Deliveries': { hi: 'डिलीवरी', as: 'ডেলিভাৰী', bn: 'ডেলিভারি', te: 'డెలివరీలు', ta: 'டெலிவரிகள்', kn: 'ವಿತರಣೆಗಳು', mr: 'वितरण', gu: 'ડિલિવરી', ml: 'ഡെലിവറികൾ', pa: 'ਡਿਲੀਵਰੀਆਂ', or: 'ଡେଲିଭରୀ', ne: 'डेलिभरी', es: 'Entregas', fr: 'Livraisons' },
    'Sign Out': { hi: 'साइन आउट', as: 'ছাইন আউট', bn: 'সাইন আউট', te: 'సైన్ అవుట్', ta: 'வெளியேறு', kn: 'ಸೈನ್ ಔಟ್', mr: 'साइन आउट', gu: 'સાઇન આઉટ', ml: 'സൈൻ ഔട്ട്', pa: 'ਸਾਈਨ ਆਉਟ', or: 'ସାଇନ୍ ଆଉଟ୍', ne: 'साइन आउट', es: 'Cerrar sesión', fr: 'Déconnexion' },
    'APPLY LANGUAGE': { hi: 'भाषा लागू करें', as: 'ভাষা প্ৰয়োগ কৰক', bn: 'ভাষা প্রয়োগ করুন', te: 'భాష వర్తింపజేయి', ta: 'மொழியைப் பயன்படுத்து', kn: 'ಭಾಷೆ ಅನ್ವಯಿಸಿ', mr: 'भाषा लागू करा', gu: 'ભાષા લાગુ કરો', ml: 'ഭാഷ പ്രയോഗിക്കുക', pa: 'ਭਾਸ਼ਾ ਲਾਗੂ ਕਰੋ', or: 'ଭାଷା ପ୍ରୟୋଗ କରନ୍ତୁ', ne: 'भाषा लागू गर्नुहोस्', es: 'APLICAR IDIOMA', fr: 'APPLIQUER LA LANGUE' },
    'Currently Active': { hi: 'वर्तमान में सक्रिय', as: 'বৰ্তমান সক্ৰিয়', bn: 'বর্তমানে সক্রিয়', te: 'ప్రస్తుతం సక్రియం', ta: 'தற்போது செயலில்', kn: 'ಪ್ರಸ್ತುತ ಸಕ್ರಿಯ', mr: 'सध्या सक्रिय', gu: 'હાલ સક્રિય', ml: 'നിലവിൽ സജീവം', pa: 'ਮੌਜੂਦਾ ਸਰਗਰਮ', or: 'ସମ୍ପ୍ରତି ସକ୍ରିୟ', ne: 'हाल सक्रिय', es: 'Actualmente activo', fr: 'Actuellement actif' },
    'Interface Language': { hi: 'इंटरफ़ेस भाषा', as: 'ইণ্টাৰফেচ ভাষা', bn: 'ইন্টারফেস ভাষা', te: 'ఇంటర్‌ఫేస్ భాష', ta: 'இடைமுக மொழி', kn: 'ಇಂಟರ್ಫೇಸ್ ಭಾಷೆ', mr: 'इंटरफेस भाषा', gu: 'ઇન્ટરફેસ ભાષા', ml: 'ഇന്റർഫേസ് ഭാഷ', pa: 'ਇੰਟਰਫੇਸ ਭਾਸ਼ਾ', or: 'ଇଣ୍ଟରଫେସ୍ ଭାଷା', ne: 'इन्टरफेस भाषा', es: 'Idioma de la interfaz', fr: 'Langue de l’interface' },
    'OPERATIONS': { hi: 'संचालन', as: 'পৰিচালনা', bn: 'অপারেশন', te: 'ఆపరేషన్స్', ta: 'செயல்பாடுகள்', kn: 'ಕಾರ್ಯಾಚರಣೆಗಳು', mr: 'ऑपरेशन्स', gu: 'ઓપરેશન્સ', ml: 'ഓപ്പറേഷൻസ്', pa: 'ਓਪਰੇਸ਼ਨ', or: 'ଅପରେସନ', ne: 'सञ्चालन', es: 'OPERACIONES', fr: 'OPÉRATIONS' },
    'INTELLIGENCE': { hi: 'इंटेलिजेंस', as: 'ইনটেলিজেন্স', bn: 'ইন্টেলিজেন্স', te: 'ఇంటెలిజెన్స్', ta: 'உளவுத்துறை', kn: 'ಇಂಟೆಲಿಜೆನ್ಸ್', mr: 'इंटेलिजन्स', gu: 'ઇન્ટેલિજન્સ', ml: 'ഇന്റലിജൻസ്', pa: 'ਇੰਟੈਲੀਜੈਂਸ', or: 'ଇଣ୍ଟେଲିଜେନ୍ସ', ne: 'बुद्धिमत्ता', es: 'INTELIGENCIA', fr: 'RENSEIGNEMENT' },
    'TRANSPORT': { hi: 'परिवहन', as: 'পৰিবহণ', bn: 'পরিবহন', te: 'రవాణా', ta: 'போக்குவரத்து', kn: 'ಸಾರಿಗೆ', mr: 'परिवहन', gu: 'પરિવહન', ml: 'ഗതാഗതം', pa: 'ਆਵਾਜਾਈ', or: 'ପରିବହନ', ne: 'यातायात', es: 'TRANSPORTE', fr: 'TRANSPORT' },
    'MONITORING': { hi: 'निगरानी', as: 'নিৰীক্ষণ', bn: 'নিরীক্ষণ', te: 'పర్యవేక్షణ', ta: 'கண்காணிப்பு', kn: 'ಮೇಲ್ವಿಚಾರಣೆ', mr: 'निरीक्षण', gu: 'મોનિટરિંગ', ml: 'നിരീക്ഷണം', pa: 'ਨਿਗਰਾਨੀ', or: 'ମନିଟରିଂ', ne: 'निगरानी', es: 'MONITOREO', fr: 'SURVEILLANCE' },
    'SYSTEM': { hi: 'सिस्टम', as: 'চিস্টেম', bn: 'সিস্টেম', te: 'సిస్టమ్', ta: 'அமைப்பு', kn: 'ಸಿಸ್ಟಮ್', mr: 'सिस्टम', gu: 'સિસ્ટમ', ml: 'സിസ്റ്റം', pa: 'ਸਿਸਟਮ', or: 'ସିଷ୍ଟମ', ne: 'प्रणाली', es: 'SISTEMA', fr: 'SYSTÈME' },
    'FIELD': { hi: 'फील्ड', as: 'ফিল্ড', bn: 'ফিল্ড', te: 'ఫీల్డ్', ta: 'களம்', kn: 'ಫೀಲ್ಡ್', mr: 'फील्ड', gu: 'ફીલ્ડ', ml: 'ഫീൽഡ്', pa: 'ਫੀਲਡ', or: 'ଫିଲ୍ଡ', ne: 'फिल्ड', es: 'CAMPO', fr: 'TERRAIN' },
    'ANALYTICS': { hi: 'एनालिटिक्स', as: 'এনালিটিক্স', bn: 'অ্যানালিটিক্স', te: 'విశ్లేషణలు', ta: 'பகுப்பாய்வு', kn: 'ವಿಶ್ಲೇಷಣೆ', mr: 'विश्लेषण', gu: 'એનાલિટિક્સ', ml: 'അനലിറ്റിക്സ്', pa: 'ਵਿਸ਼ਲੇਸ਼ਣ', or: 'ବିଶ୍ଳେଷଣ', ne: 'एनालिटिक्स', es: 'ANALÍTICA', fr: 'ANALYTIQUE' },
    'Risk Corridors': { hi: 'जोखिम गलियारे', as: 'বিপদৰ কৰিডৰ', bn: 'ঝুঁকি করিডোর', te: 'ప్రమాద కారిడార్లు', ta: 'ஆபத்து வழித்தடங்கள்', kn: 'ಅಪಾಯ ಕಾರಿಡಾರ್‌ಗಳು', mr: 'धोका कॉरिडॉर', gu: 'જોખમ કોરિડોર', ml: 'അപകട ഇടനാഴികൾ', pa: 'ਖਤਰੇ ਵਾਲੇ ਕਾਰੀਡੋਰ', or: 'ବିପଦ କରିଡର', ne: 'जोखिम करिडोर', es: 'Corredores de riesgo', fr: 'Corridors à risque' },
    'Districts': { hi: 'जिले', as: 'জিলাসমূহ', bn: 'জেলা', te: 'జిల్లాలు', ta: 'மாவட்டங்கள்', kn: 'ಜಿಲ್ಲೆಗಳು', mr: 'जिल्हे', gu: 'જિલ્લાઓ', ml: 'ജില്ലകൾ', pa: 'ਜ਼ਿਲ੍ਹੇ', or: 'ଜିଲ୍ଲା', ne: 'जिल्लाहरू', es: 'Distritos', fr: 'Districts' },
    'Infrastructure': { hi: 'अवसंरचना', as: 'আন্তঃগাঁথনি', bn: 'অবকাঠামো', te: 'మౌలిక సదుపాయాలు', ta: 'உள்கட்டமைப்பு', kn: 'ಮೂಲಸೌಕರ್ಯ', mr: 'पायाभूत सुविधा', gu: 'ઈન્ફ્રાસ્ટ્રક્ચર', ml: 'അടിസ്ഥാന സൗകര്യം', pa: 'ਬੁਨਿਆਦੀ ਢਾਂਚਾ', or: 'ଭିତ୍ତିଭୂମି', ne: 'पूर्वाधार', es: 'Infraestructura', fr: 'Infrastructure' },
    'Live Simulation': { hi: 'लाइव सिमुलेशन', as: 'লাইভ ছিমুলেচন', bn: 'লাইভ সিমুলেশন', te: 'లైవ్ సిమ్యులేషన్', ta: 'நேரடி உருவகப்படுத்துதல்', kn: 'ಲೈವ್ ಸಿಮ್ಯುಲೇಶನ್', mr: 'लाइव्ह सिम्युलेशन', gu: 'લાઇવ સિમ્યુલેશન', ml: 'ലൈവ് സിമുലേഷൻ', pa: 'ਲਾਈਵ ਸਿਮੂਲੇਸ਼ਨ', or: 'ଲାଇଭ୍ ସିମୁଲେସନ', ne: 'लाइभ सिमुलेसन', es: 'Simulación en vivo', fr: 'Simulation en direct' },
    'Officer Dashboard': { hi: 'अधिकारी डैशबोर्ड', as: 'বিষয়া ডেশ্বব’ৰ্ড', bn: 'অফিসার ড্যাশবোর্ড', te: 'అధికారి డాష్‌బోర్డ్', ta: 'அதிகாரி டாஷ்போர்டு', kn: 'ಅಧಿಕಾರಿ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', mr: 'अधिकारी डॅशबोर्ड', gu: 'અધિકારી ડેશબોર્ડ', ml: 'ഓഫീസർ ഡാഷ്ബോർഡ്', pa: 'ਅਫਸਰ ਡੈਸ਼ਬੋਰਡ', or: 'ଅଧିକାରୀ ଡ୍ୟାସବୋର୍ଡ', ne: 'अधिकृत ड्यासबोर्ड', es: 'Panel del oficial', fr: 'Tableau de bord agent' },
    'AI Command Center': { hi: 'एआई कमांड सेंटर', as: 'এআই কমাণ্ড চেণ্টাৰ', bn: 'এআই কমান্ড সেন্টার', te: 'AI కమాండ్ సెంటర్', ta: 'AI கட்டளை மையம்', kn: 'AI ಕಮಾಂಡ್ ಸೆಂಟರ್', mr: 'एआय कमांड सेंटर', gu: 'AI કમાન્ડ સેન્ટર', ml: 'AI കമാൻഡ് സെന്റർ', pa: 'AI ਕਮਾਂਡ ਸੈਂਟਰ', or: 'AI କମାଣ୍ଡ ସେଣ୍ଟର', ne: 'एआई कमान्ड सेन्टर', es: 'Centro de mando IA', fr: 'Centre de commande IA' },
    'AI Photo Analysis': { hi: 'एआई फोटो विश्लेषण', as: 'এআই ফটো বিশ্লেষণ', bn: 'এআই ফটো বিশ্লেষণ', te: 'AI ఫోటో విశ్లేషణ', ta: 'AI புகைப்பட பகுப்பாய்வு', kn: 'AI ಫೋಟೋ ವಿಶ್ಲೇಷಣೆ', mr: 'एआय फोटो विश्लेषण', gu: 'AI ફોટો વિશ્લેષણ', ml: 'AI ഫോട്ടോ വിശകലനം', pa: 'AI ਫੋਟੋ ਵਿਸ਼ਲੇਸ਼ਣ', or: 'AI ଫଟୋ ବିଶ୍ଳେଷଣ', ne: 'एआई फोटो विश्लेषण', es: 'Análisis de fotos IA', fr: 'Analyse photo IA' },
    'LIVE': { hi: 'लाइव', as: 'লাইভ', bn: 'লাইভ', te: 'లైవ్', ta: 'நேரடி', kn: 'ಲೈವ್', mr: 'लाइव्ह', gu: 'લાઇવ', ml: 'ലൈവ്', pa: 'ਲਾਈਵ', or: 'ଲାଇଭ୍', ne: 'लाइभ', es: 'EN VIVO', fr: 'EN DIRECT' }
  };

  // Reverse maps: any known translation -> English, so we can re-translate
  var TO_ENGLISH = {};
  Object.keys(PHRASES).forEach(function (en) {
    TO_ENGLISH[en] = en;
    var row = PHRASES[en];
    Object.keys(row).forEach(function (code) {
      TO_ENGLISH[row[code]] = en;
    });
  });

  function getStoredLang() {
    try { return localStorage.getItem('sr_language') || 'en'; } catch (e) { return 'en'; }
  }

  function buildTargetMap(code) {
    var map = {};
    if (!code) code = 'en';
    Object.keys(PHRASES).forEach(function (en) {
      if (code === 'en') {
        map[en] = en;
      } else if (PHRASES[en][code]) {
        map[en] = PHRASES[en][code];
      }
      // also map every other language variant -> target
      Object.keys(PHRASES[en]).forEach(function (c) {
        var src = PHRASES[en][c];
        if (code === 'en') map[src] = en;
        else if (PHRASES[en][code]) map[src] = PHRASES[en][code];
      });
    });
    if (window.SmartRouteI18n && SmartRouteI18n.t) {
      ALL_KEYS.forEach(function (key) {
        var en = SmartRouteI18n.t(key, 'en');
        var tr = SmartRouteI18n.t(key, code);
        if (en && tr) {
          map[en] = tr;
          // all language versions of this key
          ['hi','as','bn','te','ta','kn','mr','gu','ml','pa','or','ne','es','fr'].forEach(function (c) {
            var v = SmartRouteI18n.t(key, c);
            if (v && v !== key) map[v] = tr;
          });
        }
      });
    }
    return map;
  }

  function translateText(text, map) {
    if (!text || !map) return text;
    var t = text.trim();
    if (!t) return text;
    if (map[t]) return text.replace(t, map[t]);
    var lower = t.toLowerCase();
    for (var k in map) {
      if (k.toLowerCase() === lower) return text.replace(t, map[k]);
    }
    return text;
  }

  function walkAndTranslate(root, map) {
    if (!root || !map) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var parent = node.parentElement;
      if (!parent) return;
      var tag = parent.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'CODE') return;
      if (parent.closest && parent.closest('[data-i18n-skip]')) return;
      var original = node.nodeValue;
      if (!original || !original.trim()) return;
      if (/^[\d\s.,:+\-°%/()]+$/.test(original.trim())) return;
      var next = translateText(original, map);
      if (next !== original) node.nodeValue = next;
    });
    root.querySelectorAll('[placeholder],[title],[aria-label]').forEach(function (el) {
      ['placeholder', 'title', 'aria-label'].forEach(function (attr) {
        if (!el.hasAttribute(attr)) return;
        var v = el.getAttribute(attr);
        var nv = translateText(v, map);
        if (nv !== v) el.setAttribute(attr, nv);
      });
    });
  }

  function applyByKeys(code) {
    if (!window.SmartRouteI18n) return;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var translated = SmartRouteI18n.t(key, code);
      if (translated && translated !== key) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.setAttribute('placeholder', translated);
        } else {
          el.textContent = translated;
        }
      }
    });
  }

  function deepApply(code) {
    code = code || getStoredLang();
    try { localStorage.setItem('sr_language', code); } catch (e) {}
    document.documentElement.lang = code;
    if (window.SmartRouteI18n) SmartRouteI18n._currentLang = code;

    applyByKeys(code);
    var map = buildTargetMap(code);
    walkAndTranslate(document.body, map);

    try {
      window.dispatchEvent(new CustomEvent('smartroute:language-changed', { detail: { language: code } }));
    } catch (e) {}
  }

  function patch() {
    if (!window.SmartRouteI18n) return false;

    var origApply = SmartRouteI18n.applyLanguage.bind(SmartRouteI18n);
    SmartRouteI18n.applyLanguage = function (code) {
      code = code || this.getLanguage();
      try { origApply(code); } catch (e) {}
      deepApply(code);
    };
    SmartRouteI18n.applyDeep = deepApply;

    var stored = getStoredLang();
    SmartRouteI18n._currentLang = stored;
    deepApply(stored);
    return true;
  }

  function boot() {
    var tries = 0;
    var t = setInterval(function () {
      tries++;
      if (patch() || tries > 60) clearInterval(t);
    }, 50);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  setTimeout(function () {
    if (window.SmartRouteI18n) deepApply(getStoredLang());
  }, 700);
})();
