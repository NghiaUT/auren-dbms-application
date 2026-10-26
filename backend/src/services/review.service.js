// ============================================================================
// File: backend/src/services/review.service.js
// Vai trò: Tầng Service — Xử lý nghiệp vụ đánh giá sản phẩm (FR10):
//   - Kiểm tra điều kiện khách hàng sở hữu dòng đơn hàng và đơn đã giao (delivered)
//   - Tạo đánh giá mới (1 đánh giá / dòng đơn hàng)
//   - Xoá đánh giá (chỉ chủ sở hữu hoặc Admin được phép xoá)
// Quy tắc: Chứa logic nghiệp vụ, không viết câu lệnh SQL trực tiếp.
// ============================================================================
