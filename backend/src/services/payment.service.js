// ============================================================================
// File: backend/src/services/payment.service.js
// Vai trò: Tầng Service — Xử lý nghiệp vụ thanh toán đơn hàng (FR7):
//   - Kiểm tra quyền sở hữu đơn hàng và trạng thái khoản thu (pending/overdue)
//   - Ghi nhận thanh toán (cọc, trả góp, tất toán), chống thanh toán trùng lặp
//   - Tự động cộng dồn total_spent của khách hàng khi hoàn tất thanh toán đơn
// Quy tắc: Chứa logic nghiệp vụ và quản lý transaction, không viết câu lệnh SQL.
// ============================================================================
