// ============================================================================
// File: frontend/src/auth/authUtils.ts
// Vai trò: Module tiện ích chuẩn hóa phân quyền và điều hướng cho hệ thống xác thực:
//          - Xác định trang đích mặc định cho từng vai trò người dùng (UserRole)
//          - Kiểm tra tính hợp lệ và quyền hạn của URL mục tiêu trước khi chuyển hướng
//          - Trích xuất URL mục tiêu từ mọi định dạng (state.from object/string, query ?redirect=)
// ============================================================================

import type { UserRole } from '../types';

/**
 * Lấy tuyến đường bảng điều khiển mặc định theo vai trò tài khoản
 */
export const getDefaultRouteForRole = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'sales':
      return '/sales';
    case 'customer':
    default:
      return '/account/orders';
  }
};

/**
 * Kiểm tra xem một đường dẫn (pathname) có được phép truy cập bởi vai trò tài khoản hay không.
 * Ngăn chặn tuyệt đối việc điều hướng mù quáng dẫn đến lỗi 403 Forbidden.
 */
export const isRouteAllowedForRole = (path: string, role: UserRole): boolean => {
  if (!path || typeof path !== 'string') {
    return false;
  }

  // Chuẩn hóa đường dẫn: loại bỏ query/hash nếu có
  const cleanPath = path.split('?')[0].split('#')[0];

  // Không bao giờ điều hướng về các trang xác thực hoặc trang thông báo lỗi hệ thống
  if (
    cleanPath === '/login' ||
    cleanPath === '/register' ||
    cleanPath === '/403' ||
    cleanPath === '/404'
  ) {
    return false;
  }

  // 1. Phân hệ Admin (/admin/*)
  if (cleanPath.startsWith('/admin')) {
    return role === 'admin';
  }

  // 2. Phân hệ Sales (/sales/*)
  if (cleanPath.startsWith('/sales')) {
    // Các trang kho và công nợ dùng chung giữa Sales và Admin
    if (
      cleanPath.startsWith('/sales/inventory') ||
      cleanPath.startsWith('/sales/receivables')
    ) {
      return role === 'sales' || role === 'admin';
    }
    return role === 'sales';
  }

  // 3. Phân hệ Khách hàng riêng tư (/account/*, /orders, /profile, /checkout/*)
  if (
    cleanPath.startsWith('/account') ||
    cleanPath.startsWith('/orders') ||
    cleanPath.startsWith('/profile') ||
    cleanPath.startsWith('/checkout')
  ) {
    return role === 'customer';
  }

  // 4. Màn hình mua bản giới hạn và giỏ hàng
  if (cleanPath.startsWith('/limited') || cleanPath.startsWith('/cart')) {
    return role === 'customer';
  }

  // 5. Tuyến đường công khai (Storefront: /, /products, /products/:id,...) -> Cho phép tất cả
  return true;
};

/**
 * Trích xuất đường dẫn điều hướng mục tiêu từ mọi nguồn có thể:
 * 1. React Router location.state: { from: { pathname: '/...' } } (từ ProtectedRoute)
 * 2. React Router location.state: { from: '/...' } (chuỗi truyền trực tiếp)
 * 3. URL query parameter: ?redirect=/... (từ CartSummary, CartPage)
 */
export const extractRedirectTarget = (
  locationState: unknown,
  searchString: string
): string | null => {
  // 1. Kiểm tra location.state.from
  const rawFrom = (locationState as { from?: unknown })?.from;
  if (typeof rawFrom === 'string' && rawFrom.trim().startsWith('/')) {
    return rawFrom.trim();
  }
  if (
    rawFrom &&
    typeof rawFrom === 'object' &&
    'pathname' in rawFrom &&
    typeof (rawFrom as { pathname: unknown }).pathname === 'string'
  ) {
    const pathname = (rawFrom as { pathname: string }).pathname.trim();
    if (pathname.startsWith('/')) {
      return pathname;
    }
  }

  // 2. Kiểm tra query param ?redirect=
  if (searchString) {
    try {
      const searchParams = new URLSearchParams(searchString);
      const redirectParam = searchParams.get('redirect');
      if (redirectParam && redirectParam.trim().startsWith('/')) {
        return redirectParam.trim();
      }
    } catch {
      // Bỏ qua lỗi cú pháp query string nếu có
    }
  }

  return null;
};
