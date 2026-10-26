// ============================================================================
// File: backend/src/routes/order.routes.ts
// Vai trò: Tầng Route — Khai báo các endpoint đặt hàng & theo dõi đơn của Customer:
//   - POST /api/orders                  (FR5 - Đặt hàng thường)
//   - GET  /api/limited/:variantId/units(FR6 - Tra cứu các bản Limited Edition)
//   - POST /api/orders/limited          (FR6 - Đặt mua bản Limited Edition)
//   - GET  /api/orders/me               (FR8 - Danh sách đơn hàng của tôi)
//   - GET  /api/orders/:id              (FR8 - Chi tiết đơn hàng)
//   - GET  /api/orders/:id/payments     (FR7, FR8 - Lịch thanh toán của đơn)
//   - POST /api/orders/:id/cancel       (FR9 - Huỷ đơn hàng khi đang pending)
// Quy tắc: Chỉ khai báo endpoint và gắn middleware, không chứa logic nghiệp vụ.
// ============================================================================
