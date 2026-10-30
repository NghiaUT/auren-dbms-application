// ============================================================================
// File: backend/src/services/sales.service.ts
// Vai trò: Tầng Service — Xử lý nghiệp vụ dành cho nhân viên kinh doanh (Sales):
//   - FR11: Nhận đơn hàng chưa có người phụ trách (claim) và chuyển trạng thái
//           đơn theo đúng quy trình nghiệp vụ (khi delivered: trừ tồn, sold serial, cộng total_spent).
//   - FR7b: Lập lịch thanh toán (cọc, trả góp, tất toán) cho đơn hàng.
//   - FR12: Tra cứu tồn kho, lọc các biến thể dưới ngưỡng cảnh báo và nhập kho
//           có kiểm soát xung đột version (Optimistic locking).
//   - FR13: Theo dõi công nợ phải thu và đánh dấu các khoản quá hạn (overdue).
// Quy tắc: Chứa logic nghiệp vụ và quản lý transaction, không viết câu lệnh SQL.
// ============================================================================

import { withTransaction } from '../config/db.js';
import * as salesRepo from '../repository/sales.repository.js';
import * as orderRepo from '../repository/order.repository.js';
import * as inventoryRepo from '../repository/inventory.repository.js';
import * as editionRepo from '../repository/edition.repository.js';
import * as paymentRepo from '../repository/payment.repository.js';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/AppError.js';
import { getVietnamDateString } from '../utils/dateUtils.js';
import type { AuthUser, OrderStatus } from '../types/index.js';

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
  deliveryDate?: string | null;
}

export interface PaymentScheduleItem {
  type: 'deposit' | 'installment' | 'final';
  amount: number;
  dueDate: string;
}

export interface CreatePaymentSchedulePayload {
  payments: PaymentScheduleItem[];
}

export interface RestockPayload {
  variantId: number;
  locationId: number;
  quantity: number;
  version: number;
}

/**
 * [S01] Lấy các chỉ số KPI tổng hợp cho Bảng điều khiển Sales
 */
export async function getDashboardSummary(user: AuthUser) {
  return await salesRepo.getSalesDashboardSummary(user.id);
}

/**
 * [S02] Tra cứu danh sách đơn hàng trong Hàng đợi Sales (Unassigned hoặc My Orders)
 */
export async function getOrderQueue(
  user: AuthUser,
  tab: 'unassigned' | 'my_orders',
  query: {
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
  } = {},
) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));

  const { rows, total } = await salesRepo.findSalesOrderQueue(user.id, tab, {
    status: query.status,
    page,
    limit,
    search: query.search,
  });

  const totalPages = Math.ceil(total / limit);

  return {
    data: rows.map((r) => ({
      id: r.id,
      orderDate: r.orderDate,
      status: r.status,
      total: Number(r.total),
      itemCount: Number(r.itemCount),
      customerName: r.customerName,
      customerEmail: r.customerEmail,
      customerPhone: r.customerPhone,
      salesUserId: r.salesUserId,
    })),
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

/**
 * [FR11 - S02] Tiếp nhận đơn hàng nguyên tử (Claim Order)
 * Chống Race Condition: Hai Sales cùng nhận 1 đơn cùng lúc, chỉ 1 người thành công.
 */
export async function claimOrder(orderId: number, user: AuthUser) {
  const affectedRows = await salesRepo.claimOrderAtomic(orderId, user.id);

  if (affectedRows === 0) {
    // Kiểm tra xem đơn hàng có tồn tại không hay đã có người khác nhận
    const order = await orderRepo.findOrderHeaderById(orderId);
    if (!order) {
      throw new NotFoundError('Đơn hàng không tồn tại trong hệ thống.');
    }
    throw new ConflictError(
      'Đơn hàng đã có nhân viên Sales khác tiếp nhận hoặc không còn ở trạng thái chờ duyệt (pending).',
      'ALREADY_CLAIMED',
    );
  }

  return {
    id: orderId,
    status: 'confirmed',
    salesUserId: user.id,
    message: 'Tiếp nhận đơn hàng thành công.',
  };
}

/**
 * [FR11 - S03] Cập nhật tiến độ trạng thái đơn hàng theo đúng State Machine
 * - R7: Chỉ thao tác đơn hàng do chính mình phụ trách (sales_user_id = user.id)
 * - confirmed -> in_production (bắt buộc có deliveryDate)
 * - in_production -> shipped
 * - shipped -> delivered (Transaction ACID: trừ tồn kho thật, mark serial sold, cộng total_spent)
 */
export async function updateOrderStatus(
  orderId: number,
  user: AuthUser,
  payload: UpdateOrderStatusPayload,
) {
  const order = await orderRepo.findOrderHeaderById(orderId);
  if (!order) {
    throw new NotFoundError('Đơn hàng không tồn tại trong hệ thống.');
  }

  // R7: Kiểm tra quyền phụ trách đơn hàng
  if (order.salesUserId !== user.id) {
    throw new NotFoundError('Đơn hàng không tồn tại hoặc bạn không được phân công phụ trách đơn hàng này.');
  }

  const currentStatus = order.status;
  const targetStatus = payload.status;

  // Kiểm tra chuyển đổi trạng thái hợp lệ theo ROLE_MATRIX §5
  if (currentStatus === 'confirmed' && targetStatus === 'in_production') {
    if (!payload.deliveryDate) {
      throw new BadRequestError('Vui lòng nhập ngày giao hàng dự kiến khi chuyển sang giai đoạn chế tác.', 'VALIDATION_ERROR');
    }
  } else if (currentStatus === 'in_production' && targetStatus === 'shipped') {
    // Hợp lệ
  } else if (currentStatus === 'shipped' && targetStatus === 'delivered') {
    // Hợp lệ, xử lý Transaction phía dưới
  } else {
    throw new ConflictError(
      `Không thể chuyển đổi trạng thái từ "${currentStatus}" sang "${targetStatus}".`,
      'INVALID_STATUS_TRANSITION',
    );
  }

  // Trường hợp chuyển sang 'delivered': Chạy Transaction ACID gom 4 bước
  if (targetStatus === 'delivered') {
    return await withTransaction(async (conn) => {
      // 1. Cập nhật trạng thái đơn
      await salesRepo.updateOrderStatusWithDeliveryDate(orderId, user.id, 'delivered', null, conn);

      // 2. Trừ tồn kho vật lý (qty_on_hand) và giải phóng số lượng giữ (qty_reserved)
      await salesRepo.deductPhysicalStockOnDelivered(orderId, conn);

      // 3. Đánh dấu các bản Limited Edition sang trạng thái 'sold'
      await salesRepo.markEditionUnitsSold(orderId, conn);

      // 4. Cộng dồn doanh số tích luỹ cho khách hàng
      await salesRepo.incrementCustomerTotalSpent(order.customerId, Number(order.total), conn);

      return {
        id: orderId,
        status: 'delivered',
        deliveryDate: order.deliveryDate,
        message: 'Bàn giao đơn hàng White-Glove thành công.',
      };
    });
  }

  // Các bước chuyển thông thường (confirmed -> in_production, in_production -> shipped)
  await salesRepo.updateOrderStatusWithDeliveryDate(
    orderId,
    user.id,
    targetStatus,
    payload.deliveryDate,
  );

  return {
    id: orderId,
    status: targetStatus,
    deliveryDate: payload.deliveryDate ?? order.deliveryDate,
    message: `Đã chuyển trạng thái đơn hàng sang ${targetStatus}.`,
  };
}

/**
 * [FR9 - S03] Sales huỷ đơn hàng khi ở trạng thái 'pending' hoặc 'confirmed' (R8)
 * Thực thi trong Transaction ACID hoàn trả tồn kho và số serial.
 */
export async function cancelOrderBySales(
  orderId: number,
  user: AuthUser,
  reason?: string,
) {
  const order = await orderRepo.findOrderHeaderById(orderId);
  if (!order) {
    throw new NotFoundError('Đơn hàng không tồn tại trong hệ thống.');
  }

  // R7/R8: Kiểm tra phụ trách và trạng thái
  if (order.salesUserId && order.salesUserId !== user.id) {
    throw new NotFoundError('Đơn hàng không tồn tại hoặc bạn không được phân công phụ trách đơn hàng này.');
  }

  if (order.status !== 'pending' && order.status !== 'confirmed') {
    throw new ConflictError(
      'Chỉ có thể huỷ đơn hàng khi đang ở trạng thái chờ duyệt (pending) hoặc đã xác nhận (confirmed).',
      'INVALID_STATUS_TRANSITION',
    );
  }

  return await withTransaction(async (conn) => {
    // 1. Hoàn trả tồn kho đã giữ
    const items = await orderRepo.findOrderItemsByOrderId(orderId, conn);
    for (const item of items) {
      await inventoryRepo.releaseStock(item.variantId, item.locationId, item.quantity, conn);
    }

    // 2. Trả các bản Limited Edition về 'available'
    await editionRepo.releaseUnitsByOrderId(orderId, conn);

    // 3. Huỷ bỏ các khoản thanh toán chờ thu
    await paymentRepo.cancelPendingPaymentsByOrderId(orderId, conn);

    // 4. Đổi trạng thái đơn sang 'cancelled'
    await orderRepo.updateOrderStatus(orderId, 'cancelled', conn);

    return {
      id: orderId,
      status: 'cancelled',
      reason: reason || null,
      message: 'Huỷ đơn hàng và hoàn trả tồn kho thành công.',
    };
  });
}

/**
 * [FR7b - S04] Lập lịch thanh toán cho đơn hàng
 * R7: Đơn do Sales phụ trách, không ở trạng thái cancelled.
 * Ràng buộc: amount > 0, tổng các khoản chưa refunded (cũ + mới) <= order.total, tối đa 1 khoản final.
 */
export async function createPaymentSchedule(
  orderId: number,
  user: AuthUser,
  payload: CreatePaymentSchedulePayload,
) {
  const order = await orderRepo.findOrderHeaderById(orderId);
  if (!order) {
    throw new NotFoundError('Đơn hàng không tồn tại trong hệ thống.');
  }

  if (order.salesUserId !== user.id) {
    throw new NotFoundError('Đơn hàng không tồn tại hoặc bạn không được phân công phụ trách đơn hàng này.');
  }

  if (order.status === 'cancelled') {
    throw new ConflictError('Đơn hàng đã bị huỷ, không thể lập lịch thanh toán.', 'INVALID_STATUS_TRANSITION');
  }

  if (!payload.payments || payload.payments.length === 0) {
    throw new BadRequestError('Danh sách khoản thanh toán không được rỗng.', 'VALIDATION_ERROR');
  }

  // Lấy các khoản thanh toán hiện tại của đơn
  const existingPayments = await paymentRepo.findPaymentsByOrderId(orderId);
  const activeExistingPayments = existingPayments.filter((p) => p.status !== 'refunded');

  // Kiểm tra ngày thanh toán và tính tổng (theo ngày Việt Nam)
  const todayStr = getVietnamDateString();
  let newFinalCount = 0;
  let newAmountSum = 0;

  for (const p of payload.payments) {
    if (p.amount <= 0) {
      throw new BadRequestError('Số tiền mỗi đợt thanh toán phải lớn hơn 0.', 'VALIDATION_ERROR');
    }
    if (p.dueDate && p.dueDate < todayStr) {
      throw new BadRequestError(`Hạn thanh toán ${p.dueDate} không thể ở quá khứ.`, 'VALIDATION_ERROR');
    }
    if (p.type === 'final') {
      newFinalCount++;
    }
    newAmountSum += p.amount;
  }

  // Ràng buộc: Tối đa 1 khoản final
  const existingFinalCount = activeExistingPayments.filter((p) => p.type === 'final').length;
  if (existingFinalCount + newFinalCount > 1) {
    throw new BadRequestError('Đơn hàng chỉ được phép có tối đa một đợt thanh toán quyết toán (final).', 'VALIDATION_ERROR');
  }

  // Ràng buộc: Tổng các khoản thanh toán không vượt quá order.total
  const existingAmountSum = activeExistingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const grandTotal = existingAmountSum + newAmountSum;

  if (grandTotal > Number(order.total)) {
    throw new BadRequestError(
      `Tổng các đợt thanh toán (${grandTotal.toLocaleString('vi-VN')} đ) vượt quá tổng giá trị đơn hàng (${Number(order.total).toLocaleString('vi-VN')} đ).`,
      'VALIDATION_ERROR',
    );
  }

  // Thêm các khoản thanh toán mới
  for (const p of payload.payments) {
    await paymentRepo.createPayment({
      orderId,
      type: p.type,
      amount: p.amount,
      dueDate: p.dueDate,
      status: 'pending',
    });
  }

  // Trả về toàn bộ lịch thanh toán sau khi cập nhật
  const allPayments = await paymentRepo.findPaymentsByOrderId(orderId);
  return allPayments.map((p) => ({
    id: p.id,
    orderId: p.orderId,
    type: p.type,
    amount: Number(p.amount),
    dueDate: p.dueDate,
    paidAt: p.paidAt,
    method: p.method,
    status: p.status,
  }));
}

/**
 * [FR12 - S05] Tra cứu tồn kho theo showroom/kho
 */
export async function getInventory(query: {
  locationId?: number;
  sku?: string;
  lowStock?: number;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));

  const { rows, total } = await inventoryRepo.findInventoryList({
    locationId: query.locationId ? Number(query.locationId) : undefined,
    sku: query.sku,
    lowStock: query.lowStock !== undefined ? Number(query.lowStock) : undefined,
    page,
    limit,
  });

  const totalPages = Math.ceil(total / limit);

  return {
    data: rows.map((r) => ({
      variantId: r.variantId,
      sku: r.sku,
      productName: r.productName,
      locationId: r.locationId,
      locationName: r.locationName,
      qtyOnHand: Number(r.qtyOnHand),
      qtyReserved: Number(r.qtyReserved),
      available: Number(r.available),
      version: Number(r.version),
      totalAvailable: Number(r.totalAvailable),
    })),
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

/**
 * [FR12 - S06] Cảnh báo các biến thể sắp hết hàng (tổng khả dụng < threshold)
 */
export async function getLowStock(threshold: number = 5) {
  const { rows, total } = await inventoryRepo.findInventoryList({
    lowStock: threshold,
    page: 1,
    limit: 100,
  });

  return {
    data: rows.map((r) => ({
      variantId: r.variantId,
      sku: r.sku,
      productName: r.productName,
      locationId: r.locationId,
      locationName: r.locationName,
      qtyOnHand: Number(r.qtyOnHand),
      qtyReserved: Number(r.qtyReserved),
      available: Number(r.available),
      version: Number(r.version),
      totalAvailable: Number(r.totalAvailable),
    })),
    total,
  };
}

/**
 * [FR12 - S06] Nhập thêm tồn kho có kiểm soát phiên bản (Optimistic Locking)
 */
export async function restock(payload: RestockPayload) {
  if (payload.quantity <= 0) {
    throw new BadRequestError('Số lượng nhập kho phải lớn hơn 0.', 'VALIDATION_ERROR');
  }

  const affectedRows = await inventoryRepo.restockWithOptimisticLock(
    payload.variantId,
    payload.locationId,
    payload.quantity,
    payload.version,
  );

  if (affectedRows === 0) {
    throw new ConflictError(
      'Dữ liệu tồn kho của biến thể này đã bị thay đổi bởi giao dịch khác. Vui lòng tải lại trang và thử lại.',
      'VERSION_CONFLICT',
    );
  }

  const updated = await inventoryRepo.findInventoryDetail(payload.variantId, payload.locationId);
  return {
    ...updated,
    qtyOnHand: Number(updated?.qtyOnHand),
    qtyReserved: Number(updated?.qtyReserved),
    available: Number(updated?.available),
    version: Number(updated?.version),
    totalAvailable: Number(updated?.totalAvailable),
    message: 'Nhập kho thành công.',
  };
}

/**
 * [FR13 - S07] Tra cứu danh sách công nợ & các khoản quá hạn
 * R9: Sales chỉ xem công nợ các đơn mình phụ trách. Admin xem tất cả.
 */
export async function getReceivables(
  user: AuthUser,
  query: {
    status?: string;
    dueBefore?: string;
    page?: number;
    limit?: number;
  } = {},
) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));

  const salesUserId = user.role === 'admin' ? undefined : user.id;

  const { rows, total, totalOutstanding } = await paymentRepo.findReceivables(salesUserId, {
    status: query.status,
    dueBefore: query.dueBefore,
    page,
    limit,
  });

  const totalPages = Math.ceil(total / limit);

  return {
    data: rows.map((r) => ({
      id: r.id,
      orderId: r.orderId,
      type: r.type,
      amount: Number(r.amount),
      dueDate: r.dueDate,
      paidAt: r.paidAt,
      method: r.method,
      status: r.status,
      orderStatus: r.orderStatus,
      customer: {
        id: r.customerId,
        fullName: r.customerFullName,
        phone: r.customerPhone,
      },
      daysOverdue: Number(r.daysOverdue),
    })),
    meta: {
      page,
      limit,
      total,
      totalPages,
      totalOutstanding,
    },
  };
}

/**
 * [FR13 - S07] Đánh dấu các khoản pending có due_date < CURDATE() sang 'overdue'
 * R9: Chỉ tác động lên đơn do chính Sales phụ trách.
 */
export async function markOverdue(
  user: AuthUser,
  payload: { paymentIds?: number[] } = {},
) {
  const result = await paymentRepo.markOverduePayments(user.id, payload.paymentIds);
  return {
    updated: result.updated,
    paymentIds: result.paymentIds,
    message: `Đã cập nhật ${result.updated} khoản thanh toán sang trạng thái quá hạn.`,
  };
}
