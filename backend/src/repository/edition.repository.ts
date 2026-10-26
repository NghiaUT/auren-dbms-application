// ============================================================================
// File: backend/src/repository/edition.repository.ts
// Vai trò: Tầng Repository — Chứa toàn bộ truy vấn SQL thuần thao tác trên bảng
//          `edition_units`:
//   - Khoá dòng khả dụng bằng Pessimistic Locking (`SELECT ... FOR UPDATE`)
//     để chống tranh chấp khi nhiều khách cùng mua một bản Limited Edition
//   - Gán serial vào dòng đơn hàng hoặc giải phóng khi huỷ đơn
// Phụ trách: FR6, FR9 | Loại query tiêu biểu: c (Update), d (Select For Update)
// ============================================================================
