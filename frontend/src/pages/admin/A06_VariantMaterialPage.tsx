// ============================================================================
// File: frontend/src/pages/admin/A06_VariantMaterialPage.tsx
// Mã màn hình: A06 | Route: /admin/products/:id/variants | FR: FR14
// Vai trò: Quản lý Biến thể & Thành phần Chất liệu của sản phẩm — Thêm/sửa/xoá
//          biến thể (SKU, kích thước, hoàn thiện, giá, thời gian chế tác, trạng thái),
//          gán danh sách chất liệu kèm tỉ lệ %; chặn xoá nếu biến thể đã phát sinh đơn.
// API sử dụng: GET/POST /api/admin/products/:id/variants,
//              PATCH/DELETE /api/admin/variants/:id,
//              PUT /api/admin/variants/:id/materials
// ============================================================================
