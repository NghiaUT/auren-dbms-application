// ============================================================================
// File: frontend/src/api/auth.api.ts
// Vai trò: Cung cấp các hàm gọi API nhóm xác thực và hồ sơ cá nhân:
//          register, login, logout, getMe (/api/auth/*).
// ============================================================================

import axiosClient from './axiosClient';
import type {
  ApiResponse,
  AuthResponse,
  AuthUser,
  LoginRequest,
  RegisterRequest,
} from '../types';

/**
 * Đăng ký tài khoản khách hàng mới (FR1)
 * Endpoint: POST /api/auth/register
 */
export async function registerApi(payload: RegisterRequest): Promise<AuthResponse> {
  const response = await axiosClient.post<ApiResponse<AuthResponse>>('/auth/register', payload);
  return response.data.data;
}

/**
 * Đăng nhập hệ thống (FR0)
 * Endpoint: POST /api/auth/login
 */
export async function loginApi(payload: LoginRequest): Promise<AuthResponse> {
  const response = await axiosClient.post<ApiResponse<AuthResponse>>('/auth/login', payload);
  return response.data.data;
}

/**
 * Lấy hồ sơ tài khoản hiện tại kèm hạng thành viên (GET /api/auth/me)
 */
export async function getMeApi(): Promise<AuthUser> {
  const response = await axiosClient.get<ApiResponse<AuthUser>>('/auth/me');
  return response.data.data;
}

/**
 * Đăng xuất khỏi hệ thống (POST /api/auth/logout)
 */
export async function logoutApi(): Promise<void> {
  try {
    await axiosClient.post('/auth/logout');
  } catch {
    // Ngay cả khi API lỗi (ví dụ token đã hết hạn), client vẫn dọn dẹp phiên
  }
}
