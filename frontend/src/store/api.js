import axios from 'axios';

// Helper to convert snake_case to camelCase
export function toCamel(obj) {
  if (Array.isArray(obj)) {
    return obj.map(toCamel);
  }
  if (obj !== null && typeof obj === 'object') {
    if (
      obj instanceof Blob ||
      obj instanceof ArrayBuffer ||
      obj instanceof FormData ||
      obj instanceof Date ||
      obj instanceof RegExp
    ) {
      return obj;
    }

    const result = {};
    for (const key of Object.keys(obj)) {
      const camelKey = key.replace(/_([a-z0-9])/gi, (_, match) => match.charAt(1).toUpperCase());
      result[camelKey] = toCamel(obj[key]);
    }

    // Custom mappings for frontend compatibility & field aliases
    if (result.id !== undefined && result._id === undefined) {
      result._id = String(result.id);
    }
    if (result.primaryName !== undefined) {
      result.name = result.name || result.primaryName;
    } else if (result.name !== undefined) {
      result.primaryName = result.name;
    }
    if (result.secondaryName !== undefined) {
      result.secondaryContactName = result.secondaryName;
    }
    if (result.secondaryPhone !== undefined) {
      result.secondaryContactNumber = result.secondaryPhone;
    } else if (result.secondaryContactNumber !== undefined) {
      result.secondaryPhone = result.secondaryContactNumber;
    }
    if (result.superAdmin1Name !== undefined) {
      result.superAdmin_1Name = result.superAdmin1Name;
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
    } else if (result.role === 'user') {
      result.matchScore = Math.floor(Math.random() * 25) + 75; // 75 - 99
      result.compatibilityScore = result.matchScore;
    }

    if (result.distance === undefined && result.role === 'user') {
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
    if (
      obj instanceof Blob ||
      obj instanceof ArrayBuffer ||
      obj instanceof FormData ||
      obj instanceof Date ||
      obj instanceof RegExp
    ) {
      return obj;
    }

    const result = {};
    for (const key of Object.keys(obj)) {
      let snakeKey;
      if (key === 'lastDonated' || key === 'lastDonatedDate' || key === 'lastDonationDate') {
        snakeKey = 'last_donated_date';
      } else if (key === 'mobileNumber') {
        snakeKey = 'mobile';
      } else if (key === 'secondaryContactName' || key === 'secondaryName') {
        snakeKey = 'secondary_name';
      } else if (key === 'secondaryContactNumber' || key === 'secondaryPhone') {
        snakeKey = 'secondary_phone';
      } else if (key === 'primaryName') {
        snakeKey = 'primary_name';
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

const DEFAULT_BACKEND_URL = 'https://api.jeevelink.com';

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  let url = (envUrl && typeof envUrl === 'string' && envUrl.trim()) ? envUrl.trim() : DEFAULT_BACKEND_URL;

  // Make sure it doesn't end with a slash
  url = url.replace(/\/+$/, '');

  // Add /api/v1 if it's missing (and if it's not a root-relative path that implies it)
  if (!/\/api\/v1$/.test(url)) {
    if (/\/api$/.test(url)) {
      url = `${url}/v1`;
    } else {
      url = `${url}/api/v1`;
    }
  }

  return url;
};

const BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Accept': 'application/json',
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
    if (typeof response.data === 'string') {
      try {
        const parsed = JSON.parse(response.data);
        if (parsed && typeof parsed === 'object') {
          response.data = parsed;
        }
      } catch {
        // Not a JSON string
      }
    }
    if (response.data && typeof response.data === 'object') {
      response.data = toCamel(response.data);
    }
    return response;
  },
  (error) => {
    if (error.response && typeof error.response.data === 'string') {
      try {
        const parsed = JSON.parse(error.response.data);
        if (parsed && typeof parsed === 'object') {
          error.response.data = parsed;
        }
      } catch {
        // Not a JSON string
      }
    }
    if (error.response?.data && typeof error.response.data === 'object') {
      error.response.data = toCamel(error.response.data);
    }

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
  return `${rootUrl}/storage/${cleanPath}?v=2`;
}

export default api;
