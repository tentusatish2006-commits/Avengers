/* SmartRoute FCM service worker — background push */
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

var swFirebaseConfig = self.__SR_FIREBASE_CONFIG || null;

self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'SR_FIREBASE_CONFIG') {
    swFirebaseConfig = event.data.config;
    tryInit();
  }
});

var messaging = null;

function tryInit() {
  if (!swFirebaseConfig || !swFirebaseConfig.apiKey || !swFirebaseConfig.projectId) return;
  try {
    if (!firebase.apps.length) firebase.initializeApp(swFirebaseConfig);
    messaging = firebase.messaging();
    messaging.onBackgroundMessage(function (payload) {
      var title = (payload.notification && payload.notification.title) || (payload.data && payload.data.title) || 'SmartRoute Alert';
      var body = (payload.notification && payload.notification.body) || (payload.data && payload.data.message) || '';
      var link = (payload.data && payload.data.link) || '/alerts.html';
      self.registration.showNotification(title, {
        body: body,
        icon: '/favicon.ico',
        data: { link: link, payload: payload.data || {} },
        tag: (payload.data && payload.data.event_id) || undefined
      });
    });
  } catch (e) {
    console.warn('[FCM SW] init', e);
  }
}

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var link = (event.notification.data && event.notification.data.link) || '/alerts.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        if (c.url && 'focus' in c) {
          c.navigate(link);
          return c.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(link);
    })
  );
});

tryInit();
