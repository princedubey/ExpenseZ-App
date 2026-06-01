import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Resolve a sensible default base URL for different runtimes:
// - Honor explicit expo config extra or environment override when provided
// - Use 10.0.2.2 for Android emulator (maps to host machine localhost)
// - Fallback to localhost for iOS simulator / web
const explicit = 
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) || 
  process.env.EXPO_PUBLIC_API_URL || 
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  process.env.API_URL;

// Retrieve Metro packager IP if available to support testing on physical devices
const hostUri = Constants.expoConfig?.hostUri;
const packagerIp = hostUri ? hostUri.split(':')[0] : null;

const DEFAULT_HOST = packagerIp || (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');

let resolvedBaseUrl = explicit || `http://${DEFAULT_HOST}:5002`;

// If we are in development mode and the resolved URL points to the production Vercel backend,
// redirect it to the local backend server so local testing works correctly.
if (__DEV__ && resolvedBaseUrl.includes('expense-z-backend.vercel.app')) {
  resolvedBaseUrl = `http://${DEFAULT_HOST}:5002`;
}

// 0.0.0.0 is invalid for client requests, rewrite to localhost or DEFAULT_HOST if found
if (resolvedBaseUrl.includes('0.0.0.0')) {
  resolvedBaseUrl = Platform.OS === 'web' 
    ? resolvedBaseUrl.replace('0.0.0.0', 'localhost')
    : resolvedBaseUrl.replace('0.0.0.0', DEFAULT_HOST);
}

const API_BASE_URL = resolvedBaseUrl;
console.log('[API] Resolved API_BASE_URL:', API_BASE_URL);


const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create a token getter function that will be set later
let getToken: () => string | undefined;
let refreshToken: () => Promise<void>;
let logout: () => Promise<void>;

export const setTokenHandlers = (
  tokenGetter: () => string | undefined,
  refreshTokenFn: () => Promise<void>,
  logoutFn: () => Promise<void>
) => {
  getToken = tokenGetter;
  refreshToken = refreshTokenFn;
  logout = logoutFn;
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = getToken?.();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't try to refresh token for auth endpoints
    const isAuthEndpoint = originalRequest.url?.includes('/api/auth/');
    const isLoginAttempt = originalRequest.url?.includes('/api/auth/login');

    // If error is 401 and we haven't tried to refresh token yet
    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      !isAuthEndpoint && // Don't refresh for auth endpoints
      getToken?.() // Only refresh if we have a token
    ) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        await refreshToken?.();
        
        // Retry the original request with new token
        const newToken = getToken?.();
        if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, log the user out
        await logout?.();
        return Promise.reject(refreshError);
      }
    }

    // For login attempts, just reject with the error
    if (isLoginAttempt) {
      return Promise.reject(error);
    }

    // Handle other errors
    if (error.response) {
      console.error('Response Error:', error.response.data);
    } else if (error.request) {
      console.error('Request Error:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api; 