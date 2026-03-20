import { axiosClient } from './axiosClient';
import { AuthResponse } from '../types';

export const authApi = {
  login: async (credentials: { username: string; password: string }) => {
    const response = await axiosClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },
};
