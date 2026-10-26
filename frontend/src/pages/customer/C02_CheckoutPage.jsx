// ============================================================================
// File: frontend/src/pages/customer/C02_CheckoutPage.jsx
// Mã màn hình: C02 | Route: /checkout | FR: FR5, FR7
// Vai trò: Màn hình Thanh toán & Xác nhận đặt hàng — Nhập địa chỉ giao hàng
//          (snapshot), hiển thị bảng tạm tính, mức giảm giá theo hạng thành viên,
//          tổng tiền, chọn phương án thanh toán và xử lý thông báo lỗi 409 nếu
//          xung đột tồn kho (Optimistic Locking) hoặc hết hàng.
// API sử dụng: POST /api/orders
// ============================================================================
