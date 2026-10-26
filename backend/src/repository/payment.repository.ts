// ============================================================================
// File: backend/src/repository/payment.repository.ts
// Vai trò: Tầng Repository — Chứa toàn bộ truy vấn SQL thuần thao tác trên bảng
//          `payments` (tạo lịch thanh toán, đánh dấu đã thanh toán nguyên tử
//          WHERE status = 'pending', truy vấn công nợ và đánh dấu quá hạn).
// Phụ trách: FR7, FR8, FR13 | Loại query tiêu biểu: a, c, e (Phức hợp), f (Join)
// ============================================================================
