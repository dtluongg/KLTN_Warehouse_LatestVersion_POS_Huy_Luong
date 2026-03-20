import axios from 'axios';
import { storage } from '../utils/storage';
import { Platform } from 'react-native';

// Chú ý: Web thì gọi localhost. Android Emulator thì gọi 10.0.2.2
const BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:8080/api' 
  : 'http://10.0.2.2:8080/api'; 

export const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor: Trước khi request gửi đi, gắn JWT Token nếu có
axiosClient.interceptors.request.use(
  async (config) => {
    const token = await storage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor: Xử lý response lỗi (ví dụ 401 Unauthorized => Đăng xuất mượt mà)
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Xóa token và có thể điều hướng về trang Login nhờ Zustand
      await storage.removeItem('jwt_token');
    }
    return Promise.reject(error);
  }
);
