// ============================================================================
// File: backend/src/controllers/payment.controller.ts
// Vai trò: Tầng Controller — Nhận yêu cầu thanh toán khoản phải trả (FR7),
//          gọi payment.service và trả kết quả HTTP response.
// Quy tắc: Không viết câu lệnh SQL, không trực tiếp mở transaction.
// ============================================================================

import type { Request, Response } from 'express';
import { z } from 'zod';
import * as paymentService from '../services/payment.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccessRes } from '../utils/sendSuccessRes.js';
import { BadRequestError, UnauthorizedError } from '../utils/AppError.js';

export const paySchema = z.object({
  method: z.enum(['bank_transfer', 'card', 'cash']).default('bank_transfer'),
});

/**
 * [FR7] POST /api/payments/:id/pay
 * Thanh toán cho một khoản cọc hoặc trả góp
 */
export const payInstallment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('Yêu cầu đăng nhập để thanh toán.');
  }

  const id = Number(req.params.id);
  if (isNaN(id) || id <= 0) {
    throw new BadRequestError('Mã khoản thanh toán không hợp lệ.');
  }

  const result = await paymentService.processPayment(id, req.user, req.body.method);
  sendSuccessRes(res, result, 'Ghi nhận thanh toán thành công.', 200);
});
