// ============================================================================
// File: frontend/src/pages/customer/C05_OrderDetailPage.jsx
// Mã màn hình: C05 | Route: /account/orders/:id | FR: FR8, FR9, FR10
// Vai trò: Màn hình Chi tiết đơn hàng của Customer — Hiển thị tiến trình trạng thái,
//          danh sách dòng sản phẩm kèm cấu hình tuỳ chỉnh / số serial Limited,
//          lịch thanh toán, nút Huỷ đơn (chỉ bật khi trạng thái là pending)
//          và nút Viết đánh giá (chỉ bật khi trạng thái là delivered).
// API sử dụng: GET /api/orders/:id, POST /api/orders/:id/cancel
// ============================================================================
