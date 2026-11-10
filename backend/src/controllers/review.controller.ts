// ============================================================================
// File: backend/src/controllers/review.controller.ts
// Vai trò: Tầng Controller — Xử lý các yêu cầu đánh giá sản phẩm (FR10):
//   - POST   /api/reviews
//   - DELETE /api/reviews/:id
//   - GET    /api/reviews/item/:orderItemId
// ============================================================================

import type { Request, Response } from 'express';
import { z } from 'zod';
import * as reviewService from '../services/review.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccessRes } from '../utils/sendSuccessRes.js';
import { UnauthorizedError } from '../utils/AppError.js';

const positiveId = z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive().max(4_294_967_295));

export const createReviewSchema = z.object({
  orderItemId: z.coerce.number().int().positive('Mã dòng sản phẩm (orderItemId) phải là số nguyên dương'),
  rating: z.coerce.number().int().min(1, 'Đánh giá tối thiểu 1 sao').max(5, 'Đánh giá tối đa 5 sao'),
  comment: z.string().max(2000, 'Nội dung nhận xét tối đa 2000 ký tự').optional().nullable(),
});

/**
 * [FR10] POST /api/reviews
 * Gửi đánh giá cho một dòng sản phẩm trong đơn đã giao (delivered)
 */
export const createReview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('Yêu cầu đăng nhập để gửi đánh giá.');
  }

  const review = await reviewService.createReview(req.user.id, req.body);
  sendSuccessRes(res, review, 'Cảm nhận nghệ thuật của quý khách đã được ghi nhận thành công', 201);
});

/**
 * [FR10] DELETE /api/reviews/:id
 * Xóa đánh giá (Customer tự xoá hoặc Admin kiểm duyệt)
 */
export const deleteReview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('Yêu cầu đăng nhập để thực hiện thao tác.');
  }

  const reviewId = positiveId.parse(req.params.id);

  const result = await reviewService.deleteReview(req.user.id, req.user.role, reviewId);
  sendSuccessRes(res, result, 'Đã gỡ bỏ bài đánh giá thành công', 200);
});

/**
 * GET /api/reviews/item/:orderItemId
 * Lấy đánh giá của một dòng sản phẩm nếu có
 */
export const getOrderItemReview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('Yêu cầu đăng nhập.');
  }

  const orderItemId = positiveId.parse(req.params.orderItemId);

  const review = await reviewService.getReviewByOrderItem(req.user.id, req.user.role, orderItemId);
  sendSuccessRes(res, review, 'Lấy thông tin đánh giá thành công', 200);
});
