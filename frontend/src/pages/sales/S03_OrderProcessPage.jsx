// ============================================================================
// File: frontend/src/pages/sales/S03_OrderProcessPage.jsx
// Mã màn hình: S03 | Route: /sales/orders/:id | FR: FR11, FR9
// Vai trò: Xử lý đơn hàng Sales — Hiển thị thông tin khách hàng, danh sách dòng hàng,
//          cập nhật ngày giao dự kiến, nút chuyển sang trạng thái hợp lệ kế tiếp
//          (confirmed -> in_production -> shipped -> delivered) hoặc huỷ đơn.
// API sử dụng: GET /api/sales/orders/:id, PATCH /api/sales/orders/:id/status,
//              POST /api/sales/orders/:id/cancel
// ============================================================================
