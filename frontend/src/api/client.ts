import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../utils/constants';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add Bearer token to requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      // Remove any whitespace from token
      const cleanToken = token.trim();
      config.headers.Authorization = `Bearer ${cleanToken}`;
      console.log('[API] Request:', config.method?.toUpperCase(), config.url);
      console.log('[API] Token length:', cleanToken.length, 'First 30 chars:', cleanToken.substring(0, 30) + '...');
    } else {
      console.warn('[API] Request without token:', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle 401 errors (token expiry)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.error('401 Unauthorized - Token invalid or expired');
      console.error('Request URL:', error.config?.url);
      console.error('Token in localStorage:', localStorage.getItem('access_token') ? 'Present' : 'Missing');
      
      // Don't automatically redirect - let components handle 401 errors
      // Components can decide whether to show error or redirect
    }
    return Promise.reject(error);
  }
);

export default apiClient;
