// ============================================================================
// File: backend/src/routes/review.routes.ts
// Vai trò: Tầng Route — Khai báo các endpoint đánh giá sản phẩm (FR10):
//   - POST   /api/reviews               (Customer tạo đánh giá sau khi đơn delivered)
//   - DELETE /api/reviews/:id           (Customer xoá đánh giá của mình / Admin xoá bất kỳ)
//   - GET    /api/reviews/item/:orderItemId (Lấy đánh giá hiện có của dòng sản phẩm)
// ============================================================================

import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import * as reviewController from '../controllers/review.controller.js';

const reviewRouter = Router();

// Toàn bộ thao tác review yêu cầu xác thực
reviewRouter.use(authenticate);

/**
 * [FR10] POST /api/reviews
 * Tạo đánh giá cho dòng sản phẩm trong đơn đã hoàn thành
 */
reviewRouter.post(
  '/',
  authorize('customer'),
  validate(reviewController.createReviewSchema),
  reviewController.createReview,
);

/**
 * [FR10] DELETE /api/reviews/:id
 * Xóa đánh giá (chỉ chủ sở hữu hoặc Admin)
 */
reviewRouter.delete(
  '/:id',
  authorize('customer', 'admin'),
  reviewController.deleteReview,
);

/**
 * GET /api/reviews/item/:orderItemId
 * Lấy đánh giá của một dòng sản phẩm
 */
reviewRouter.get(
  '/item/:orderItemId',
  authorize('customer', 'admin'),
  reviewController.getOrderItemReview,
);

export default reviewRouter;
