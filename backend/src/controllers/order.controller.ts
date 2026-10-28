// ============================================================================
// File: backend/src/controllers/order.controller.ts
// Vai trò: Tầng Controller — Nhận yêu cầu đặt hàng thường (FR5), đặt hàng bản
//          Limited Edition (FR6), xem danh sách/chi tiết đơn (FR8) và huỷ đơn (FR9),
//          gọi order.service và trả HTTP response với status code phù hợp.
// Quy tắc: Không viết câu lệnh SQL, không trực tiếp mở transaction.
// ============================================================================

import type { Request, Response } from 'express';
import { z } from 'zod';
import * as orderService from '../services/order.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccessRes } from '../utils/sendSuccessRes.js';
import { BadRequestError, UnauthorizedError } from '../utils/AppError.js';

export const placeOrderItemSchema = z.object({
  variantId: z.coerce.number().int().positive('variantId phải là số nguyên dương'),
  locationId: z.coerce.number().int().positive('locationId phải là số nguyên dương'),
  quantity: z.coerce.number().int().min(1, 'quantity tối thiểu là 1'),
  customization: z.record(z.any()).optional().nullable(),
});

export const placeOrderSchema = z.object({
  shippingAddress: z.string().min(5, 'Địa chỉ giao hàng tối thiểu 5 ký tự').max(255),
  deliveryDate: z.string().optional().nullable(),
  items: z.array(placeOrderItemSchema).min(1, 'Đơn hàng phải có ít nhất 1 dòng sản phẩm').max(20),
});

/**
 * [FR5, FR6] POST /api/orders
 * Tạo đơn hàng mới trong một Transaction ACID
 */
export const createOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('Yêu cầu đăng nhập để tạo đơn hàng.');
  }

  const result = await orderService.placeOrder(req.user, req.body);
  sendSuccessRes(res, result, 'Đặt hàng thành công.', 201);
});

/**
 * [FR8] GET /api/orders
 * Lấy danh sách đơn hàng của người dùng hiện tại
 */
export const getMyOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('Yêu cầu đăng nhập để xem đơn hàng.');
  }

  const query = {
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
  };

  const result = await orderService.getMyOrders(req.user, query);
  res.status(200).json({
    data: result.data,
    meta: result.meta,
  });
});

/**
 * [FR8] GET /api/orders/:id
 * Xem chi tiết đơn hàng, dòng hàng và lịch thanh toán
 */
export const getOrderDetail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('Yêu cầu đăng nhập để xem chi tiết đơn hàng.');
  }

  const id = Number(req.params.id);
  if (isNaN(id) || id <= 0) {
    throw new BadRequestError('Mã đơn hàng không hợp lệ.');
  }

  const result = await orderService.getOrderDetail(id, req.user);
  sendSuccessRes(res, result, 'Lấy chi tiết đơn hàng thành công.', 200);
});

/**
 * [FR9] POST /api/orders/:id/cancel
 * Hủy đơn hàng và giải phóng tồn kho / số serial
 */
export const cancelOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('Yêu cầu đăng nhập để thực hiện huỷ đơn.');
  }

  const id = Number(req.params.id);
  if (isNaN(id) || id <= 0) {
    throw new BadRequestError('Mã đơn hàng không hợp lệ.');
  }

  const result = await orderService.cancelOrder(id, req.user);
  sendSuccessRes(res, result, 'Huỷ đơn hàng thành công.', 200);
});
