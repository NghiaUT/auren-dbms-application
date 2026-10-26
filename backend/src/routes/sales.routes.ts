// ============================================================================
// File: backend/src/routes/sales.routes.ts
// Vai trò: Tầng Route — Khai báo các endpoint nghiệp vụ dành cho vai trò Sales:
//   - GET   /api/sales/summary                  (FR11-13 - Tổng quan công việc Sales)
//   - GET   /api/sales/orders                   (FR11 - Hàng đợi đơn hàng theo trạng thái)
//   - GET   /api/sales/orders/:id               (FR11 - Chi tiết đơn hàng để xử lý)
//   - PATCH /api/sales/orders/:id/claim         (FR11 - Nhận phụ trách đơn hàng)
//   - PATCH /api/sales/orders/:id/status        (FR11 - Chuyển trạng thái đơn hợp lệ kế tiếp)
//   - POST  /api/sales/orders/:id/cancel        (FR9  - Sales huỷ đơn hàng)
//   - POST  /api/sales/orders/:id/payments      (FR7b - Lập lịch thanh toán cọc/trả góp)
//   - GET   /api/sales/inventory                (FR12 - Tra cứu tồn kho theo biến thể & kho)
//   - GET   /api/sales/inventory/low-stock      (FR12 - Cảnh báo biến thể sắp hết hàng)
//   - PATCH /api/sales/inventory/restock        (FR12 - Nhập thêm tồn kho)
//   - GET   /api/sales/receivables              (FR13 - Danh sách công nợ và khoản quá hạn)
//   - POST  /api/sales/receivables/mark-overdue (FR13 - Đánh dấu các khoản quá hạn)
// Quy tắc: Chỉ khai báo endpoint và gắn middleware, không chứa logic nghiệp vụ.
// ============================================================================
