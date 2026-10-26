// ============================================================================
// File: frontend/src/pages/customer/C03_LimitedEditionOrderPage.jsx
// Mã màn hình: C03 | Route: /limited/:variantId | FR: FR6
// Vai trò: Màn hình Đặt mua bản Limited Edition — Hiển thị số lượng bản còn lại
//          (vd: 12/50), danh sách serial khả dụng, thực hiện đặt mua với cơ chế
//          khoá dòng Pessimistic Locking (SELECT ... FOR UPDATE) và xử lý thông báo
//          khi có khách hàng khác vừa mua trước.
// API sử dụng: GET /api/limited/:variantId/units, POST /api/orders/limited
// ============================================================================
