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

// A promise that resolves to the messaging instance (or null).
// Stored so any caller can await it instead of reading a potentially-null variable.
let messagingReady = Promise.resolve(null);

// Auto-initialize if notification permission is already granted
// so foreground message listeners work on page load without needing
// the user to click "Allow Notifications" again.
if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
  messagingReady = isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    }
    return messaging;
  }).catch(() => null);
}

export const initializeMessaging = async () => {
  try {
    const supported = await isSupported();
    if (supported) {
      messaging = getMessaging(app);
      return messaging;
    }
    console.warn('Firebase Messaging is not supported in this browser.');
    return null;
  } catch (error) {
    console.error('Error initializing Firebase Messaging:', error);
    return null;
  }
};

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const msg = messaging || await initializeMessaging();
      if (!msg) return null;

      const swUrl = `/firebase-messaging-sw.js?apiKey=${firebaseConfig.apiKey}&authDomain=${firebaseConfig.authDomain}&projectId=${firebaseConfig.projectId}&storageBucket=${firebaseConfig.storageBucket}&messagingSenderId=${firebaseConfig.messagingSenderId}&appId=${firebaseConfig.appId}`;
      const registration = await navigator.serviceWorker.register(swUrl);

      const token = await getToken(msg, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      if (token) {
        await api.post('/notifications/register-token', {
          token,
          device_type: navigator.userAgent
        });
        return token;
      }
    }
    return null;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    throw error;
  }
};

export const removeNotificationToken = async () => {
  try {
    const msg = messaging || await initializeMessaging();
    if (!msg) return;

    const swUrl = `/firebase-messaging-sw.js?apiKey=${firebaseConfig.apiKey}&authDomain=${firebaseConfig.authDomain}&projectId=${firebaseConfig.projectId}&storageBucket=${firebaseConfig.storageBucket}&messagingSenderId=${firebaseConfig.messagingSenderId}&appId=${firebaseConfig.appId}`;
    const registration = await navigator.serviceWorker.register(swUrl);

    // Get current token to remove it from backend
    const token = await getToken(msg, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration
    });
    
    if (token) {
      await api.delete('/notifications/remove-token', {
        data: { token }
      });
      // Optionally could delete token from IndexedDB/Firebase but typically backend removal is sufficient
    }
  } catch (error) {
    console.error('Error removing notification token:', error);
    throw error;
  }
};

export const onForegroundMessage = async (callback) => {
  // Wait for messaging to be initialized (handles the async init race condition)
  const msg = messaging || await messagingReady || await initializeMessaging();
  if (!msg) return () => {};
  return onMessage(msg, callback);
};
