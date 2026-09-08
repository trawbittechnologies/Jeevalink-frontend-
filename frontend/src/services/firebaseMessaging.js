import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import api from '../store/api';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Prevent "Firebase App already exists" error on hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const getSwUrl = () =>
  `/firebase-messaging-sw.js?apiKey=${firebaseConfig.apiKey}` +
  `&authDomain=${firebaseConfig.authDomain}` +
  `&projectId=${firebaseConfig.projectId}` +
  `&storageBucket=${firebaseConfig.storageBucket}` +
  `&messagingSenderId=${firebaseConfig.messagingSenderId}` +
  `&appId=${firebaseConfig.appId}`;

let messagingInstance = null;

const getMessagingInstance = async () => {
  if (messagingInstance) return messagingInstance;
  try {
    const supported = await isSupported();
    if (!supported) return null;
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch (err) {
    console.error('[FCM] getMessaging failed:', err);
    return null;
  }
};

// ─── Public API ────────────────────────────────────────────────────────────────

export const initializeMessaging = getMessagingInstance;

/**
 * Silently get the latest FCM token and sync it to the backend.
 * Called on page load to ensure the token is always fresh after SW updates.
 */
export const refreshFcmToken = async () => {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const msg = await getMessagingInstance();
    if (!msg) return;

    const registration = await navigator.serviceWorker.register(getSwUrl());
    await navigator.serviceWorker.ready;

    const token = await getToken(msg, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      await api.post('/notifications/register-token', {
        token,
        device_type: navigator.userAgent
      });
      console.log('[FCM] Token refreshed and synced:', token.slice(0, 20) + '...');
    }
  } catch (err) {
    console.warn('[FCM] Token refresh failed (non-critical):', err.message);
  }
};

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const msg = await getMessagingInstance();
    if (!msg) return null;

    const registration = await navigator.serviceWorker.register(getSwUrl());

    const token = await getToken(msg, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      await api.post('/notifications/register-token', {
        token,
        device_type: navigator.userAgent
      });
      console.log('[FCM] Token registered successfully');
      return token;
    }
    return null;
  } catch (error) {
    console.error('[FCM] requestNotificationPermission error:', error);
    throw error;
  }
};

export const removeNotificationToken = async () => {
  try {
    const msg = await getMessagingInstance();
    if (!msg) return;

    const registration = await navigator.serviceWorker.register(getSwUrl());
    const token = await getToken(msg, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      await api.delete('/notifications/remove-token', { data: { token } });
    }
  } catch (error) {
    console.error('[FCM] removeNotificationToken error:', error);
    throw error;
  }
};

/**
 * Register a foreground message listener.
 * Firebase's onMessage only fires when the page is in the foreground.
 */
export const onForegroundMessage = async (callback) => {
  try {
    const msg = await getMessagingInstance();
    if (!msg) {
      console.warn('[FCM] Messaging not available — foreground listener skipped.');
      return () => {};
    }
    console.log('[FCM] Registering foreground message listener...');
    const unsubscribe = onMessage(msg, (payload) => {
      console.log('[FCM] Foreground message received:', payload);
      callback(payload);
    });
    console.log('[FCM] Foreground listener active.');
    return unsubscribe;
  } catch (err) {
    console.error('[FCM] onForegroundMessage setup error:', err);
    return () => {};
  }
};
