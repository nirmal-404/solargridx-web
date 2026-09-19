// Smart Solar Microgrid Trading System - Axios HTTP Client with JWT Interceptor
import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5205/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Attaches the persisted JWT access token to every outgoing request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('solargridx_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepts unauthorized responses and handles session invalidation
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Do not redirect if already on login page
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('solargridx_token');
        localStorage.removeItem('solargridx_user');
      }
    }
    return Promise.reject(error);
  }
);
