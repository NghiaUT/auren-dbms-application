// ============================================================================
// File: backend/src/routes/limited.routes.ts
// Vai trò: Tầng Route — Khai báo các endpoint truy vấn ấn bản Limited Edition (FR6)
// ============================================================================

import { Router } from 'express';
import * as limitedController from '../controllers/limited.controller.js';

const limitedRouter = Router();

/**
 * [FR6] GET /api/limited/:variantId/units
 * Lấy ma trận số hiệu bản khắc của biến thể Limited
 */
limitedRouter.get('/:variantId/units', limitedController.getVariantEditionUnits);

export default limitedRouter;
