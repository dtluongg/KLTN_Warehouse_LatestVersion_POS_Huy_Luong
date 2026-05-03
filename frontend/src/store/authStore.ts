import { create } from 'zustand';
import { Platform } from 'react-native';
import { storage } from '../utils/storage';
import { AuthResponse, Role } from '../types';
import { authApi } from '../api/authApi';
import { normalizeRole } from '../utils/roleAccess';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  username: string | null;
  role: Role | null;
  isLoading: boolean;
  login: (data: AuthResponse) => Promise<void>;
  setSession: (data: AuthResponse) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const persistSession = async (data: AuthResponse) => {
  await storage.setItem('access_token', data.accessToken);
  if (Platform.OS === 'web') {
    await storage.removeItem('refresh_token');
  } else if (data.refreshToken) {
    await storage.setItem('refresh_token', data.refreshToken);
  }
  await storage.setItem('user_role', data.role);
  await storage.setItem('username', data.username);
};

const clearSessionStorage = async () => {
  await storage.removeItem('access_token');
  await storage.removeItem('refresh_token');
  await storage.removeItem('jwt_token');
  await storage.removeItem('user_role');
  await storage.removeItem('username');
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  refreshToken: null,
  username: null,
  role: null,
  isLoading: true, // Hiệu ứng Splash lúc app mới bật lên

  login: async (data: AuthResponse) => {
    await persistSession(data);
    set({
      token: data.accessToken,
      refreshToken: Platform.OS === 'web' ? null : data.refreshToken,
      username: data.username,
      role: data.role,
    });
  },

  setSession: async (data: AuthResponse) => {
    await persistSession(data);
    set({
      token: data.accessToken,
      refreshToken: Platform.OS === 'web' ? null : data.refreshToken,
      username: data.username,
      role: data.role,
    });
  },

  logout: async () => {
    const currentRefreshToken = Platform.OS === 'web' ? null : await storage.getItem('refresh_token');

    try {
      if (Platform.OS === 'web') {
        await authApi.logout();
      } else if (currentRefreshToken) {
        await authApi.logout({ refreshToken: currentRefreshToken });
      }
    } catch (error) {
      // Logout should still clear local session even if revoke call fails.
    }

    await clearSessionStorage();
    set({ token: null, refreshToken: null, username: null, role: null });
  },

  checkAuth: async () => {
    try {
      const token = (await storage.getItem('access_token')) ?? (await storage.getItem('jwt_token'));
      const refreshToken = Platform.OS === 'web' ? null : await storage.getItem('refresh_token');
      const role = normalizeRole(await storage.getItem('user_role'));
      const username = await storage.getItem('username');

      if (token && refreshToken) {
        set({ token, refreshToken, role, username, isLoading: false });
        return;
      }

      if (Platform.OS === 'web') {
        try {
          const refreshedSession = await authApi.refresh();
          await persistSession(refreshedSession);
          set({
            token: refreshedSession.accessToken,
            refreshToken: null,
            role: refreshedSession.role,
            username: refreshedSession.username,
            isLoading: false,
          });
          return;
        } catch (refreshError) {
          await clearSessionStorage();
          set({ token: null, refreshToken: null, username: null, role: null, isLoading: false });
          return;
        }
      }

      if (refreshToken) {
        try {
          const refreshedSession = await authApi.refresh({ refreshToken });
          await persistSession(refreshedSession);
          set({
            token: refreshedSession.accessToken,
            refreshToken: refreshedSession.refreshToken,
            role: refreshedSession.role,
            username: refreshedSession.username,
            isLoading: false,
          });
          return;
        } catch (refreshError) {
          await clearSessionStorage();
          set({ token: null, refreshToken: null, username: null, role: null, isLoading: false });
          return;
        }
      }

      if (token) {
        set({ token, refreshToken: null, role, username, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      set({ isLoading: false });
    }
  },
}));
