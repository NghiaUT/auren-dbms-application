// ============================================================================
// File: backend/src/routes/catalog.routes.ts
// Vai trò: Tầng Route — Khai báo các endpoint tra cứu danh mục công khai (Guest):
//   - GET /api/products              (FR2, FR3 - Tìm kiếm, lọc, phân trang, sắp xếp)
//   - GET /api/products/:id          (FR4 - Chi tiết sản phẩm, biến thể, chất liệu, tồn kho)
//   - GET /api/products/:id/reviews  (FR10 - Danh sách đánh giá của sản phẩm)
//   - GET /api/categories            (FR2 - Cây danh mục)
//   - GET /api/brands                (FR3 - Danh sách thương hiệu)
//   - GET /api/materials             (FR3 - Danh sách chất liệu)
//   - GET /api/locations             (FR2 - Danh sách showroom / kho)
// Quy tắc: Chỉ khai báo endpoint và gắn middleware, không chứa logic nghiệp vụ.
// ============================================================================
