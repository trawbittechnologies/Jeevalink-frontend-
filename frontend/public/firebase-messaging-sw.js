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
self.addEventListener('push', (event) => {
  let rawText = null;
  let payload = null;

  // Try to read event data in all formats for debugging
  try { rawText = event.data?.text(); } catch (_) {}
  try { payload = event.data?.json(); } catch (_) {
    try { payload = JSON.parse(rawText); } catch (__) {}
  }

  console.log('[SW] Push event fired. raw:', rawText, 'parsed:', payload);

  // Extract title/body from any known FCM format
  const title = payload?.notification?.title
    || payload?.data?.title
    || payload?.title
    || payload?.aps?.alert?.title
    || '';
  const body  = payload?.notification?.body
    || payload?.data?.body
    || payload?.body
    || payload?.aps?.alert?.body
    || '';

  // Always relay to page (even without title) so we can debug in console
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        console.log('[SW] Relaying to', clients.length, 'client(s)');
        clients.forEach((client) => {
          client.postMessage({
            type: 'FCM_PUSH',
            title: title || '(no title)',
            body,
            raw: rawText,
            data: payload?.data || {},
          });
        });
      })
  );
});

