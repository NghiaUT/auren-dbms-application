// ============================================================================
// File: backend/src/services/review.service.ts
// Vai trò: Tầng Service — Xử lý nghiệp vụ đánh giá sản phẩm (FR10):
//   - Kiểm tra điều kiện khách hàng sở hữu dòng đơn hàng và đơn đã giao (delivered)
//   - Tạo đánh giá mới (1 đánh giá / dòng đơn hàng)
//   - Xoá đánh giá (chủ sở hữu hoặc Admin được phép xoá)
//   - Lấy thông tin đánh giá theo dòng đơn hàng
// ============================================================================

import * as reviewRepo from '../repository/review.repository.js';
import * as customerRepo from '../repository/customer.repository.js';
import { NotFoundError, ForbiddenError, ConflictError, BadRequestError } from '../utils/AppError.js';
import type { UserRole } from '../types/index.js';

export interface CreateReviewInput {
  orderItemId: number;
  rating: number;
  comment?: string;
}

/**
 * [FR10] Tạo đánh giá mới cho sản phẩm đã mua
 */
export async function createReview(userId: number, input: CreateReviewInput) {
  // 1. Xác thực tài khoản khách hàng
  const customer = await customerRepo.findWithTierByUserId(userId);
  if (!customer) {
    throw new ForbiddenError('Chỉ tài khoản khách hàng Patron mới có quyền gửi cảm nhận đánh giá');
  }

  // 2. Kiểm tra rating hợp lệ
  if (!input.rating || input.rating < 1 || input.rating > 5) {
    throw new BadRequestError('Điểm đánh giá phải là số nguyên từ 1 đến 5 sao');
  }

  // 3. Kiểm tra tính hợp lệ của dòng đơn hàng bằng Subquery
  const eligibility = await reviewRepo.checkReviewEligibility(input.orderItemId);
  if (!eligibility) {
    throw new NotFoundError('Dòng sản phẩm trong đơn hàng không tồn tại');
  }

  if (eligibility.orderCustomerId !== customer.id) {
    throw new ConflictError(
      'Dòng sản phẩm này không thuộc đơn hàng của quý khách',
      'NOT_ELIGIBLE_FOR_REVIEW',
    );
  }

  if (eligibility.orderStatus !== 'delivered') {
    throw new ConflictError(
      'Đơn hàng chưa được hoàn tất bàn giao (trạng thái hiện tại chưa phải delivered), không thể viết đánh giá',
      'NOT_ELIGIBLE_FOR_REVIEW',
    );
  }

  if (eligibility.hasReviewed > 0) {
    throw new ConflictError(
      'Quý khách đã gửi đánh giá cho tác phẩm này trong đơn hàng trước đó',
      'DUPLICATE_REVIEW',
    );
  }

  // 4. Tạo bài đánh giá
  let reviewId: number;
  try {
    reviewId = await reviewRepo.createReview({
      customerId: customer.id,
      productId: eligibility.productId,
      orderItemId: input.orderItemId,
      rating: Math.floor(input.rating),
      comment: input.comment?.trim() || null,
    });
  } catch (err) {
    // UNIQUE(customer_id, order_item_id) is authoritative under concurrent INSERTs.
    if ((err as { code?: string }).code === 'ER_DUP_ENTRY') {
      throw new ConflictError('Quý khách đã gửi đánh giá cho dòng hàng này', 'DUPLICATE_REVIEW');
    }
    throw err;
  }

  const createdReview = await reviewRepo.findReviewById(reviewId);
  return createdReview;
}

/**
 * [FR10] Xóa bài đánh giá (Customer xoá bài của mình hoặc Admin kiểm duyệt xoá)
 */
export async function deleteReview(userId: number, role: string, reviewId: number) {
  const review = await reviewRepo.findReviewById(reviewId);
  if (!review) {
    throw new NotFoundError('Bài đánh giá không tồn tại hoặc đã được gỡ bỏ');
  }

  if (role === 'customer') {
    const customer = await customerRepo.findWithTierByUserId(userId);
    if (!customer || review.customerId !== customer.id) {
      throw new ForbiddenError('Quý khách chỉ có thể xoá bài đánh giá do chính mình tạo');
    }
    await reviewRepo.deleteReview(reviewId, customer.id);
  } else if (role === 'admin') {
    await reviewRepo.deleteReview(reviewId);
  } else {
    throw new ForbiddenError('Bạn không có quyền xoá bài đánh giá này');
  }

  return { id: reviewId, deleted: true };
}

/**
 * Lấy đánh giá của một dòng sản phẩm (dùng cho giao diện viết/sửa đánh giá)
 */
export async function getReviewByOrderItem(userId: number, role: UserRole, orderItemId: number) {
  if (role === 'customer') {
    const customer = await customerRepo.findWithTierByUserId(userId);
    const item = await reviewRepo.checkReviewEligibility(orderItemId);
    if (!item) throw new NotFoundError('Dòng sản phẩm trong đơn hàng không tồn tại');
    if (!customer || item.orderCustomerId !== customer.id) {
      throw new ForbiddenError('Quý khách chỉ có thể truy cập đánh giá trong đơn hàng của mình');
    }
  } else if (role !== 'admin') {
    throw new ForbiddenError();
  }

  return reviewRepo.findReviewByOrderItemId(orderItemId);
}
