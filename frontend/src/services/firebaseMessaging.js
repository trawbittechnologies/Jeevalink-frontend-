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

      const token = await getToken(msg, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });

      if (token) {
        await api.post('/notifications/token', {
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

    // Get current token to remove it from backend
    const token = await getToken(msg, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
    });
    
    if (token) {
      await api.delete('/notifications/token', {
        data: { token }
      });
      // Optionally could delete token from IndexedDB/Firebase but typically backend removal is sufficient
    }
  } catch (error) {
    console.error('Error removing notification token:', error);
    throw error;
  }
};

export const onForegroundMessage = (callback) => {
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
};
