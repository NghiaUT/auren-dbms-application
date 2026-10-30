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
import { C03_LimitedEditionOrderPage } from './pages/customer/C03_LimitedEditionOrderPage';
import { C05_ConfirmationPage } from './pages/customer/C05_ConfirmationPage';
import { C04_MyOrdersPage } from './pages/customer/C04_MyOrdersPage';
import { C07_WriteReviewPage } from './pages/customer/C07_WriteReviewPage';
import { C08_ProfilePage } from './pages/customer/C08_ProfilePage';
import { S01_SalesDashboardPage } from './pages/sales/S01_SalesDashboardPage';
import { S02_OrderQueuePage } from './pages/sales/S02_OrderQueuePage';
import { S03_OrderProcessPage } from './pages/sales/S03_OrderProcessPage';
import { S04_OrderPaymentSchedulePage } from './pages/sales/S04_OrderPaymentSchedulePage';
import { S05_InventoryPage } from './pages/sales/S05_InventoryPage';
import { S06_LowStockRestockPage } from './pages/sales/S06_LowStockRestockPage';
import { S07_ReceivablesPage } from './pages/sales/S07_ReceivablesPage';
import { A01_AdminDashboardPage } from './pages/admin/A01_AdminDashboardPage';
import { A02_RevenueReportPage } from './pages/admin/A02_RevenueReportPage';
import { A03_BrandSalesReportPage } from './pages/admin/A03_BrandSalesReportPage';
import { A04_CustomerInsightsPage } from './pages/admin/A04_CustomerInsightsPage';
import { A05_ProductManagementPage } from './pages/admin/A05_ProductManagementPage';
import { A06_VariantManagementPage } from './pages/admin/A06_VariantManagementPage';
import { A07_CatalogReferencePage } from './pages/admin/A07_CatalogReferencePage';
import { A08_MembershipTiersPage } from './pages/admin/A08_MembershipTiersPage';

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

        {/* C03: Mua bản Limited Edition */}
        <Route path="/limited/:variantId" element={<C03_LimitedEditionOrderPage />} />

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

        {/* C07: Viết đánh giá sản phẩm */}
        <Route
          path="/account/orders/:id/items/:itemId/review"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <C07_WriteReviewPage />
            </ProtectedRoute>
          }
        />

        {/* C08: Hồ sơ cá nhân & Hạng thành viên */}
        <Route
          path="/account/profile"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <C08_ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <C08_ProfilePage />
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

        {/* Trang lỗi hệ thống */}
        <Route path="/403" element={<Forbidden403Page />} />
        <Route path="*" element={<NotFound404Page />} />
      </Route>
      {/* Màn hình Admin được bảo vệ (A01 - A08 | FR14, FR15a, FR15b) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <A01_AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports/revenue"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <A02_RevenueReportPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports/brands"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <A03_BrandSalesReportPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports/insights"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <A04_CustomerInsightsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <A05_ProductManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products/:id/variants"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <A06_VariantManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/catalog"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <A07_CatalogReferencePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tiers"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <A08_MembershipTiersPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;
