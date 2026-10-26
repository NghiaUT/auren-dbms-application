// ============================================================================
// File: backend/src/middlewares/authorize.js
// Vai trò: Middleware kiểm tra phân quyền theo vai trò (RBAC) ở cấp độ route.
//          Nhận danh sách vai trò cho phép (vd: authorize('sales', 'admin'))
//          và trả về lỗi 403 Forbidden nếu req.user.role không nằm trong danh sách.
// ============================================================================
