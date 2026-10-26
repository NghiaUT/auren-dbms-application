// ============================================================================
// File: backend/src/services/sales.service.js
// Vai trò: Tầng Service — Xử lý nghiệp vụ dành cho nhân viên kinh doanh (Sales):
//   - FR11: Nhận đơn hàng chưa có người phụ trách (claim) và chuyển trạng thái
//           đơn theo đúng quy trình nghiệp vụ.
//   - FR7b: Lập lịch thanh toán (cọc, trả góp, thanh toán cuối) cho đơn hàng.
//   - FR12: Tra cứu tồn kho, lọc các biến thể dưới ngưỡng cảnh báo và nhập kho
//           có kiểm soát xung đột version.
//   - FR13: Theo dõi công nợ phải thu và đánh dấu các khoản quá hạn (overdue).
// Quy tắc: Chứa logic nghiệp vụ và quản lý transaction, không viết câu lệnh SQL.
// ============================================================================
