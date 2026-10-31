// ============================================================================
// File: frontend/src/auth/AuthContext.tsx
// Vai trò: React Context quản lý toàn cục trạng thái phiên người dùng:
//          - Lưu trữ thông tin AuthUser, Bearer token
//          - Đăng nhập (login), Đăng ký (register), Đăng xuất (logout)
//          - Tự động nạp lại thông tin người dùng từ GET /api/auth/me khi tải trang
// ============================================================================

import React, { createContext, useCallback, useEffect, useState } from 'react';
import type { AuthUser, LoginRequest, RegisterRequest } from '../types';
import { getMeApi, loginApi, logoutApi, registerApi } from '../api/auth.api';
import { clearCart } from '../utils/cartStorage';

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<AuthUser>;
  register: (payload: RegisterRequest) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auren_token';
const USER_KEY = 'auren_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Cập nhật token và user vào localStorage
  const saveSession = (newToken: string, newUser: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    if (newUser.role === 'sales' || newUser.role === 'admin') {
      clearCart();
    }
    setToken(newToken);
    setUser(newUser);
  };

  // Xoá session khỏi localStorage
  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  // Làm mới thông tin user từ server
  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setUser(null);
      return;
    }
    try {
      const freshUser = await getMeApi();
      setUser(freshUser);
      localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
    } catch {
      clearSession();
    }
  }, [clearSession]);

  // Khởi tạo: kiểm tra token hiện có
  useEffect(() => {
    const initAuth = async () => {
      const existingToken = localStorage.getItem(TOKEN_KEY);
      if (existingToken) {
        try {
          await refreshUser();
        } catch {
          clearSession();
        }
      }
      setIsLoading(false);
    };

    initAuth();

    // Lắng nghe sự kiện token hết hạn từ axiosClient
    const handleExpired = () => {
      clearSession();
    };

    window.addEventListener('auth:expired', handleExpired);
    return () => {
      window.removeEventListener('auth:expired', handleExpired);
    };
  }, [clearSession, refreshUser]);

  // Đăng nhập
  const login = async (credentials: LoginRequest): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const res = await loginApi(credentials);
      saveSession(res.accessToken, res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  // Đăng ký
  const register = async (payload: RegisterRequest): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const res = await registerApi(payload);
      saveSession(res.accessToken, res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  // Đăng xuất
  const logout = async (): Promise<void> => {
    try {
      await logoutApi();
    } finally {
      clearSession();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
