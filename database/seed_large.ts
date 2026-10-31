// ============================================================================
// File: database/seed_large.ts
// Vai trò: Điểm vào thực thi nạp dữ liệu quy mô lớn (10.000 - 50.000+ đơn hàng)
//          phục vụ demo đánh giá hiệu năng Indexing và Query Processing
//          (so sánh EXPLAIN / EXPLAIN ANALYZE trước và sau khi đánh index).
// ============================================================================

import '../backend/src/scripts/seed-large.js';
