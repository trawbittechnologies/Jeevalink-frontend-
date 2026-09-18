/**
 * webPushService.js
 *
 * Standards-based VAPID Web Push client service.
 * Handles service worker registration, push subscription,
 * and backend synchronization.
 *
 * Does NOT use Firebase Cloud Messaging.
 */

import api from '../store/api.js';

/** @type {ServiceWorkerRegistration | null} */
let swRegistration = null;

// ─── Service Worker Registration ──────────────────────────────────────────────

/**
 * Register the JeevaLink service worker (/sw.js).
 * Returns the existing registration if already registered.
 *
 * @returns {Promise<ServiceWorkerRegistration | null>}
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('[WebPush] Service Worker not supported in this browser.');
    return null;
  }

  try {
    if (swRegistration) return swRegistration;

    swRegistration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none', // always check for SW updates
    });

    // Wait for the SW to be active
    await navigator.serviceWorker.ready;

    console.info('[WebPush] Service worker registered and active.');
    return swRegistration;
  } catch (err) {
    console.error('[WebPush] Service worker registration failed:', err);
    return null;
  }
}

// ─── VAPID Public Key ──────────────────────────────────────────────────────────

/**
 * Fetch the VAPID public key from the backend.
 * Cached after first fetch.
 *
 * @returns {Promise<string | null>}
 */
let cachedVapidKey = null;

export async function getVapidPublicKey() {
  if (cachedVapidKey) return cachedVapidKey;

  try {
    const res = await api.get('/notifications/vapid-key');
    const key = res.data?.data?.vapidPublicKey || res.data?.data?.vapid_public_key;
    if (key) {
      cachedVapidKey = key;
      return key;
    }
    console.warn('[WebPush] Server returned no VAPID public key.');
    return null;
  } catch (err) {
    console.error('[WebPush] Failed to fetch VAPID public key:', err?.message);
    return null;
  }
}

// ─── Push Subscription ────────────────────────────────────────────────────────

/**
 * Convert a base64url VAPID public key to a Uint8Array for PushManager.subscribe.
 *
 * @param {string} base64String
 * @returns {Uint8Array}
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribe the browser to push notifications.
 * Requires an active service worker and the VAPID public key.
 *
 * @param {ServiceWorkerRegistration} registration
 * @returns {Promise<PushSubscription | null>}
 */
export async function subscribeToPush(registration) {
  if (!('PushManager' in window)) {
    console.warn('[WebPush] Push API not supported in this browser.');
    return null;
  }

  try {
    const vapidKey = await getVapidPublicKey();
    if (!vapidKey) {
      console.warn('[WebPush] No VAPID public key — cannot subscribe.');
      return null;
    }

    const applicationServerKey = urlBase64ToUint8Array(vapidKey);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    console.info('[WebPush] Push subscription created.');
    return subscription;
  } catch (err) {
    if (err.name === 'NotAllowedError') {
      console.warn('[WebPush] Push subscription blocked by user (NotAllowedError).');
    } else {
      console.error('[WebPush] PushManager.subscribe failed:', err);
    }
    return null;
  }
}

/**
 * Unsubscribe the browser from push notifications.
 *
 * @param {ServiceWorkerRegistration} registration
 * @returns {Promise<boolean>}
 */
export async function unsubscribeFromPush(registration) {
  try {
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      const result = await existing.unsubscribe();
      console.info('[WebPush] Unsubscribed from push.');
      return result;
    }
    return true;
  } catch (err) {
    console.error('[WebPush] Unsubscribe failed:', err);
    return false;
  }
}

// ─── Backend Sync ─────────────────────────────────────────────────────────────

/**
 * Detect browser name from user agent.
 *
 * @returns {string}
 */
function detectBrowser() {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  return 'Unknown';
}

/**
 * Sync a push subscription with the JeevaLink backend.
 * Sends endpoint, p256dh, and auth keys — never private key.
 *
 * @param {PushSubscription} subscription
 * @returns {Promise<boolean>}
 */
export async function syncSubscriptionWithBackend(subscription) {
  try {
    const subscriptionJSON = subscription.toJSON();

    await api.post('/notifications/vapid-subscribe', {
      endpoint:    subscriptionJSON.endpoint,
      keys:        {
        p256dh: subscriptionJSON.keys?.p256dh,
        auth:   subscriptionJSON.keys?.auth,
      },
      browser:      detectBrowser(),
      device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'web',
    });

    console.info('[WebPush] Subscription synced with backend.');
    return true;
  } catch (err) {
    console.error('[WebPush] Failed to sync subscription with backend:', err?.message);
    return false;
  }
}

/**
 * Remove a push subscription from the JeevaLink backend.
 *
 * @param {PushSubscription} subscription
 * @returns {Promise<boolean>}
 */
export async function removeSubscriptionFromBackend(subscription) {
  try {
    const endpoint = subscription.endpoint || (subscription.toJSON?.()?.endpoint);
    if (!endpoint) return true;

    await api.delete('/notifications/vapid-unsubscribe', {
      data: { endpoint },
    });

    console.info('[WebPush] Subscription removed from backend.');
    return true;
  } catch (err) {
    console.warn('[WebPush] Failed to remove subscription from backend (non-critical):', err?.message);
    return false;
  }
}

// ─── Permission Helpers ───────────────────────────────────────────────────────

/**
 * Get the current Notification permission status.
 *
 * @returns {'default' | 'granted' | 'denied' | 'unsupported'}
 */
export function getPermissionStatus() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

/**
 * Check if the Push API is supported in this browser.
 *
 * @returns {boolean}
 */
export function isPushSupported() {
  return 'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;
}

/**
 * Check if the user currently has an active push subscription.
 *
 * @returns {Promise<boolean>}
 */
export async function hasActiveSubscription() {
  try {
    if (!swRegistration) {
      swRegistration = await navigator.serviceWorker.ready.catch(() => null);
    }
    if (!swRegistration) return false;

    const sub = await swRegistration.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}

// ─── High-Level API ───────────────────────────────────────────────────────────

/**
 * Full push notification setup flow:
 * 1. Check browser support
 * 2. Request notification permission
 * 3. Register service worker
 * 4. Subscribe to push
 * 5. Sync with backend
 *
 * @returns {Promise<{success: boolean, permission: string, error?: string}>}
 */
export async function initPushNotifications() {
  if (!isPushSupported()) {
    console.warn('[WebPush] Push not supported in this browser.');
    return { success: false, permission: 'unsupported', error: 'Push not supported' };
  }

  // Step 1: Request notification permission
  let permission = Notification.permission;
  if (permission === 'default') {
    try {
      permission = await Notification.requestPermission();
    } catch (err) {
      console.error('[WebPush] requestPermission failed:', err);
      return { success: false, permission: 'default', error: err.message };
    }
  }

  if (permission !== 'granted') {
    console.warn('[WebPush] Notification permission not granted:', permission);
    return { success: false, permission };
  }

  // Step 2: Register service worker
  const registration = await registerServiceWorker();
  if (!registration) {
    return { success: false, permission, error: 'Service worker registration failed' };
  }

  // Step 3: Check for existing subscription first
  let subscription = await registration.pushManager.getSubscription().catch(() => null);

  // Step 4: Create new subscription if none exists
  if (!subscription) {
    subscription = await subscribeToPush(registration);
    if (!subscription) {
      return { success: false, permission, error: 'Push subscription failed' };
    }
  }

  // Step 5: Sync with backend
  const synced = await syncSubscriptionWithBackend(subscription);
  if (!synced) {
    console.warn('[WebPush] Backend sync failed — push may not work until synced.');
  }

  return { success: true, permission };
}

/**
 * Full cleanup flow for logout:
 * Unsubscribes from push and notifies the backend.
 *
 * @returns {Promise<void>}
 */
export async function cleanupPushNotifications() {
  try {
    if (!swRegistration) {
      if ('serviceWorker' in navigator) {
        swRegistration = await navigator.serviceWorker.ready.catch(() => null);
      }
    }
    if (!swRegistration) return;

    const subscription = await swRegistration.pushManager.getSubscription().catch(() => null);
    if (!subscription) return;

    await removeSubscriptionFromBackend(subscription);
    await unsubscribeFromPush(swRegistration);
  } catch (err) {
    console.warn('[WebPush] Cleanup error (non-critical):', err?.message);
  }
}
