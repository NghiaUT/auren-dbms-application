// ============================================================================
// File: frontend/src/auth/ProtectedRoute.tsx
// Vai trò: Component bảo vệ các tuyến đường yêu cầu xác thực hoặc vai trò cụ thể:
//          - Chưa đăng nhập -> Chuyển hướng về /login (kèm redirect query param)
//          - Sai vai trò -> Chuyển hướng về /403 (Forbidden)
// ============================================================================

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCF9F3]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#271E18] border-t-transparent animate-spin rounded-full"></div>
          <span className="font-sans text-[11px] tracking-[0.18em] uppercase text-[#7B6E64]">
            Đang xác thực quyền truy cập...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return children;
};
