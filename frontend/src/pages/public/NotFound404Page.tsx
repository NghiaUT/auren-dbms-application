// ============================================================================
// File: frontend/src/pages/public/NotFound404Page.tsx
// Mã màn hình: Hệ thống 404 | Route: *
// Vai trò: Trang thông báo lỗi 404 Not Found khi truy cập vào đường dẫn không tồn tại.
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';

export interface NotFound404PageProps {
  readonly message?: string;
}

export const NotFound404Page: React.FC<NotFound404PageProps> = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-20 bg-[#FCF9F3]">
      <div className="max-w-md w-full text-center flex flex-col items-center">
        <span className="font-serif text-6xl text-[#7B6E64]/40 font-light select-none">404</span>
        <span className="eyebrow mt-2">Không tìm thấy trang yêu cầu</span>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#0D0703] mt-2 mb-3">
          Tác phẩm không tồn tại
        </h1>
        <p className="font-sans text-xs sm:text-sm text-[#7B6E64] leading-relaxed mb-8">
          Đường dẫn bạn vừa truy cập có thể đã được thay đổi hoặc không tồn tại trong lưu trữ kiến trúc AUREN.
        </p>
        <Link to="/" className="btn-auren-solid">
          Về trang chủ AUREN →
        </Link>
      </div>
    </div>
  );
};
