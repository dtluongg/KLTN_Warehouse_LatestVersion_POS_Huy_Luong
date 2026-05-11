import axios from 'axios';
import { Platform } from 'react-native';
import { AuthResponse, RefreshTokenRequest } from '../types';
import { getApiBaseUrl } from './apiConfig';

const BASE_URL = getApiBaseUrl();

const authHttpClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Platform': Platform.OS === 'web' ? 'web' : 'mobile',
  },
  withCredentials: Platform.OS === 'web',
  timeout: 10000,
});

export const authApi = {
  login: async (credentials: { username: string; password: string }) => {
    const response = await authHttpClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  refresh: async (payload?: RefreshTokenRequest) => {
    const response = await authHttpClient.post<AuthResponse>('/auth/refresh', payload ?? undefined);
    return response.data;
  },

  logout: async (payload?: RefreshTokenRequest) => {
    const response = await authHttpClient.post('/auth/logout', payload ?? undefined);
    return response.data;
  },
};
