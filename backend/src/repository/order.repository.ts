// ============================================================================
// File: backend/src/repository/order.repository.ts
// Vai trò: Tầng Repository — Chứa toàn bộ truy vấn SQL thuần thao tác trên các bảng
//          `orders` và `order_items` (tạo đơn, thêm dòng hàng với trường JSON
//          customization, nhận đơn nguyên tử WHERE sales_user_id IS NULL,
//          chuyển trạng thái đơn và huỷ đơn).
// Phụ trách: FR5, FR8, FR9, FR11 | Loại query tiêu biểu: a, b, c, d, f (Join)
// ============================================================================
