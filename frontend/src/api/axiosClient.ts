// ============================================================================
// File: frontend/src/api/axiosClient.ts
// Vai trò: Khởi tạo Axios instance dùng chung với baseURL trỏ về Backend API (/api),
//          gắn request interceptor tự động đính kèm header Authorization: Bearer <token>
//          và response interceptor chuẩn hoá xử lý lỗi HTTP.
// ============================================================================

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const axiosClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: đính kèm Bearer token từ localStorage
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auren_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: chuẩn hoá dữ liệu và bắt lỗi hết hạn phiên
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<{ error?: { code?: string; message?: string } }>) => {
    if (error.response?.status === 401) {
      const code = error.response.data?.error?.code;
      if (code === 'TOKEN_EXPIRED') {
        localStorage.removeItem('auren_token');
        localStorage.removeItem('auren_user');
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
    }
    return Promise.reject(error);
  },
);

export default axiosClient;
