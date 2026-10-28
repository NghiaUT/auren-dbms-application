// ============================================================================
// File: frontend/src/pages/public/Forbidden403Page.tsx
// Mã màn hình: Hệ thống 403 | Route: /403
// Vai trò: Trang thông báo lỗi 403 Forbidden khi người dùng truy cập vào đường dẫn
//          không thuộc quyền hạn của vai trò hiện tại.
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';

export interface Forbidden403PageProps {
  readonly reason?: string;
}

export const Forbidden403Page: React.FC<Forbidden403PageProps> = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-20 bg-[#FCF9F3]">
      <div className="max-w-md w-full text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-[#BA1A1A]/10 text-[#BA1A1A] flex items-center justify-center mb-6">
          <ShieldX className="w-8 h-8" />
        </div>
        <span className="eyebrow text-[#BA1A1A]">Lỗi 403 · Quyền truy cập bị từ chối</span>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#0D0703] mt-2 mb-3">
          Không đủ quyền truy cập
        </h1>
        <p className="font-sans text-xs sm:text-sm text-[#7B6E64] leading-relaxed mb-8">
          Tài khoản của bạn không có đặc quyền truy cập vào phân khu quản trị này. Vui lòng đăng nhập với tài khoản có quyền thích hợp hoặc trở về trang chủ.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/" className="btn-auren-solid">
            Về trang chủ AUREN
          </Link>
          <Link to="/login" className="btn-auren-outline">
            Đăng nhập lại
          </Link>
        </div>
      </div>
    </div>
  );
};
