// ============================================================================
// File: frontend/src/layouts/PublicLayout.tsx
// Vai trò: Bố cục khung giao diện dùng cho các màn hình công khai (P01 - P05):
//          bao gồm Header điều hướng thương hiệu AUREN, biểu tượng giỏ hàng,
//          vùng nội dung chính (Outlet) và Footer kiến trúc.
// ============================================================================

import React from 'react';
import { Outlet } from 'react-router-dom';
import { PublicHeader, PublicFooter } from '../components/layout';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FCF9F3] text-[#372A22]">
      <PublicHeader />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
};
