import axios from 'axios';
import { Platform } from 'react-native';
import { AuthResponse, RefreshTokenRequest } from '../types';

const BASE_URL = Platform.OS === 'web'
  ? 'http://localhost:9999/api'
  : 'http://10.0.2.2:9999/api';

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
