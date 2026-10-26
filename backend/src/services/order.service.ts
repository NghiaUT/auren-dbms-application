// ============================================================================
// File: backend/src/services/order.service.ts
// Vai trò: Tầng Service — Xử lý nghiệp vụ đặt hàng và vòng đời đơn của Customer:
//   - FR5: Đặt hàng thường trong một Transaction (lấy giá từ DB, giữ tồn kho
//          bằng Optimistic Locking qua version, tính chiết khấu theo hạng thành viên,
//          tạo đơn và các dòng hàng).
//   - FR6: Đặt mua bản Limited Edition trong Transaction với Pessimistic Locking
//          (SELECT ... FOR UPDATE) để cấp phát số serial duy nhất.
//   - FR8: Xem lịch sử và chi tiết đơn hàng (kiểm tra quyền sở hữu row-level).
//   - FR9: Huỷ đơn hàng khi đang ở trạng thái hợp lệ và hoàn trả tồn kho / serial.
// Quy tắc: Mở và commit/rollback transaction qua withTransaction, không viết SQL.
// ============================================================================
