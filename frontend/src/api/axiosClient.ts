import axios from 'axios';
import { storage } from '../utils/storage';
import { Platform } from 'react-native';
import { authApi } from './authApi';
import { useAuthStore } from '../store/authStore';
import { AuthResponse } from '../types';

// Chú ý: Web thì gọi localhost. Android Emulator thì gọi 10.0.2.2
const BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:9999/api' 
  : 'http://10.0.2.2:9999/api'; 

export const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: Platform.OS === 'web',
  timeout: 10000,
});

let refreshPromise: Promise<AuthResponse> | null = null;

const shouldSkipRefresh = (url?: string) => {
  if (!url) {
    return false;
  }

  return url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout');
};

// Interceptor: Trước khi request gửi đi, gắn JWT Token nếu có
axiosClient.interceptors.request.use(
  async (config) => {
    const token = (await storage.getItem('access_token')) ?? (await storage.getItem('jwt_token'));
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor: Xử lý response lỗi auth (401/403 => thử refresh một lần)
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url;

    if ((status !== 401 && status !== 403) || !originalRequest || shouldSkipRefresh(requestUrl) || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const currentRefreshToken = Platform.OS === 'web'
      ? null
      : useAuthStore.getState().refreshToken ?? (await storage.getItem('refresh_token'));

    try {
      if (!refreshPromise) {
        refreshPromise = Platform.OS === 'web'
          ? authApi.refresh().finally(() => {
              refreshPromise = null;
            })
          : authApi.refresh({ refreshToken: currentRefreshToken! }).finally(() => {
              refreshPromise = null;
            });
      }

      const refreshedSession = await refreshPromise;
      await useAuthStore.getState().setSession(refreshedSession);

      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${refreshedSession.accessToken}`;

      return axiosClient(originalRequest);
    } catch (refreshError) {
      await useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    }
    
  }
);
