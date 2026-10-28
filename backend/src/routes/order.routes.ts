// ============================================================================
// File: backend/src/routes/order.routes.ts
// Vai trò: Tầng Route — Khai báo các endpoint đặt hàng & theo dõi đơn của Customer:
//   - POST /api/orders                  (FR5, FR6 - Đặt hàng thường & Limited Edition)
//   - GET  /api/orders                  (FR8 - Danh sách đơn hàng của tôi)
//   - GET  /api/orders/:id              (FR8 - Chi tiết đơn hàng)
//   - POST /api/orders/:id/cancel       (FR9 - Huỷ đơn hàng khi đang pending)
// Quy tắc: Chỉ khai báo endpoint và gắn middleware, không chứa logic nghiệp vụ.
// ============================================================================

import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import * as orderController from '../controllers/order.controller.js';

const orderRouter = Router();

// Yêu cầu token hợp lệ cho tất cả các endpoint của order
orderRouter.use(authenticate);

/**
 * [6] POST /api/orders
 * Tạo đơn hàng mới trong một Transaction ACID
 * Phân quyền: customer
 */
orderRouter.post(
  '/',
  authorize('customer'),
  validate(orderController.placeOrderSchema),
  orderController.createOrder,
);

/**
 * [7] GET /api/orders
 * Lấy danh sách đơn hàng của tôi
 */
orderRouter.get('/', orderController.getMyOrders);

/**
 * [8] GET /api/orders/:id
 * Chi tiết đơn hàng kèm dòng hàng và lịch thanh toán
 */
orderRouter.get('/:id', orderController.getOrderDetail);

/**
 * [9] POST /api/orders/:id/cancel
 * Hủy đơn hàng và giải phóng tồn kho
 */
orderRouter.post('/:id/cancel', orderController.cancelOrder);

export default orderRouter;
