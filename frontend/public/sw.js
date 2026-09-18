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

// ─── Service Worker Lifecycle ─────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  console.log('[SW] Installed.');
  // Skip waiting so new SW activates immediately on update
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activated.');
  // Take control of all clients immediately
  event.waitUntil(clients.claim());
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
