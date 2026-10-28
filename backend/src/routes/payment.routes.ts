// ============================================================================
// File: backend/src/routes/payment.routes.ts
// Vai trò: Tầng Route — Khai báo endpoint thanh toán cho Customer:
//   - POST /api/payments/:id/pay        (FR7 - Thanh toán khoản phải trả)
// Quy tắc: Chỉ khai báo endpoint và gắn middleware, không chứa logic nghiệp vụ.
// ============================================================================

import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import * as paymentController from '../controllers/payment.controller.js';

const paymentRouter = Router();

// Yêu cầu token hợp lệ cho tất cả các endpoint của payment
paymentRouter.use(authenticate);

/**
 * [11] POST /api/payments/:id/pay
 * Thanh toán khoản phải trả (deposit, final, installment)
 */
paymentRouter.post(
  '/:id/pay',
  validate(paymentController.paySchema),
  paymentController.payInstallment,
);

export default paymentRouter;
