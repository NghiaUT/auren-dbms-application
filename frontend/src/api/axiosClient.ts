// ============================================================================
// File: frontend/src/api/axiosClient.ts
// Vai trò: Khởi tạo Axios instance dùng chung với baseURL trỏ về Backend API (/api),
//          gắn request interceptor tự động đính kèm header Authorization: Bearer <token>
//          và response interceptor chuẩn hoá xử lý lỗi HTTP.
// ============================================================================

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { emitToast } from '../context/ToastContext';

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

// Response Interceptor: chuẩn hoá dữ liệu và bắt lỗi toàn cục
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<{ error?: { code?: string; message?: string } }>) => {
    if (axios.isCancel(error)) return Promise.reject(error);

    // 1. Bắt lỗi hết hạn phiên đăng nhập
    if (error.response?.status === 401) {
      const code = error.response.data?.error?.code;
      if (code === 'TOKEN_EXPIRED' || code === 'INVALID_TOKEN') {
        localStorage.removeItem('auren_token');
        localStorage.removeItem('auren_user');
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
    }

    // 2. Tự động cảnh báo toàn cục khi mất kết nối mạng hoặc timeout
    if (!error.response) {
      emitToast({
        type: 'error',
        title: error.code === 'ECONNABORTED' ? 'Lỗi quá hạn (Timeout)' : 'Lỗi kết nối mạng',
        message:
          error.code === 'ECONNABORTED'
            ? 'Yêu cầu tới máy chủ quá thời gian chờ. Vui lòng kiểm tra lại.'
            : 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền.',
        duration: 5000,
      });
    } else if (error.response.status >= 500) {
      // 3. Tự động cảnh báo toàn cục khi máy chủ gặp sự cố 5xx
      emitToast({
        type: 'error',
        title: `Lỗi máy chủ (${error.response.status})`,
        message:
          error.response.data?.error?.message ||
          'Máy chủ gặp sự cố xử lý nội bộ. Đội ngũ kỹ thuật đang tiếp nhận.',
        duration: 5000,
      });
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
