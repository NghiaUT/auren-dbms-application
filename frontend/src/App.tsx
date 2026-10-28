// ============================================================================
// File: frontend/src/App.tsx
// Vai trò: Định nghĩa toàn bộ bảng định tuyến (React Router) cho ứng dụng AUREN SPA:
//          - Màn hình công khai: P01 (Trang chủ), P04 (Đăng nhập), P05 (Đăng ký)
//          - Trang hệ thống: 403 (Forbidden), 404 (Not Found)
//          - Tuyến đường phân quyền được bảo vệ: Customer, Sales, Admin
// ============================================================================

import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout';
import { P01_HomePage } from './pages/public/P01_HomePage';
import { P02_ProductCatalogPage } from './pages/public/P02_ProductCatalogPage';
import { P03_ProductDetailPage } from './pages/public/P03_ProductDetailPage';
import { P04_LoginPage } from './pages/public/P04_LoginPage';
import { P05_RegisterPage } from './pages/public/P05_RegisterPage';
import { Forbidden403Page } from './pages/public/Forbidden403Page';
import { NotFound404Page } from './pages/public/NotFound404Page';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { C04_MyOrdersPage } from './pages/customer/C04_MyOrdersPage';
import { S01_SalesDashboardPage } from './pages/sales/S01_SalesDashboardPage';
import { A01_AdminDashboardPage } from './pages/admin/A01_AdminDashboardPage';

const App: React.FC = () => {
  return (
    <Routes>
      {/* Khung bố cục công khai (PublicLayout) */}
      <Route element={<PublicLayout />}>
        {/* P01: Trang chủ AUREN */}
        <Route path="/" element={<P01_HomePage />} />

        {/* P02: Danh sách và Bộ lọc tác phẩm */}
        <Route path="/products" element={<P02_ProductCatalogPage />} />

        {/* P03: Chi tiết tác phẩm kiến trúc */}
        <Route path="/products/:id" element={<P03_ProductDetailPage />} />

        {/* P04: Đăng nhập */}
        <Route path="/login" element={<P04_LoginPage />} />

        {/* P05: Đăng ký thành viên */}
        <Route path="/register" element={<P05_RegisterPage />} />

        {/* Màn hình Customer được bảo vệ */}
        <Route
          path="/account/orders"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <C04_MyOrdersPage />
            </ProtectedRoute>
          }
        />

        {/* Màn hình Sales được bảo vệ */}
        <Route
          path="/sales"
          element={
            <ProtectedRoute allowedRoles={['sales']}>
              <S01_SalesDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Màn hình Admin được bảo vệ */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <A01_AdminDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Trang lỗi hệ thống */}
        <Route path="/403" element={<Forbidden403Page />} />
        <Route path="*" element={<NotFound404Page />} />
      </Route>
    </Routes>
  );
};

export default App;
