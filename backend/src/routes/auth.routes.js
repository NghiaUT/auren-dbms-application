// ============================================================================
// File: backend/src/routes/auth.routes.js
// Vai trò: Tầng Route — Khai báo các endpoint xác thực và quản lý tài khoản cá nhân:
//   - POST   /api/auth/register (FR1 - Guest)
//   - POST   /api/auth/login    (FR0 - Guest)
//   - POST   /api/auth/logout   (FR0 - Đã đăng nhập)
//   - GET    /api/auth/me       (Xem hồ sơ & hạng thành viên - Đã đăng nhập)
//   - PATCH  /api/auth/me       (Cập nhật hồ sơ - Đã đăng nhập)
// Quy tắc: Chỉ khai báo endpoint và gắn middleware, không chứa logic nghiệp vụ.
// ============================================================================
