// ============================================================================
// File: frontend/src/api/review.api.ts
// Vai trò: Cung cấp API đánh giá tác phẩm từ khách hàng (FR10)
// ============================================================================

import axiosClient from './axiosClient';
import type { ApiResponse } from '../types';

export interface ReviewItem {
  id: number;
  customerId: number;
  productId: number;
  orderItemId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  customerName?: string;
  productName?: string;
}

export interface CreateReviewPayload {
  orderItemId: number;
  rating: number;
  comment?: string | null;
}

/**
 * [FR10] Gửi đánh giá mới cho dòng sản phẩm
 * Endpoint: POST /api/reviews
 */
export async function createReviewApi(payload: CreateReviewPayload): Promise<ReviewItem> {
  const response = await axiosClient.post<ApiResponse<ReviewItem>>('/reviews', payload);
  return response.data.data;
}

/**
 * [FR10] Xóa bài đánh giá của chính mình
 * Endpoint: DELETE /api/reviews/:id
 */
export async function deleteReviewApi(id: number): Promise<{ id: number; deleted: boolean }> {
  const response = await axiosClient.delete<ApiResponse<{ id: number; deleted: boolean }>>(`/reviews/${id}`);
  return response.data.data;
}

/**
 * Lấy bài đánh giá hiện có của một dòng sản phẩm
 * Endpoint: GET /api/reviews/item/:orderItemId
 */
export async function getOrderItemReviewApi(orderItemId: number): Promise<ReviewItem | null> {
  try {
    const response = await axiosClient.get<ApiResponse<ReviewItem | null>>(`/reviews/item/${orderItemId}`);
    return response.data.data;
  } catch (err: any) {
    if (err.response?.status === 404) return null;
    throw err;
  }
}
