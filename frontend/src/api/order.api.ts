// ============================================================================
// File: frontend/src/api/order.api.ts
// Vai trò: Cung cấp các hàm gọi API đặt hàng và thanh toán:
//          - createOrderApi (FR5, FR6 - Đặt hàng giao dịch ACID)
//          - getMyOrdersApi (FR8 - Danh sách đơn hàng cá nhân)
//          - getOrderDetailApi (FR8 - Chi tiết đơn hàng, dòng hàng, lịch trả)
//          - cancelOrderApi (FR9 - Huỷ đơn hàng)
//          - payPaymentApi (FR7 - Thanh toán khoản đợt)
// ============================================================================

import axiosClient from './axiosClient';
import type {
  ApiResponse,
  OrderDetail,
  OrderSummary,
  PageMeta,
  PaymentDetail,
  PlaceOrderPayload,
} from '../types';

export interface MyOrdersResponse {
  data: OrderSummary[];
  meta: PageMeta;
}

/**
 * [FR5, FR6] Đặt hàng mới
 * Endpoint: POST /api/orders
 */
export async function createOrderApi(payload: PlaceOrderPayload): Promise<OrderDetail> {
  const response = await axiosClient.post<ApiResponse<OrderDetail>>('/orders', payload);
  return response.data.data;
}

/**
 * [FR8] Lấy danh sách đơn hàng của khách hàng
 * Endpoint: GET /api/orders
 */
export async function getMyOrdersApi(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<MyOrdersResponse> {
  const response = await axiosClient.get<{ data: OrderSummary[]; meta: PageMeta }>(
    '/orders',
    { params },
  );

  return {
    data: response.data.data || [],
    meta: response.data.meta || {
      page: params?.page || 1,
      limit: params?.limit || 10,
      total: response.data.data?.length || 0,
      totalPages: 1,
    },
  };
}

/**
 * [FR8] Lấy thông tin chi tiết một đơn hàng
 * Endpoint: GET /api/orders/:id
 */
export async function getOrderDetailApi(id: number): Promise<OrderDetail> {
  const response = await axiosClient.get<ApiResponse<OrderDetail>>(`/orders/${id}`);
  return response.data.data;
}

/**
 * [FR9] Huỷ đơn hàng
 * Endpoint: POST /api/orders/:id/cancel
 */
export async function cancelOrderApi(id: number): Promise<{ id: number; status: string; message?: string }> {
  const response = await axiosClient.post<ApiResponse<{ id: number; status: string; message?: string }>>(
    `/orders/${id}/cancel`,
  );
  return response.data.data;
}

/**
 * [FR7] Thanh toán một khoản tiền theo lịch đợt
 * Endpoint: POST /api/payments/:id/pay
 */
export async function payPaymentApi(
  paymentId: number,
  method = 'bank_transfer',
): Promise<PaymentDetail> {
  const response = await axiosClient.post<ApiResponse<PaymentDetail>>(
    `/payments/${paymentId}/pay`,
    { method },
  );
  return response.data.data;
}
