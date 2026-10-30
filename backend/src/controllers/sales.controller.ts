// ============================================================================
// File: backend/src/controllers/sales.controller.ts
// Vai trò: Tầng Controller — Tiếp nhận các request thuộc phân hệ Sales:
//   - GET   /api/sales/summary                  (KPI tổng quan S01)
//   - GET   /api/sales/orders                   (Hàng đợi đơn hàng S02)
//   - GET   /api/sales/orders/:id               (Chi tiết xử lý đơn S03)
//   - PATCH /api/sales/orders/:id/claim         (Nhận đơn hàng S02)
//   - PATCH /api/sales/orders/:id/status        (Đổi trạng thái đơn S03)
//   - POST  /api/sales/orders/:id/cancel        (Huỷ đơn hàng S03)
//   - POST  /api/orders/:id/payments            (Lập lịch thanh toán S04)
//   - GET   /api/sales/inventory                (Tra cứu tồn kho S05)
//   - GET   /api/sales/inventory/low-stock      (Cảnh báo sắp hết hàng S06)
//   - PATCH /api/sales/inventory/restock        (Nhập thêm tồn kho S06)
//   - GET   /api/sales/receivables              (Sổ theo dõi công nợ S07)
//   - POST  /api/sales/receivables/mark-overdue (Đánh dấu nợ quá hạn S07)
// Quy tắc: Không viết câu lệnh SQL, không trực tiếp mở transaction.
// ============================================================================

import type { Request, Response } from 'express';
import { z } from 'zod';
import * as salesService from '../services/sales.service.js';
import * as orderService from '../services/order.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccessRes } from '../utils/sendSuccessRes.js';
import { BadRequestError, UnauthorizedError } from '../utils/AppError.js';

// Schemas Zod kiểm tra dữ liệu đầu vào
export const updateOrderStatusSchema = z.object({
  status: z.enum(['in_production', 'shipped', 'delivered'], {
    errorMap: () => ({ message: 'Trạng thái chuyển đổi không hợp lệ. Chỉ chấp nhận: in_production, shipped, delivered' }),
  }),
  deliveryDate: z.string().optional().nullable(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().max(255).optional(),
});

export const paymentScheduleItemSchema = z.object({
  type: z.enum(['deposit', 'installment', 'final']),
  amount: z.coerce.number().positive('Số tiền mỗi đợt phải là số dương'),
  dueDate: z.string().min(1, 'Hạn thanh toán không được rỗng'),
});

export const createPaymentScheduleSchema = z.object({
  payments: z.array(paymentScheduleItemSchema).min(1, 'Cần ít nhất 1 đợt thanh toán').max(12, 'Tối đa 12 đợt thanh toán'),
});

export const restockSchema = z.object({
  variantId: z.coerce.number().int().positive('variantId phải là số nguyên dương'),
  locationId: z.coerce.number().int().positive('locationId phải là số nguyên dương'),
  quantity: z.coerce.number().int().min(1, 'Số lượng nhập tối thiểu là 1').max(10000),
  version: z.coerce.number().int().min(0, 'version phải lớn hơn hoặc bằng 0'),
});

export const markOverdueSchema = z.object({
  paymentIds: z.array(z.coerce.number().int().positive()).optional(),
});

/**
 * [S01] GET /api/sales/summary
 * Lấy các chỉ số KPI tổng hợp cho Sales Dashboard
 */
export const getSummary = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('Yêu cầu đăng nhập tài khoản Sales.');
  }

  const result = await salesService.getDashboardSummary(req.user);
  sendSuccessRes(res, result, 'Lấy số liệu tổng quan Sales thành công.', 200);
});

/**
 * [S02] GET /api/sales/orders
 * Lấy danh sách hàng đợi đơn hàng (tab=unassigned hoặc tab=my_orders)
 */
export const getOrderQueue = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('Yêu cầu đăng nhập tài khoản Sales.');
  }

  const tab = req.query.tab === 'my_orders' ? 'my_orders' : 'unassigned';
  const query = {
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    search: typeof req.query.search === 'string' ? req.query.search : undefined,
  };

  const result = await salesService.getOrderQueue(req.user, tab, query);
  res.status(200).json({
    data: result.data,
    meta: result.meta,
  });
});

/**
 * [S03] GET /api/sales/orders/:id
 * Xem chi tiết đơn hàng phục vụ xử lý tiến độ
 */
export const getOrderDetail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('Yêu cầu đăng nhập tài khoản Sales.');
  }

  const id = Number(req.params.id);
  if (isNaN(id) || id <= 0) {
    throw new BadRequestError('Mã đơn hàng không hợp lệ.');
  }

  const result = await orderService.getOrderDetail(id, req.user);
  sendSuccessRes(res, result, 'Lấy chi tiết đơn hàng thành công.', 200);
});

/**
 * [FR11 - S02] PATCH /api/sales/orders/:id/claim
 * Tiếp nhận đơn hàng chưa có người phụ trách
 */
export const claimOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('Yêu cầu đăng nhập tài khoản Sales.');
  }

  const id = Number(req.params.id);
  if (isNaN(id) || id <= 0) {
    throw new BadRequestError('Mã đơn hàng không hợp lệ.');
  }

  const result = await salesService.claimOrder(id, req.user);
  sendSuccessRes(res, result, 'Tiếp nhận đơn hàng thành công.', 200);
});

/**
 * [FR11 - S03] PATCH /api/sales/orders/:id/status
 * Cập nhật tiến độ trạng thái đơn hàng (in_production, shipped, delivered)
 */
export const updateStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('Yêu cầu đăng nhập tài khoản Sales.');
  }

  const id = Number(req.params.id);
  if (isNaN(id) || id <= 0) {
    throw new BadRequestError('Mã đơn hàng không hợp lệ.');
  }

  const result = await salesService.updateOrderStatus(id, req.user, req.body);
  sendSuccessRes(res, result, result.message, 200);
});

/**
 * [FR9 - S03] POST /api/sales/orders/:id/cancel
 * Sales huỷ đơn hàng khi ở pending hoặc confirmed
 */
export const cancelOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('Yêu cầu đăng nhập tài khoản Sales.');
  }

  const id = Number(req.params.id);
  if (isNaN(id) || id <= 0) {
    throw new BadRequestError('Mã đơn hàng không hợp lệ.');
  }

  const result = await salesService.cancelOrderBySales(id, req.user, req.body?.reason);
  sendSuccessRes(res, result, result.message, 200);
});

/**
 * [FR7b - S04] POST /api/orders/:id/payments hoặc POST /api/sales/orders/:id/payments
 * Lập lịch các đợt thanh toán cho đơn hàng
 */
export const createPaymentSchedule = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('Yêu cầu đăng nhập tài khoản Sales.');
  }

  const id = Number(req.params.id);
  if (isNaN(id) || id <= 0) {
    throw new BadRequestError('Mã đơn hàng không hợp lệ.');
  }

  const result = await salesService.createPaymentSchedule(id, req.user, req.body);
  sendSuccessRes(res, result, 'Lập lịch thanh toán thành công.', 201);
});

/**
 * [FR12 - S05] GET /api/sales/inventory
 * Tra cứu tồn kho theo showroom/kho
 */
export const getInventory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const query = {
    locationId: req.query.locationId ? Number(req.query.locationId) : undefined,
    sku: typeof req.query.sku === 'string' ? req.query.sku : undefined,
    lowStock: req.query.lowStock !== undefined ? Number(req.query.lowStock) : undefined,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
  };

  const result = await salesService.getInventory(query);
  res.status(200).json({
    data: result.data,
    meta: result.meta,
  });
});

/**
 * [FR12 - S06] GET /api/sales/inventory/low-stock
 * Cảnh báo các biến thể sắp hết hàng
 */
export const getLowStock = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const threshold = req.query.threshold ? Number(req.query.threshold) : 5;
  const result = await salesService.getLowStock(threshold);
  sendSuccessRes(res, result.data, 'Lấy danh sách cảnh báo tồn kho thành công.', 200);
});

/**
 * [FR12 - S06] PATCH /api/sales/inventory/restock
 * Nhập thêm tồn kho (Optimistic concurrency control qua version)
 */
export const restock = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('Yêu cầu đăng nhập tài khoản Sales.');
  }

  const result = await salesService.restock(req.body);
  sendSuccessRes(res, result, 'Nhập hàng thành công.', 200);
});

/**
 * [FR13 - S07] GET /api/sales/receivables
 * Tra cứu danh sách công nợ và các khoản quá hạn
 */
export const getReceivables = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('Yêu cầu đăng nhập để xem công nợ.');
  }

  const query = {
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
    dueBefore: typeof req.query.dueBefore === 'string' ? req.query.dueBefore : undefined,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
  };

  const result = await salesService.getReceivables(req.user, query);
  res.status(200).json({
    data: result.data,
    meta: result.meta,
  });
});

/**
 * [FR13 - S07] POST /api/sales/receivables/mark-overdue
 * Đánh dấu các khoản pending quá hạn sang 'overdue'
 */
export const markOverdue = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('Yêu cầu đăng nhập tài khoản Sales.');
  }

  const result = await salesService.markOverdue(req.user, req.body);
  sendSuccessRes(res, result, result.message, 200);
});
