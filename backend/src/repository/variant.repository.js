// ============================================================================
// File: backend/src/repository/variant.repository.js
// Vai trò: Tầng Repository — Chứa toàn bộ truy vấn SQL thuần thao tác trên các bảng
//          `product_variants` và `variant_materials` (tra cứu biến thể, gán thành phần
//          chất liệu, kiểm tra biến thể đã bán qua Subquery trước khi xoá).
// Phụ trách: FR4, FR14 | Loại query tiêu biểu: f (Join), a, c, b, g (Subquery)
// ============================================================================
