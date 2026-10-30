// ============================================================================
// File: backend/src/routes/sales.routes.ts
// Vai trò: Tầng Route — Khai báo các endpoint nghiệp vụ dành cho vai trò Sales:
//   - GET   /api/sales/summary                  (FR11-13 - Tổng quan công việc Sales S01)
//   - GET   /api/sales/orders                   (FR11 - Hàng đợi đơn hàng S02)
//   - GET   /api/sales/orders/:id               (FR11 - Chi tiết đơn hàng để xử lý S03)
//   - PATCH /api/sales/orders/:id/claim         (FR11 - Nhận phụ trách đơn hàng S02)
//   - PATCH /api/sales/orders/:id/status        (FR11 - Chuyển trạng thái đơn hợp lệ kế tiếp S03)
//   - POST  /api/sales/orders/:id/cancel        (FR9  - Sales huỷ đơn hàng S03)
//   - POST  /api/sales/orders/:id/payments      (FR7b - Lập lịch thanh toán cọc/trả góp S04)
//   - GET   /api/sales/inventory                (FR12 - Tra cứu tồn kho theo biến thể & kho S05)
//   - GET   /api/sales/inventory/low-stock      (FR12 - Cảnh báo biến thể sắp hết hàng S06)
//   - PATCH /api/sales/inventory/restock        (FR12 - Nhập thêm tồn kho S06)
//   - GET   /api/sales/receivables              (FR13 - Danh sách công nợ và khoản quá hạn S07)
//   - POST  /api/sales/receivables/mark-overdue (FR13 - Đánh dấu các khoản quá hạn S07)
// Quy tắc: Chỉ khai báo endpoint và gắn middleware, không chứa logic nghiệp vụ.
// ============================================================================

import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import * as salesController from '../controllers/sales.controller.js';

const salesRouter = Router();

// Yêu cầu token hợp lệ cho tất cả endpoint trong nhánh /api/sales
salesRouter.use(authenticate);

/**
 * [S01] GET /api/sales/summary
 * KPI tổng quan: đơn chờ nhận, đơn đang xử lý, biến thể sắp hết, tổng nợ quá hạn
 */
salesRouter.get(
  '/summary',
  authorize('sales', 'admin'),
  salesController.getSummary,
);

/**
 * [S02] GET /api/sales/orders
 * Hàng đợi đơn hàng (tab=unassigned hoặc tab=my_orders)
 */
salesRouter.get(
  '/orders',
  authorize('sales', 'admin'),
  salesController.getOrderQueue,
);

/**
 * [S03] GET /api/sales/orders/:id
 * Chi tiết đơn hàng để nhân viên xử lý
 */
salesRouter.get(
  '/orders/:id',
  authorize('sales', 'admin'),
  salesController.getOrderDetail,
);

/**
 * [FR11 - S02] PATCH /api/sales/orders/:id/claim
 * Tiếp nhận đơn hàng chưa có người phụ trách
 */
salesRouter.patch(
  '/orders/:id/claim',
  authorize('sales'),
  salesController.claimOrder,
);

/**
 * [FR11 - S03] PATCH /api/sales/orders/:id/status
 * Cập nhật trạng thái đơn hàng (in_production, shipped, delivered)
 */
salesRouter.patch(
  '/orders/:id/status',
  authorize('sales'),
  validate(salesController.updateOrderStatusSchema),
  salesController.updateStatus,
);

/**
 * [FR9 - S03] POST /api/sales/orders/:id/cancel
 * Sales huỷ đơn hàng khi ở pending hoặc confirmed
 */
salesRouter.post(
  '/orders/:id/cancel',
  authorize('sales'),
  validate(salesController.cancelOrderSchema),
  salesController.cancelOrder,
);

/**
 * [FR7b - S04] POST /api/sales/orders/:id/payments
 * Lập lịch các đợt thanh toán (cọc, trả góp, tất toán)
 */
salesRouter.post(
  '/orders/:id/payments',
  authorize('sales'),
  validate(salesController.createPaymentScheduleSchema),
  salesController.createPaymentSchedule,
);

/**
 * [FR12 - S05] GET /api/sales/inventory
 * Tra cứu tồn kho theo showroom/kho
 */
salesRouter.get(
  '/inventory',
  authorize('sales', 'admin'),
  salesController.getInventory,
);

/**
 * [FR12 - S06] GET /api/sales/inventory/low-stock
 * Cảnh báo các biến thể sắp hết hàng
 */
salesRouter.get(
  '/inventory/low-stock',
  authorize('sales', 'admin'),
  salesController.getLowStock,
);

/**
 * [FR12 - S06] PATCH /api/sales/inventory/restock
 * Nhập thêm tồn kho (Optimistic locking qua version)
 */
salesRouter.patch(
  '/inventory/restock',
  authorize('sales'),
  validate(salesController.restockSchema),
  salesController.restock,
);

/**
 * [FR13 - S07] GET /api/sales/receivables
 * Danh sách công nợ & các khoản quá hạn
 */
salesRouter.get(
  '/receivables',
  authorize('sales', 'admin'),
  salesController.getReceivables,
);

/**
 * [FR13 - S07] POST /api/sales/receivables/mark-overdue
 * Đánh dấu nợ quá hạn
 */
salesRouter.post(
  '/receivables/mark-overdue',
  authorize('sales'),
  validate(salesController.markOverdueSchema),
  salesController.markOverdue,
);

export default salesRouter;
