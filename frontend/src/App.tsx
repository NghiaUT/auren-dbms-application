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
import { C01_CartPage } from './pages/customer/C01_CartPage';
import { C02_CheckoutPage } from './pages/customer/C02_CheckoutPage';
import { C05_ConfirmationPage } from './pages/customer/C05_ConfirmationPage';
import { C04_MyOrdersPage } from './pages/customer/C04_MyOrdersPage';
import { S01_SalesDashboardPage } from './pages/sales/S01_SalesDashboardPage';
import { S02_OrderQueuePage } from './pages/sales/S02_OrderQueuePage';
import { S03_OrderProcessPage } from './pages/sales/S03_OrderProcessPage';
import { S04_OrderPaymentSchedulePage } from './pages/sales/S04_OrderPaymentSchedulePage';
import { S05_InventoryPage } from './pages/sales/S05_InventoryPage';
import { S06_LowStockRestockPage } from './pages/sales/S06_LowStockRestockPage';
import { S07_ReceivablesPage } from './pages/sales/S07_ReceivablesPage';
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

        {/* C01: Túi hàng (Shopping Bag) */}
        <Route path="/cart" element={<C01_CartPage />} />

        {/* C02: Thanh toán & Giao nhận White-Glove (Protected) */}
        <Route
          path="/checkout"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <C02_CheckoutPage />
            </ProtectedRoute>
          }
        />

        {/* C05: Niêm phong đơn hàng thành công (Protected) */}
        <Route
          path="/checkout/success"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <C05_ConfirmationPage />
            </ProtectedRoute>
          }
        />

        {/* Màn hình Customer được bảo vệ */}
        <Route
          path="/account/orders"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <C04_MyOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <C04_MyOrdersPage />
            </ProtectedRoute>
          }
        />

        {/* Màn hình Sales được bảo vệ (S01 - S07) */}
        <Route
          path="/sales"
          element={
            <ProtectedRoute allowedRoles={['sales']}>
              <S01_SalesDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales/orders"
          element={
            <ProtectedRoute allowedRoles={['sales']}>
              <S02_OrderQueuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales/orders/:id"
          element={
            <ProtectedRoute allowedRoles={['sales']}>
              <S03_OrderProcessPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales/orders/:id/payments"
          element={
            <ProtectedRoute allowedRoles={['sales']}>
              <S04_OrderPaymentSchedulePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales/inventory"
          element={
            <ProtectedRoute allowedRoles={['sales', 'admin']}>
              <S05_InventoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales/inventory/low-stock"
          element={
            <ProtectedRoute allowedRoles={['sales', 'admin']}>
              <S06_LowStockRestockPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales/receivables"
          element={
            <ProtectedRoute allowedRoles={['sales', 'admin']}>
              <S07_ReceivablesPage />
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
