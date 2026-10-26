// ============================================================================
// File: backend/src/repository/tier.repository.js
// Vai trò: Tầng Repository — Chứa toàn bộ truy vấn SQL thuần thao tác trên bảng
//          `membership_tiers` (CRUD hạng thành viên, tính toán lại hạng tự động
//          theo ngưỡng min_spent bằng Subquery).
// Phụ trách: FR15b | Loại query tiêu biểu: a (Insert), c (Update), g (Subquery)
// ============================================================================
