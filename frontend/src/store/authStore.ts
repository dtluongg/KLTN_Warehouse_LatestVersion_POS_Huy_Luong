import { create } from 'zustand';
import { storage } from '../utils/storage';
import { AuthResponse } from '../types';

interface AuthState {
  token: string | null;
  username: string | null;
  role: string | null;
  isLoading: boolean;
  login: (data: AuthResponse) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  username: null,
  role: null,
  isLoading: true, // Hiệu ứng Splash lúc app mới bật lên

  login: async (data: AuthResponse) => {
    await storage.setItem('jwt_token', data.token);
    await storage.setItem('user_role', data.role);
    await storage.setItem('username', data.username);
    set({ token: data.token, username: data.username, role: data.role });
  },

  logout: async () => {
    await storage.removeItem('jwt_token');
    await storage.removeItem('user_role');
    await storage.removeItem('username');
    set({ token: null, username: null, role: null });
  },

  checkAuth: async () => {
    try {
      const token = await storage.getItem('jwt_token');
      const role = await storage.getItem('user_role');
      const username = await storage.getItem('username');

      if (token) {
        set({ token, role, username, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      set({ isLoading: false });
    }
  },
}));
