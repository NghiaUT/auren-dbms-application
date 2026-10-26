// ============================================================================
// File: frontend/src/auth/ProtectedRoute.jsx
// Vai trò: Component bảo vệ route ở tầng giao diện (ProtectedRoute({ roles })):
//   - Nếu chưa đăng nhập -> chuyển hướng về /login
//   - Nếu vai trò hiện tại không nằm trong danh sách roles cho phép -> chuyển tới trang 403
// ============================================================================
