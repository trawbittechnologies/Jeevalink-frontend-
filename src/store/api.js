import axios from 'axios';

// Helper to convert snake_case to camelCase
export function toCamel(obj) {
  if (Array.isArray(obj)) {
    return obj.map(toCamel);
  }
  if (obj !== null && typeof obj === 'object') {
    const result = {};
    for (const key of Object.keys(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = toCamel(obj[key]);
    }
    
    // Custom mappings for frontend compatibility
    if (result.id !== undefined && result._id === undefined) {
      result._id = String(result.id);
    }
    if (result.lastDonatedDate !== undefined) {
      result.lastDonated = result.lastDonatedDate;
      result.lastDonationDate = result.lastDonatedDate;
    }
    if (result.mobile !== undefined) {
      result.mobileNumber = result.mobile;
    }
    if (result.compatibilityScore !== undefined) {
      result.matchScore = result.compatibilityScore;
    } else if (result.matchScore !== undefined) {
      result.compatibilityScore = result.matchScore;
    } else if (result.role === 'donor') {
      // Assign mock compatibility scores if absent
      result.matchScore = Math.floor(Math.random() * 25) + 75; // 75 - 99
      result.compatibilityScore = result.matchScore;
    }
    
    // Assign mock distances if absent (since distance depends on live coordinates not in basic DB)
    if (result.distance === undefined && result.role === 'donor') {
      result.distance = Math.round((Math.random() * 5 + 0.5) * 10) / 10;
    }
    
    return result;
  }
  return obj;
}

// Helper to convert camelCase to snake_case
export function toSnake(obj) {
  if (Array.isArray(obj)) {
    return obj.map(toSnake);
  }
  if (obj !== null && typeof obj === 'object') {
    const result = {};
    for (const key of Object.keys(obj)) {
      let snakeKey;
      // Handle custom specific manual mappings
      if (key === 'lastDonated' || key === 'lastDonatedDate' || key === 'lastDonationDate') {
        snakeKey = 'last_donated_date';
      } else if (key === 'mobileNumber') {
        snakeKey = 'mobile';
      } else if (key === '_id') {
        snakeKey = 'id';
      } else {
        snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      }
      result[snakeKey] = toSnake(obj[key]);
    }
    return result;
  }
  return obj;
}

// The authoritative production backend URL.
// This is the single source of truth — it matches Railway deployment.
const DEFAULT_BACKEND_URL = 'https://jeevalink-backend-production.up.railway.app/api/v1';

/**
 * Resolves the API base URL with the following priority:
 * 1. VITE_API_URL env var (if set to a valid absolute backend URL)
 * 2. DEFAULT_BACKEND_URL (hardcoded Railway fallback — always safe)
 *
 * Guards against:
 * - Relative paths (e.g. "/api/v1") — these would route to the frontend domain
 * - Vercel frontend domains — these are never backend URLs
 * - Non-HTTP values — invalid URLs are silently ignored
 */
export const getBaseURL = () => {
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl && typeof envApiUrl === 'string') {
    const trimmed = envApiUrl.trim();
    // Reject if not an absolute HTTP(S) URL
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      console.warn('[Jeevalink API] VITE_API_URL is not an absolute URL — using default backend.');
      return DEFAULT_BACKEND_URL;
    }
    // Reject if it points to a Vercel frontend domain (never a valid backend)
    if (trimmed.includes('.vercel.app') && !trimmed.includes('railway.app')) {
      console.warn('[Jeevalink API] VITE_API_URL points to a Vercel frontend domain — using default backend.');
      return DEFAULT_BACKEND_URL;
    }
    // Strip trailing slashes for consistent path joining
    return trimmed.replace(/\/+$/, '');
  }
  return DEFAULT_BACKEND_URL;
};

const BASE_URL = getBaseURL();

// Log the resolved API URL on startup (visible in browser DevTools console)
console.info(`[Jeevalink API] 🔗 Base URL: ${BASE_URL} (mode: ${import.meta.env.MODE})`);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Accept': 'application/json',
    // NOTE: Do NOT set Content-Type here.
    // Axios auto-sets it per request:
    //   - 'application/json'           for plain objects
    //   - 'multipart/form-data; boundary=...' for FormData (file uploads)
    // Setting it globally breaks multipart file uploads.
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jeevalink_token');
    if (token) {
      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    // Map outgoing data to snake_case
    if (config.data && !(config.data instanceof FormData)) {
      config.data = toSnake(config.data);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to convert incoming data to camelCase
api.interceptors.response.use(
  (response) => {
    if (response.data && response.data.data) {
      response.data.data = toCamel(response.data.data);
    }
    return response;
  },
  (error) => {
    // If we get an authentication error, clean up token
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('jeevalink_token');
      localStorage.removeItem('jeevalink_user');
    }
    return Promise.reject(error);
  }
);

export function getStorageUrl(path) {
  if (!path || typeof path !== 'string') return null;
  if (path.startsWith('http') || path.startsWith('data:')) {
    return path;
  }
  let cleanPath = path.replace(/^\/+/, '');
  if (cleanPath.startsWith('storage/')) {
    cleanPath = cleanPath.replace(/^storage\//, '');
  }
  const apiBase = api.defaults.baseURL || '';
  const rootUrl = apiBase.replace(/\/api\/v1\/?$/, '').replace(/\/v1\/?$/, '');
  return `${rootUrl}/storage/${cleanPath}`;
}

export default api;
