// ============================================================================
// File: backend/src/config/db.ts
// Vai trò:
//   - Khởi tạo connection pool kết nối tới MySQL 8 thông qua mysql2/promise
//   - Cung cấp hàm tiện ích withTransaction(fn, isolation) để quản lý giao dịch
//     (SET TRANSACTION ISOLATION LEVEL, BEGIN, COMMIT và tự động ROLLBACK khi lỗi)
// ============================================================================
