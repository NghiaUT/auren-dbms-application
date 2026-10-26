// ============================================================================
// File: frontend/src/pages/sales/S06_LowStockRestockPage.tsx
// Mã màn hình: S06 | Route: /sales/inventory/low-stock | FR: FR12
// Vai trò: Cảnh báo sắp hết hàng & Nhập kho — Liệt kê các biến thể có tổng tồn
//          khả dụng dưới ngưỡng định mức (Subquery + HAVING), cung cấp form
//          nhập thêm số lượng tồn kho và xử lý xung đột phiên bản (version).
// API sử dụng: GET /api/sales/inventory/low-stock, PATCH /api/sales/inventory/restock
// ============================================================================
