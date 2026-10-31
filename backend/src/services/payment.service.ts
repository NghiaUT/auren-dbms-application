// ============================================================================
// File: backend/src/services/payment.service.ts
// Vai trò: Tầng Service — Xử lý nghiệp vụ thanh toán đơn hàng (FR7):
//   - Kiểm tra quyền sở hữu đơn hàng và trạng thái khoản thu (pending/overdue)
//   - Ghi nhận thanh toán (cọc, trả góp, tất toán), chống thanh toán trùng lặp
//   - Tự động cập nhật phương thức thanh toán và thời điểm hoàn tất
// Quy tắc: Chứa logic nghiệp vụ và quản lý transaction, không viết câu lệnh SQL.
// ============================================================================

import * as paymentRepo from '../repository/payment.repository.js';
import * as orderRepo from '../repository/order.repository.js';
import * as customerRepo from '../repository/customer.repository.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../utils/AppError.js';
import type { AuthUser } from '../types/index.js';

/**
 * [FR7] Xử lý thanh toán cho một khoản tiền đợt (deposit / final / installment)
 */
export async function processPayment(
  paymentId: number,
  user: AuthUser,
  method: string,
) {
  if (user.role !== 'customer') {
    throw new ForbiddenError('Chỉ Khách hàng mới được phép thanh toán khoản phải trả của mình.');
  }

  // 1. Kiểm tra sự tồn tại của khoản thanh toán
  const payment = await paymentRepo.findPaymentById(paymentId);
  if (!payment) {
    throw new NotFoundError('Khoản thanh toán không tồn tại trong lưu trữ.');
  }

  if (payment.status === 'paid') {
    throw new ConflictError('Khoản thanh toán này đã được hoàn tất trước đó.', 'ALREADY_PAID');
  }

  if (payment.status === 'refunded') {
    throw new ConflictError('Khoản thanh toán thuộc đơn hàng đã bị hủy.', 'INVALID_STATUS_TRANSITION');
  }

  // 2. Kiểm tra quyền sở hữu đơn hàng (R1)
  const orderHeader = await orderRepo.findOrderHeaderById(payment.orderId);
  if (!orderHeader) {
    throw new NotFoundError('Đơn hàng liên kết không tồn tại.');
  }

  if (orderHeader.status === 'cancelled') {
    throw new ConflictError('Đơn hàng đã bị hủy, không thể tiếp tục thanh toán.', 'INVALID_STATUS_TRANSITION');
  }

  if (user.role === 'customer') {
    const customerProfile = await customerRepo.findWithTierByUserId(user.id);
    if (!customerProfile || customerProfile.id !== orderHeader.customerId) {
      throw new NotFoundError('Khoản thanh toán không tồn tại trong lưu trữ.');
    }
  }

  // 3. Thực thi thanh toán nguyên tử (chống double-pay)
  const affectedRows = await paymentRepo.payPayment(paymentId, method);
  if (affectedRows === 0) {
    throw new ConflictError('Khoản thanh toán này đã được ghi nhận.', 'ALREADY_PAID');
  }

  // Lấy dữ liệu mới nhất sau khi thanh toán
  const updatedPayment = await paymentRepo.findPaymentById(paymentId);

  return {
    ...updatedPayment,
    amount: Number(updatedPayment?.amount),
  };
}
