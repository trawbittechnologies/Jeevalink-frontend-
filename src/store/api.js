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

const DEFAULT_BACKEND_URL = 'https://jeevalink-backend-production.up.railway.app/api/v1';

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl || typeof envUrl !== 'string') {
    return DEFAULT_BACKEND_URL;
  }
  const trimmed = envUrl.trim();
  // Override invalid domain without '-production' or Vercel URLs or relative paths
  if (
    trimmed.includes('jeevalink-backend.up.railway.app') ||
    trimmed.includes('vercel.app') ||
    !trimmed.startsWith('http')
  ) {
    return DEFAULT_BACKEND_URL;
  }
  return trimmed.replace(/\/+$/, '');
};

const BASE_URL = getApiBaseUrl();

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
