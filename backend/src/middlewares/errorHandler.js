// ============================================================================
// File: backend/src/middlewares/errorHandler.js
// Vai trò: Middleware xử lý lỗi tập trung của Express.
//          Chuyển đổi AppError, lỗi Zod và lỗi MySQL (ER_DUP_ENTRY, ER_ROW_IS_REFERENCED...)
//          sang định dạng JSON thống nhất: { error: { code, message } } với đúng mã HTTP.
// ============================================================================
