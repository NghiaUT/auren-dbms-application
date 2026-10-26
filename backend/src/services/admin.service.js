// ============================================================================
// File: backend/src/services/admin.service.js
// Vai trò: Tầng Service — Xử lý nghiệp vụ quản trị hệ thống dành cho Admin:
//   - FR14:  Quản lý danh mục (categories, brands, materials), sản phẩm, biến thể
//            và thành phần chất liệu; chặn xoá biến thể đã phát sinh đơn hàng.
//   - FR15a: Tổng hợp dữ liệu báo cáo doanh thu, thương hiệu, đánh giá và khách VIP.
//   - FR15b: Quản lý cấu hình hạng thành viên và chạy nâng hạng tự động hàng loạt.
//   - Bổ sung: Quản lý tài khoản người dùng và phân quyền (role, is_active).
// Quy tắc: Chứa logic nghiệp vụ và quản lý transaction, không viết câu lệnh SQL.
// ============================================================================
