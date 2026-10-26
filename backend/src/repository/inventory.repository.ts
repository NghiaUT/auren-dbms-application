// ============================================================================
// File: backend/src/repository/inventory.repository.ts
// Vai trò: Tầng Repository — Chứa toàn bộ truy vấn SQL thuần thao tác trên bảng
//          `inventory`:
//   - Giữ hàng (reserveStock) bằng cơ chế Optimistic Locking qua cột `version`
//   - Hoàn trả tồn kho khi huỷ đơn, nhập thêm hàng (restock)
//   - Truy vấn cảnh báo biến thể sắp hết hàng bằng Subquery + HAVING
// Phụ trách: FR5, FR9, FR12 | Loại query tiêu biểu: c (Update), f (Join), g (Subquery)
// ============================================================================
