/**
 * firebaseMessaging.js
 *
 * MIGRATED: Firebase Cloud Messaging removed.
 * Now backed by standards-based VAPID Web Push (webPushService.js).
 *
 * Public API is IDENTICAL to the original file so that all existing callers
 * (App.jsx, Settings.jsx) do not require any import changes.
 *
 * Exported functions:
 *   initializeMessaging()          — no-op, kept for compatibility
 *   refreshFcmToken()              — silently (re)registers Web Push subscription
 *   requestNotificationPermission() — requests permission + subscribes to Web Push
 *   removeNotificationToken()       — unsubscribes + removes from backend
 *   onForegroundMessage(callback)   — listens for SW foreground relay messages
 */

import {
  initPushNotifications,
  cleanupPushNotifications,
  isPushSupported,
  getPermissionStatus,
  registerServiceWorker,
} from './webPushService.js';

// ─── initializeMessaging ──────────────────────────────────────────────────────
// Kept for API compatibility. No-op in Web Push mode.
export const initializeMessaging = async () => {
  return null;
};

// ─── refreshFcmToken ─────────────────────────────────────────────────────────
// Silently (re-)registers the VAPID push subscription on page load.
// Called by App.jsx on every token-present page load.
export const refreshFcmToken = async () => {
  try {
    if (!isPushSupported()) return;
    if (getPermissionStatus() !== 'granted') return;

    const result = await initPushNotifications();
    if (result.success) {
      console.info('[WebPush] Push subscription refreshed and synced.');
    }
  } catch (err) {
    console.warn('[WebPush] refreshFcmToken (non-critical):', err?.message);
  }
};

// ─── requestNotificationPermission ───────────────────────────────────────────
// Called by Settings.jsx toggle when user wants to enable push notifications.
// Returns a truthy value on success (subscription endpoint), null on failure.
export const requestNotificationPermission = async () => {
  try {
    if (!isPushSupported()) {
      console.warn('[WebPush] Push not supported in this browser.');
      return null;
    }

    const result = await initPushNotifications();

    if (result.success) {
      // Return a non-null truthy value to indicate success (caller checks truthiness)
      // Get the actual endpoint from the active subscription
      const swReg = await navigator.serviceWorker.ready.catch(() => null);
      if (swReg) {
        const sub = await swReg.pushManager.getSubscription().catch(() => null);
        return sub?.endpoint || 'subscribed';
      }
      return 'subscribed';
    }

    return null;
  } catch (error) {
    console.error('[WebPush] requestNotificationPermission error:', error);
    throw error;
  }
};

// ─── removeNotificationToken ──────────────────────────────────────────────────
// Called by Settings.jsx when user disables push notifications.
export const removeNotificationToken = async () => {
  try {
    await cleanupPushNotifications();
  } catch (error) {
    console.error('[WebPush] removeNotificationToken error:', error);
    throw error;
  }
};

// ─── onForegroundMessage ──────────────────────────────────────────────────────
// Register a callback for foreground push messages relayed by the service worker.
// Returns an unsubscribe function (same API as firebase onMessage).
export const onForegroundMessage = async (callback) => {
  if (!('serviceWorker' in navigator)) {
    console.warn('[WebPush] Service Worker not available — foreground listener skipped.');
    return () => {};
  }

  // Ensure SW is registered so the message channel is active
  await registerServiceWorker().catch(() => {});

  const handler = (event) => {
    const data = event.data;
    if (!data || data.type !== 'WEBPUSH_FOREGROUND') return;

    // Normalize to a structure similar to what callers expect from FCM payloads
    const normalizedPayload = {
      notification: {
        title: data.title || '',
        body:  data.body  || '',
      },
      data: {
        ...(data.data || {}),
        title:     data.title || '',
        body:      data.body  || '',
        priority:  data.priority || 'moderate',
        requestId: data.requestId || '',
        url:       data.url || '',
      },
    };

    callback(normalizedPayload);
  };

  navigator.serviceWorker.addEventListener('message', handler);
  console.info('[WebPush] Foreground message listener active.');

  // Return unsubscribe function
  return () => {
    navigator.serviceWorker.removeEventListener('message', handler);
  };
};
