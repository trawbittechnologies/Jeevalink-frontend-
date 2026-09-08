import { initializeApp } from 'firebase/app';
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

const app = initializeApp(firebaseConfig);

let messaging = null;

// Build the SW URL with firebase config as query params
const getSwUrl = () =>
  `/firebase-messaging-sw.js?apiKey=${firebaseConfig.apiKey}` +
  `&authDomain=${firebaseConfig.authDomain}` +
  `&projectId=${firebaseConfig.projectId}` +
  `&storageBucket=${firebaseConfig.storageBucket}` +
  `&messagingSenderId=${firebaseConfig.messagingSenderId}` +
  `&appId=${firebaseConfig.appId}`;

/**
 * Initialize Firebase Messaging with the service worker registered.
 * Returns the messaging instance or null if unsupported.
 */
export const initializeMessaging = async () => {
  if (messaging) return messaging;

  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn('[FCM] Firebase Messaging not supported in this browser.');
      return null;
    }

    // Register service worker first — FCM needs it to function
    const registration = await navigator.serviceWorker.register(getSwUrl());
    await navigator.serviceWorker.ready;

    messaging = getMessaging(app);
    console.log('[FCM] Messaging initialized successfully.');
    return messaging;
  } catch (error) {
    console.error('[FCM] Error initializing messaging:', error);
    return null;
  }
};

/**
 * A promise that resolves to the messaging instance.
 * Auto-initializes on page load if permission is already granted,
 * so foreground listeners work without requiring the user to re-grant permission.
 */
let messagingReady;

if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
  console.log('[FCM] Permission already granted — auto-initializing messaging...');
  messagingReady = initializeMessaging();
} else {
  messagingReady = Promise.resolve(null);
}

/**
 * Request notification permission, register SW, get FCM token, and save to backend.
 */
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const msg = await initializeMessaging();
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
      console.log('[FCM] Token registered:', token);
      return token;
    }

    return null;
  } catch (error) {
    console.error('[FCM] Error requesting notification permission:', error);
    throw error;
  }
};

/**
 * Remove the current FCM token from the backend.
 */
export const removeNotificationToken = async () => {
  try {
    const msg = await messagingReady || await initializeMessaging();
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
    console.error('[FCM] Error removing notification token:', error);
    throw error;
  }
};

/**
 * Register a foreground message listener.
 * Waits for messaging to be initialized before attaching the listener.
 * Returns an unsubscribe function.
 */
export const onForegroundMessage = async (callback) => {
  const msg = await messagingReady || await initializeMessaging();
  if (!msg) {
    console.warn('[FCM] Could not initialize messaging — foreground listener not registered.');
    return () => {};
  }
  console.log('[FCM] Foreground message listener registered.');
  return onMessage(msg, callback);
};
