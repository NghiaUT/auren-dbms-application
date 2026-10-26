// ============================================================================
// File: backend/src/routes/admin.routes.ts
// Vai trò: Tầng Route — Khai báo các endpoint quản trị dành cho vai trò Admin:
//   - GET/POST/PATCH/DELETE /api/admin/products, /api/admin/products/:id    (FR14)
//   - GET/POST              /api/admin/products/:id/variants                (FR14)
//   - PATCH/DELETE          /api/admin/variants/:id                         (FR14)
//   - PUT                   /api/admin/variants/:id/materials               (FR14)
//   - CRUD                  /api/admin/categories, /brands, /materials      (FR14)
//   - GET                   /api/admin/reports/summary, /revenue,
//                           /brand-sales, /ratings, /top-customers          (FR15a)
//   - GET/POST/PATCH        /api/admin/tiers                                (FR15b)
//   - POST                  /api/admin/tiers/recalculate                    (FR15b)
//   - GET/POST/PATCH        /api/admin/users                                (Bổ sung)
// Quy tắc: Chỉ khai báo endpoint và gắn middleware, không chứa logic nghiệp vụ.
// ============================================================================
