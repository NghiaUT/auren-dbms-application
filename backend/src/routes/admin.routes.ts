// ============================================================================
// File: backend/src/routes/admin.routes.ts
// Vai trò: Tầng Route — Khai báo các endpoint quản trị dành cho vai trò Admin:
//   - POST/PATCH/DELETE /api/admin/products, /api/admin/products/:id        (FR14 [20]-[22])
//   - GET/POST          /api/admin/products/:id/variants                    (FR14 [23], A06)
//   - PATCH/DELETE      /api/admin/variants/:id                             (FR14 [24]-[25])
//   - GET               /api/admin/reports/:type                            (FR15a [29])
//   - GET/PATCH         /api/admin/tiers, /api/admin/tiers/:id              (FR15b [30]-[31])
//   - POST              /api/admin/tiers/recalculate                        (FR15b [32])
//   - POST/PATCH/DELETE /api/admin/:resource, /api/admin/:resource/:id      (FR14 [26]-[28])
// Quy tắc: Chỉ khai báo endpoint và gắn middleware, không chứa logic nghiệp vụ.
// ============================================================================

import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import * as adminController from '../controllers/admin.controller.js';

const adminRouter = Router();

// Yêu cầu xác thực JWT và vai trò Admin cho toàn bộ endpoint
adminRouter.use(authenticate);
adminRouter.use(authorize('admin'));

// ============================================================================
// 1. BÁO CÁO THỐNG KÊ (FR15a [29])
// ============================================================================
adminRouter.get('/reports/:type', adminController.getReport);

// ============================================================================
// 2. HẠNG THÀNH VIÊN & NÂNG HẠNG TỰ ĐỘNG (FR15b [30]-[32])
// ============================================================================
adminRouter.get('/tiers', adminController.getTiers);
adminRouter.post('/tiers/recalculate', adminController.recalculateTiers);
adminRouter.patch('/tiers/:id', adminController.updateTier);

// ============================================================================
// 3. QUẢN TRỊ SẢN PHẨM & BIẾN THỂ (FR14 [20]-[25])
// ============================================================================
adminRouter.post('/products', adminController.createProduct);
adminRouter.patch('/products/:id', adminController.updateProduct);
adminRouter.delete('/products/:id', adminController.deleteProduct);

adminRouter.get('/products/:id/variants', adminController.getVariantsByProductId);
adminRouter.post('/products/:id/variants', adminController.createVariant);
adminRouter.patch('/variants/:id', adminController.updateVariant);
adminRouter.delete('/variants/:id', adminController.deleteVariant);

// ============================================================================
// 4. QUẢN TRỊ DỮ LIỆU THAM CHIẾU (FR14 [26]-[28]) - categories, brands, materials
// ============================================================================
adminRouter.post('/:resource', adminController.createReferenceResource);
adminRouter.patch('/:resource/:id', adminController.updateReferenceResource);
adminRouter.delete('/:resource/:id', adminController.deleteReferenceResource);

export { adminRouter };
