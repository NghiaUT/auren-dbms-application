// ============================================================================
// File: backend/src/middlewares/authenticate.ts
// Vai trò: Middleware xác thực người dùng qua JWT (header Authorization: Bearer).
//          Giải mã token, gắn thông tin { id, role, customerId } vào req.user,
//          trả về lỗi 401 nếu thiếu token hoặc token không hợp lệ / hết hạn.
// ============================================================================
