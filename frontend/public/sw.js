/**
 * sw.js — JeevaLink Service Worker
 *
 * Standards-based VAPID Web Push handler.
 * Does NOT import or depend on Firebase.
 *
 * Push payload structure:
 * {
 *   type:       "BLOOD_REQUEST",
 *   requestId:  "123",
 *   priority:   "moderate" | "critical" | "immediate",
 *   title:      "🚨 IMMEDIATE BLOOD REQUEST",
 *   body:       "O+ blood needed at ABC Hospital",
 *   bloodGroup: "O+",
 *   hospital:   "ABC Hospital",
 *   url:        "/blood-requests/123" | "/emergency-request/123",
 *   timestamp:  "1700000000"
 * }
 */

/* eslint-disable no-restricted-globals */

const JEEVALINK_ORIGIN = self.location.origin;

// ─── Priority Configuration (inlined — no module imports in SW) ───────────────

const PRIORITY_CONFIG = {
  moderate: {
    requireInteraction: false,
    vibration:          [200, 100, 200],
    emergency:          false,
    tag:                'jeevalink-moderate',
    icon:               '/logo.png',
    badge:              '/favicon.png',
  },
  critical: {
    requireInteraction: true,
    vibration:          [400, 200, 400, 200, 700],
    emergency:          false,
    tag:                'jeevalink-critical',
    icon:               '/logo.png',
    badge:              '/favicon.png',
  },
  immediate: {
    requireInteraction: true,
    vibration:          [500, 200, 500, 200, 1000, 300, 500, 200, 500],
    emergency:          true,
    tag:                'jeevalink-immediate',
    icon:               '/logo.png',
    badge:              '/favicon.png',
  },
};

function getPriorityConfig(priority) {
  return PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.moderate;
}

// ─── Cache Configuration (PWA Shell Only) ────────────────────────────────────

const CACHE_NAME = 'jeevalink-shell-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/logo.png',
  '/idonate.png',
  '/favicon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
];

// ─── Service Worker Lifecycle ─────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  console.log('[SW] Installed.');
  // Skip waiting so new SW activates immediately on update
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Shell pre-cache notice (non-fatal):', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activated.');
  // Take control of all clients immediately and purge obsolete caches
  event.waitUntil(
    Promise.all([
      clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key.startsWith('jeevalink-') && key !== CACHE_NAME) {
              console.log('[SW] Cleaning stale cache:', key);
              return caches.delete(key);
            }
            return Promise.resolve();
          })
        );
      }),
    ])
  );
});

// ─── Fetch Handler (Safe Offline Shell — Never caches /api, auth, or mutative requests) ───

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  const isSameOrigin = url.origin === JEEVALINK_ORIGIN;

  // CRITICAL: NEVER cache or intercept API endpoints, storage uploads, or requests with Authorization
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/storage') ||
    request.headers.has('Authorization')
  ) {
    return;
  }

  // SPA Navigation requests: Network-first with cache fallback to /index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html').then((response) => {
          return response || caches.match('/');
        });
      })
    );
    return;
  }

  // Static shell assets on the same origin (images, fonts, bundles)
  if (isSameOrigin) {
    const isStaticAsset =
      url.pathname.startsWith('/assets/') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.jpeg') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.ico') ||
      url.pathname.endsWith('.webmanifest');

    if (isStaticAsset) {
      event.respondWith(
        caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            // Stale-while-revalidate in background
            fetch(request)
              .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                  caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
                }
              })
              .catch(() => {});
            return cachedResponse;
          }
          return fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          });
        })
      );
    }
  }
});

// ─── Push Event Handler ───────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  // Safely parse payload
  let payload = null;
  try {
    payload = event.data?.json();
  } catch {
    try {
      const text = event.data?.text();
      if (text) payload = JSON.parse(text);
    } catch {
      console.warn('[SW] Could not parse push payload.');
    }
  }

  // Validate payload — must have at least a title or body
  if (!payload || (typeof payload !== 'object')) {
    console.warn('[SW] Invalid or empty push payload — ignoring.');
    return;
  }

  const priority = (payload.priority && PRIORITY_CONFIG[payload.priority])
    ? payload.priority
    : 'moderate';

  const config = getPriorityConfig(priority);

  const title = payload.title || (priority === 'immediate'
    ? '🚨 IMMEDIATE BLOOD REQUEST'
    : priority === 'critical'
    ? '⚠️ CRITICAL Blood Request'
    : '🩸 Blood Request Nearby');

  const body = payload.body || 'JeevaLink blood request notification';

  // Determine click URL based on priority
  const clickUrl = payload.url ||
    (priority === 'immediate' && payload.requestId
      ? `/emergency-request/${payload.requestId}`
      : payload.requestId
      ? `/blood-requests/${payload.requestId}`
      : '/requests');

  const notificationOptions = {
    body,
    icon:               config.icon,
    badge:              config.badge,
    tag:                `${config.tag}-${payload.requestId || Date.now()}`,
    requireInteraction: config.requireInteraction,
    data: {
      url:        clickUrl,
      requestId:  payload.requestId || null,
      priority,
      type:       payload.type || 'BLOOD_REQUEST',
      bloodGroup: payload.bloodGroup || '',
      hospital:   payload.hospital  || '',
      timestamp:  payload.timestamp || String(Date.now()),
    },
    // Vibration pattern (advisory — browser/OS may override)
    vibrate: config.vibration,
    // Renotify if a notification with the same tag already exists
    renotify: priority === 'immediate',
  };

  // Show the notification
  event.waitUntil(
    self.registration.showNotification(title, notificationOptions)
      .then(() => {
        // Relay to any open foreground tabs so they can update their UI
        return clients.matchAll({ type: 'window', includeUncontrolled: true });
      })
      .then((openClients) => {
        openClients.forEach((client) => {
          client.postMessage({
            type:      'WEBPUSH_FOREGROUND',
            priority,
            title,
            body,
            requestId: payload.requestId || null,
            url:       clickUrl,
            data:      payload,
          });
        });
      })
      .catch((err) => {
        console.error('[SW] showNotification failed:', err);
      })
  );
});

// ─── Notification Click Handler ───────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data        = event.notification.data || {};
  const priority    = data.priority || 'moderate';
  const requestId   = data.requestId;
  const clickUrl    = data.url || '/requests';

  // Determine the target URL based on priority
  let targetUrl = clickUrl;
  if (priority === 'immediate' && requestId) {
    // Always route immediate to the emergency page
    targetUrl = `${JEEVALINK_ORIGIN}/emergency-request/${requestId}`;
  } else if (requestId) {
    targetUrl = `${JEEVALINK_ORIGIN}/blood-requests/${requestId}`;
  } else if (!clickUrl.startsWith('http')) {
    targetUrl = `${JEEVALINK_ORIGIN}${clickUrl}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Prefer focusing an existing JeevaLink window and navigating it
        for (const client of clientList) {
          const clientUrl = new URL(client.url);
          if (clientUrl.origin === JEEVALINK_ORIGIN && 'focus' in client) {
            // Navigate the existing window to the target URL
            if ('navigate' in client) {
              return client.navigate(targetUrl).then(() => client.focus());
            }
            return client.focus();
          }
        }

        // No existing window — open a new one
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// ─── Message Handler (from page → SW) ────────────────────────────────────────

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
