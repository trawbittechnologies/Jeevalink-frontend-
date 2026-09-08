/* global importScripts, firebase */

importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

const params = new URL(location).searchParams;

const firebaseConfig = {
  apiKey: params.get('apiKey'),
  authDomain: params.get('authDomain'),
  projectId: params.get('projectId'),
  storageBucket: params.get('storageBucket'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId')
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// ─── Background handler (tab not open / not focused) ─────────────────────────
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] onBackgroundMessage:', payload);
  const title = payload.notification?.title || 'JeevaLink Alert';
  const body  = payload.notification?.body  || '';
  self.registration.showNotification(title, {
    body,
    icon: '/logo.png',
    badge: '/favicon.png',
    tag: 'jeevalink-notification',
    data: payload.data,
  });
});

// ─── Raw push relay (ALWAYS fires — foreground AND background) ───────────────
// This runs for every incoming push, regardless of page focus state.
// It relays the notification data to all open page windows via postMessage,
// so the React app can display an in-app toast even when onMessage doesn't fire.
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = null;
  try { payload = event.data.json(); } catch (_) {
    try { payload = JSON.parse(event.data.text()); } catch (__) { return; }
  }

  // Extract title/body from any known FCM format
  const title = payload?.notification?.title
    || payload?.data?.title
    || payload?.title
    || '';
  const body  = payload?.notification?.body
    || payload?.data?.body
    || payload?.body
    || '';

  if (!title && !body) return; // skip internal Firebase keep-alive pings

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'FCM_PUSH',
            title,
            body,
            data: payload?.data || {},
          });
        });
      })
  );
});
