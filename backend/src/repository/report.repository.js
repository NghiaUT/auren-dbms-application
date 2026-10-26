// ============================================================================
// File: backend/src/repository/report.repository.js
// Vai trò: Tầng Repository — Chứa các truy vấn SQL phân tích, thống kê tổng hợp
//          (GROUP BY, HAVING, Subquery, Aggregate functions SUM/COUNT/AVG):
//   - Tổng quan KPI Dashboard (doanh thu, số đơn, khách mới)
//   - Doanh thu theo tháng
//   - Doanh số theo thương hiệu / danh mục có ngưỡng tối thiểu (HAVING)
//   - Điểm đánh giá trung bình sản phẩm và danh sách khách VIP chi tiêu trên mức TB
// Phụ trách: FR15a | Loại query tiêu biểu: f (Join), g (Subquery), h (Aggregate)
// ============================================================================
