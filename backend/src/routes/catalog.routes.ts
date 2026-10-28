// ============================================================================
// File: backend/src/routes/catalog.routes.ts
// Vai trò: Tầng Route — Khai báo các endpoint tra cứu danh mục công khai (Guest & Auth):
//   - GET /api/catalog/meta          (FR2, FR3 - Dữ liệu tham chiếu cho bộ lọc)
//   - GET /api/products              (FR2, FR3 - Tìm kiếm, lọc, phân trang, sắp xếp)
//   - GET /api/products/:id          (FR4 - Chi tiết sản phẩm, biến thể, chất liệu, tồn kho)
//   - GET /api/categories            (FR2 - Cây danh mục)
//   - GET /api/brands                (FR3 - Danh sách thương hiệu)
//   - GET /api/materials             (FR3 - Danh sách chất liệu)
//   - GET /api/locations             (FR2 - Danh sách showroom / kho)
// Quy tắc: Chỉ khai báo endpoint và gắn middleware, không chứa logic nghiệp vụ.
// ============================================================================

import { Router } from 'express';
import { optionalAuthenticate } from '../middlewares/optionalAuthenticate.js';
import * as catalogController from '../controllers/catalog.controller.js';

const catalogRouter = Router();

/**
 * [3] GET /api/catalog/meta
 * Dữ liệu tham chiếu dùng chung cho bộ lọc (danh mục, thương hiệu, chất liệu, địa điểm)
 */
catalogRouter.get('/catalog/meta', catalogController.getCatalogMeta);

/**
 * [4] GET /api/products
 * Danh sách, tìm kiếm và lọc sản phẩm công khai
 * Middleware: optionalAuthenticate (để nhận diện nếu là admin có quyền includeInactive)
 */
catalogRouter.get('/products', optionalAuthenticate, catalogController.getProducts);

/**
 * [5] GET /api/products/:id
 * Xem chi tiết tác phẩm nội thất
 * Middleware: optionalAuthenticate (để thực thi FR4: Guest ẩn số tồn, Auth hiện tồn theo kho)
 */
catalogRouter.get('/products/:id', optionalAuthenticate, catalogController.getProductDetail);

/**
 * Các endpoint danh mục tham chiếu phụ
 */
catalogRouter.get('/categories', catalogController.getCategories);
catalogRouter.get('/brands', catalogController.getBrands);
catalogRouter.get('/materials', catalogController.getMaterials);
catalogRouter.get('/locations', catalogController.getLocations);

export default catalogRouter;
