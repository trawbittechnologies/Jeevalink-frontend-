/**
 * notificationPriority.js
 *
 * Centralized Web Push notification priority configuration.
 * Used by:
 *   - sw.js (service worker) — inlined/copied
 *   - webPushService.js
 *   - EmergencyRequest.jsx
 *
 * Priority levels:
 *   moderate  — Normal blood request
 *   critical  — Urgent blood request
 *   immediate — Emergency SOS (siren on emergency page)
 */

/** @type {Record<string, {titlePrefix: string, requireInteraction: boolean, vibration: number[], emergency: boolean, tag: string}>} */
export const PRIORITY_CONFIG = {
  moderate: {
    titlePrefix:         '🩸',
    requireInteraction:  false,
    vibration:           [200, 100, 200],
    emergency:           false,
    tag:                 'jeevalink-moderate',
    icon:                '/logo.png',
    badge:               '/favicon.png',
  },
  critical: {
    titlePrefix:         '⚠️',
    requireInteraction:  true,
    vibration:           [400, 200, 400, 200, 700],
    emergency:           false,
    tag:                 'jeevalink-critical',
    icon:                '/logo.png',
    badge:               '/favicon.png',
  },
  immediate: {
    titlePrefix:         '🚨',
    requireInteraction:  true,
    vibration:           [500, 200, 500, 200, 1000, 300, 500, 200, 500],
    emergency:           true,
    tag:                 'jeevalink-immediate',
    icon:                '/logo.png',
    badge:               '/favicon.png',
  },
};

/**
 * Map a backend urgency_level string to a Web Push priority string.
 *
 * @param {string} urgencyLevel
 * @returns {'moderate' | 'critical' | 'immediate'}
 */
export function mapUrgencyToPriority(urgencyLevel) {
  const raw = (urgencyLevel || '').toLowerCase().trim();

  if (['emergency sos', 'emergency', 'sos', 'immediate'].includes(raw)) {
    return 'immediate';
  }
  if (['urgent', 'critical', 'high'].includes(raw)) {
    return 'critical';
  }
  return 'moderate';
}

/**
 * Get config for a given priority, falling back to 'moderate' if unknown.
 *
 * @param {string} priority
 * @returns {typeof PRIORITY_CONFIG['moderate']}
 */
export function getPriorityConfig(priority) {
  return PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.moderate;
}
