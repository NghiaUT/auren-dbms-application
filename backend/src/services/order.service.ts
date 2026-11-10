// ============================================================================
// File: backend/src/services/order.service.ts
// Vai trò: Tầng Service — Xử lý nghiệp vụ đặt hàng và vòng đời đơn của Customer:
//   - FR5: Đặt hàng thường trong một Transaction (lấy giá từ DB, giữ tồn kho
//          bằng Optimistic Locking qua version, tính chiết khấu theo hạng thành viên,
//          tạo đơn và các dòng hàng).
//   - FR6: Đặt mua bản Limited Edition trong Transaction với Pessimistic Locking
//          (SELECT ... FOR UPDATE) để cấp phát số serial duy nhất.
//   - FR8: Xem lịch sử và chi tiết đơn hàng (kiểm tra quyền sở hữu row-level).
//   - FR9: Huỷ đơn hàng khi đang ở trạng thái hợp lệ và hoàn trả tồn kho / serial.
// Quy tắc: Mở và commit/rollback transaction qua withTransaction, không viết SQL.
// ============================================================================

import { withTransaction } from '../config/db.js';
import * as orderRepo from '../repository/order.repository.js';
import * as variantRepo from '../repository/variant.repository.js';
import * as inventoryRepo from '../repository/inventory.repository.js';
import * as editionRepo from '../repository/edition.repository.js';
import * as paymentRepo from '../repository/payment.repository.js';
import * as customerRepo from '../repository/customer.repository.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../utils/AppError.js';
import { getVietnamDateString, getVietnamFutureDateString } from '../utils/dateUtils.js';
import type { AuthUser } from '../types/index.js';

export interface PlaceOrderItemPayload {
  variantId: number;
  locationId: number;
  quantity: number;
  customization?: Record<string, any>;
}

export interface PlaceOrderPayload {
  shippingAddress: string;
  deliveryDate?: string | null;
  items: PlaceOrderItemPayload[];
}

/**
 * [FR5, FR6] Đặt hàng (Thường và Limited Edition) thực thi trong một Transaction ACID
 */
export async function placeOrder(user: AuthUser, payload: PlaceOrderPayload) {
  if (user.role !== 'customer') {
    throw new ForbiddenError('Chức năng mua sắm và đặt hàng chỉ dành cho Khách hàng.');
  }

  if (!payload.items || payload.items.length === 0) {
    throw new BadRequestError('Đơn hàng phải có ít nhất một tác phẩm.');
  }

  // 1. Lấy thông tin hồ sơ khách hàng và hạng thành viên
  const customerProfile = await customerRepo.findWithTierByUserId(user.id);
  if (!customerProfile) {
    throw new ForbiddenError('Tài khoản chưa có hồ sơ khách hàng để thực hiện giao dịch.');
  }

  // 2. Chạy toàn bộ luồng trong 1 Transaction ACID
  return withTransaction(async (conn) => {
    // Sắp xếp các item theo variantId tăng dần để triệt tiêu nguy cơ Deadlock khi khóa
    const sortedItems = [...payload.items].sort((a, b) => a.variantId - b.variantId);

    // Lấy thông tin chi tiết toàn bộ biến thể từ CSDL (chống gian lận giá R14)
    const variantIds = sortedItems.map((i) => i.variantId);
    const variants = await variantRepo.findActiveByIds(variantIds, conn);
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    for (const item of sortedItems) {
      const v = variantMap.get(item.variantId);
      if (!v) {
        throw new NotFoundError(`Biến thể mã #${item.variantId} không tồn tại hoặc đã ngừng sản xuất.`);
      }
      if (item.quantity <= 0) {
        throw new BadRequestError('Số lượng sản phẩm phải lớn hơn 0.');
      }
      if (Boolean(v.isLimited) && item.quantity > 1) {
        throw new BadRequestError(`Tác phẩm giới hạn ${v.productName} chỉ được đặt 1 chiếc mỗi dòng hàng.`);
      }
    }

    // 3. Tính toán giá tiền phía máy chủ
    let subtotal = 0;
    for (const item of sortedItems) {
      const v = variantMap.get(item.variantId)!;
      subtotal += Number(v.price) * item.quantity;
    }

    // Áp dụng chiết khấu hạng thành viên (membership tier)
    const discountPct = Number(customerProfile.tier.discountPct) || 0;
    const discountAmount = Math.round(subtotal * (discountPct / 100));
    const total = Math.max(0, subtotal - discountAmount);

    // 4. Giữ tồn kho & cấp phát số serial Limited
    const lockedUnits: Array<{ itemIndex: number; unitId: number; serialNo: string }> = [];

    for (let idx = 0; idx < sortedItems.length; idx++) {
      const item = sortedItems[idx];
      const v = variantMap.get(item.variantId)!;

      // Nếu là sản phẩm Limited Edition, khóa lấy 1 bản có status 'available' (FR6)
      if (Boolean(v.isLimited)) {
        const unit = await editionRepo.lockAvailableUnit(v.id, conn);
        if (!unit) {
          throw new ConflictError(
            `Tác phẩm giới hạn ${v.productName} (${v.finish}) đã hết số bản đánh số khả dụng.`,
            'EDITION_SOLD_OUT',
          );
        }
        lockedUnits.push({ itemIndex: idx, unitId: unit.id, serialNo: unit.serialNo });
      }

      // Giữ hàng tồn kho thông qua Optimistic Locking (FR5)
      const inv = await inventoryRepo.findInventoryByVariantAndLocation(v.id, item.locationId, conn);
      if (!inv || (inv.qtyOnHand - inv.qtyReserved) < item.quantity) {
        throw new ConflictError(
          `Sản phẩm ${v.productName} (${v.finish}) không đủ tồn kho khả dụng tại chi nhánh đã chọn.`,
          'OUT_OF_STOCK',
        );
      }

      const reservedRows = await inventoryRepo.checkAndReserveStock(
        v.id,
        item.locationId,
        item.quantity,
        inv.version,
        conn,
      );

      if (reservedRows === 0) {
        throw new ConflictError(
          `Xung đột trạng thái tồn kho cho tác phẩm ${v.productName}. Vui lòng thử lại.`,
          'VERSION_CONFLICT',
        );
      }
    }

    // 5. Ghi nhận Header đơn hàng
    const orderId = await orderRepo.createOrder(
      {
        customerId: customerProfile.id,
        subtotal,
        discount: discountAmount,
        total,
        shippingAddress: payload.shippingAddress,
        deliveryDate: payload.deliveryDate ?? null,
      },
      conn,
    );

    // 6. Ghi nhận từng dòng hàng và liên kết bản Limited nếu có
    const createdItems: any[] = [];
    for (let idx = 0; idx < sortedItems.length; idx++) {
      const item = sortedItems[idx];
      const v = variantMap.get(item.variantId)!;

      const orderItemId = await orderRepo.createOrderItem(
        {
          orderId,
          variantId: v.id,
          locationId: item.locationId,
          quantity: item.quantity,
          unitPrice: Number(v.price),
          customization: item.customization ?? null,
        },
        conn,
      );

      // Nếu là bản Limited, liên kết order_item_id vào bản ghi edition_units
      const matchedUnit = lockedUnits.find((u) => u.itemIndex === idx);
      if (matchedUnit) {
        await editionRepo.assignUnitToOrderItem(matchedUnit.unitId, orderItemId, conn);
      }

      createdItems.push({
        id: orderItemId,
        variantId: v.id,
        productName: v.productName,
        sku: v.sku,
        finish: v.finish,
        size: v.size,
        quantity: item.quantity,
        unitPrice: Number(v.price),
        customization: item.customization ?? null,
        serialNo: matchedUnit?.serialNo ?? null,
      });
    }

    // 7. Sinh lịch thanh toán tự động (Mặc định: Đợt 1 Đặt cọc 50%, Đợt 2 Thanh toán 50%)
    const depositAmount = Math.round(total * 0.5);
    const finalAmount = total - depositAmount;

    // Khoản 1: Đặt cọc (Deposit) - hạn trả ngay hôm nay (theo ngày giờ Việt Nam)
    const depositId = await paymentRepo.createPayment(
      {
        orderId,
        type: 'deposit',
        amount: depositAmount,
        dueDate: getVietnamDateString(),
        status: 'pending',
      },
      conn,
    );

    // Khoản 2: Quyết toán (Final) - hạn trả sau 30 ngày hoặc theo ngày giao
    const thirtyDaysLater = getVietnamFutureDateString(30);
    const finalId = await paymentRepo.createPayment(
      {
        orderId,
        type: 'final',
        amount: finalAmount,
        dueDate: payload.deliveryDate ? String(payload.deliveryDate).split('T')[0] : thirtyDaysLater,
        status: 'pending',
      },
      conn,
    );

    return {
      id: orderId,
      customerId: customerProfile.id,
      orderDate: new Date().toISOString(),
      status: 'pending',
      subtotal,
      discount: discountAmount,
      total,
      shippingAddress: payload.shippingAddress,
      deliveryDate: payload.deliveryDate ?? null,
      items: createdItems,
      payments: [
        { id: depositId, type: 'deposit', amount: depositAmount, status: 'pending' },
        { id: finalId, type: 'final', amount: finalAmount, status: 'pending' },
      ],
    };
  });
}

/**
 * [FR8] Lấy danh sách đơn hàng của khách hàng đang đăng nhập
 */
export async function getMyOrders(
  user: AuthUser,
  query: { status?: string; page?: number; limit?: number },
) {
  if (user.role !== 'customer') {
    throw new ForbiddenError('Chức năng xem lịch sử mua sắm cá nhân chỉ dành cho Khách hàng.');
  }

  const customerProfile = await customerRepo.findWithTierByUserId(user.id);
  if (!customerProfile) {
    throw new ForbiddenError('Tài khoản chưa có hồ sơ khách hàng.');
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));

  const total = await orderRepo.countOrdersByCustomerId(customerProfile.id, query.status);
  const rows = await orderRepo.findOrdersByCustomerId(customerProfile.id, {
    status: query.status,
    page,
    limit,
  });

  const orders = rows.map((r) => ({
    id: r.id,
    orderDate: r.orderDate,
    status: r.status,
    subtotal: Number(r.subtotal),
    discount: Number(r.discount),
    total: Number(r.total),
    shippingAddress: r.shippingAddress,
    deliveryDate: r.deliveryDate,
    itemCount: Number(r.itemCount) || 0,
    paidAmount: Number(r.paidAmount) || 0,
  }));

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    data: orders,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

/**
 * [FR8] Lấy chi tiết đơn hàng (Header, Dòng hàng, Bản Limited, Lịch thanh toán)
 */
export async function getOrderDetail(orderId: number, user: AuthUser) {
  const header = await orderRepo.findOrderHeaderById(orderId);
  if (!header) {
    throw new NotFoundError('Đơn hàng không tồn tại trong lưu trữ.');
  }

  // Thực thi phân quyền row-level (R1): Khách chỉ được xem đơn của mình
  if (user.role === 'customer') {
    const customerProfile = await customerRepo.findWithTierByUserId(user.id);
    if (!customerProfile || customerProfile.id !== header.customerId) {
      throw new NotFoundError('Đơn hàng không tồn tại trong lưu trữ.');
    }
  } else if (user.role === 'sales' && header.salesUserId !== null && header.salesUserId !== user.id) {
    throw new NotFoundError('Đơn hàng không tồn tại trong lưu trữ.');
  }

  const [items, payments] = await Promise.all([
    orderRepo.findOrderItemsByOrderId(orderId),
    paymentRepo.findPaymentsByOrderId(orderId),
  ]);

  return {
    ...header,
    subtotal: Number(header.subtotal),
    discount: Number(header.discount),
    total: Number(header.total),
    items: items.map((i) => ({
      id: i.id,
      variantId: i.variantId,
      productName: i.productName,
      sku: i.sku,
      finish: i.finish,
      size: i.size,
      locationId: i.locationId,
      locationName: i.locationName,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
      customization: typeof i.customization === 'string' ? JSON.parse(i.customization) : i.customization,
      serialNo: i.serialNo,
    })),
    payments: payments.map((p) => ({
      id: p.id,
      type: p.type,
      amount: Number(p.amount),
      dueDate: p.dueDate,
      paidAt: p.paidAt,
      method: p.method,
      status: p.status,
    })),
  };
}

/**
 * [FR9] Huỷ đơn hàng khi đang ở trạng thái 'pending' và hoàn trả tồn kho / serial
 */
export async function cancelOrder(orderId: number, user: AuthUser) {
  const header = await orderRepo.findOrderHeaderById(orderId);
  if (!header) {
    throw new NotFoundError('Đơn hàng không tồn tại trong lưu trữ.');
  }

  // Kiểm tra quyền sở hữu và vai trò hợp lệ (chỉ customer sở hữu đơn hoặc sales vận hành)
  if (user.role === 'customer') {
    const customerProfile = await customerRepo.findWithTierByUserId(user.id);
    if (!customerProfile || customerProfile.id !== header.customerId) {
      throw new NotFoundError('Đơn hàng không tồn tại trong lưu trữ.');
    }
  } else if (user.role !== 'sales') {
    throw new ForbiddenError('Tài khoản của bạn không có quyền huỷ đơn hàng.');
  }

  if (header.status !== 'pending') {
    throw new ConflictError(
      'Chỉ có thể huỷ đơn hàng khi đang ở trạng thái chờ duyệt (pending).',
      'INVALID_STATUS_TRANSITION',
    );
  }

  return withTransaction(async (conn) => {
    if (!(await orderRepo.updateOrderStatus(orderId, 'cancelled', 'pending', conn))) {
      throw new ConflictError('Trạng thái đơn hàng đã thay đổi.', 'INVALID_STATUS_TRANSITION');
    }
    // 1. Lấy danh sách dòng hàng để hoàn trả tồn kho
    const items = await orderRepo.findOrderItemsByOrderId(orderId, conn);

    for (const item of items) {
      await inventoryRepo.releaseStock(item.variantId, item.locationId, item.quantity, conn);
    }

    // 2. Giải phóng các bản đánh số Limited Edition nếu có
    await editionRepo.releaseUnitsByOrderId(orderId, conn);

    // 3. Huỷ bỏ các khoản thanh toán chờ thu
    await paymentRepo.cancelPendingPaymentsByOrderId(orderId, conn);

    return {
      id: orderId,
      status: 'cancelled',
      message: 'Huỷ đơn hàng và hoàn trả tồn kho thành công.',
    };
  });
}
