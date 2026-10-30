// ============================================================================
// File: frontend/src/api/sales.api.ts
// Vai trò: Cung cấp các hàm gọi API dành cho phân hệ Sales:
//          - getSalesSummaryApi (FR11-13 - KPI tổng quan S01)
//          - getSalesOrderQueueApi (FR11 - Hàng đợi đơn S02)
//          - getSalesOrderDetailApi (FR11 - Chi tiết xử lý đơn S03)
//          - claimOrderApi (FR11 - Nhận đơn hàng S02)
//          - updateOrderStatusApi (FR11 - Đổi trạng thái đơn S03)
//          - cancelOrderBySalesApi (FR9 - Huỷ đơn hàng S03)
//          - createPaymentScheduleApi (FR7b - Lập lịch thanh toán S04)
//          - getSalesInventoryApi (FR12 - Tra cứu kho S05)
//          - getSalesLowStockApi (FR12 - Cảnh báo sắp hết hàng S06)
//          - restockInventoryApi (FR12 - Nhập thêm tồn kho S06)
//          - getSalesReceivablesApi (FR13 - Tra cứu sổ công nợ S07)
//          - markOverdueApi (FR13 - Đánh dấu nợ quá hạn S07)
// ============================================================================

import axiosClient from './axiosClient';
import type {
  ApiResponse,
  CreatePaymentScheduleItem,
  InventoryItem,
  OrderDetail,
  OrderStatus,
  PageMeta,
  PaymentDetail,
  ReceivableItem,
  SalesDashboardSummary,
  SalesOrderQueueItem,
} from '../types';

/**
 * [S01] Lấy các chỉ số KPI tổng hợp cho Bảng điều khiển Sales
 */
export async function getSalesSummaryApi(): Promise<SalesDashboardSummary> {
  const response = await axiosClient.get<ApiResponse<SalesDashboardSummary>>('/sales/summary');
  return response.data.data;
}

/**
 * [S02] Tra cứu danh sách hàng đợi đơn hàng (tab=unassigned hoặc tab=my_orders)
 */
export async function getSalesOrderQueueApi(params?: {
  tab?: 'unassigned' | 'my_orders';
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ data: SalesOrderQueueItem[]; meta: PageMeta }> {
  const response = await axiosClient.get<{ data: SalesOrderQueueItem[]; meta: PageMeta }>(
    '/sales/orders',
    { params },
  );
  return {
    data: response.data.data || [],
    meta: response.data.meta || { page: 1, limit: 10, total: 0, totalPages: 1 },
  };
}

/**
 * [S03] Lấy thông tin chi tiết một đơn hàng để xử lý tiến độ
 */
export async function getSalesOrderDetailApi(orderId: number): Promise<OrderDetail> {
  const response = await axiosClient.get<ApiResponse<OrderDetail>>(`/sales/orders/${orderId}`);
  return response.data.data;
}

/**
 * [FR11 - S02] Tiếp nhận đơn hàng chưa có người phụ trách (Atomic Claim)
 */
export async function claimOrderApi(
  orderId: number,
): Promise<{ id: number; status: string; salesUserId: number }> {
  const response = await axiosClient.patch<
    ApiResponse<{ id: number; status: string; salesUserId: number }>
  >(`/sales/orders/${orderId}/claim`);
  return response.data.data;
}

/**
 * [FR11 - S03] Cập nhật tiến độ trạng thái đơn hàng (in_production, shipped, delivered)
 */
export async function updateOrderStatusApi(
  orderId: number,
  payload: { status: OrderStatus; deliveryDate?: string | null },
): Promise<{ id: number; status: OrderStatus; deliveryDate?: string | null }> {
  const response = await axiosClient.patch<
    ApiResponse<{ id: number; status: OrderStatus; deliveryDate?: string | null }>
  >(`/sales/orders/${orderId}/status`, payload);
  return response.data.data;
}

/**
 * [FR9 - S03] Sales huỷ đơn hàng khi ở trạng thái pending hoặc confirmed
 */
export async function cancelOrderBySalesApi(
  orderId: number,
  reason?: string,
): Promise<{ id: number; status: string }> {
  const response = await axiosClient.post<ApiResponse<{ id: number; status: string }>>(
    `/sales/orders/${orderId}/cancel`,
    { reason },
  );
  return response.data.data;
}

/**
 * [FR7b - S04] Lập lịch các đợt thanh toán (cọc, trả góp, tất toán)
 */
export async function createPaymentScheduleApi(
  orderId: number,
  payments: CreatePaymentScheduleItem[],
): Promise<PaymentDetail[]> {
  const response = await axiosClient.post<ApiResponse<PaymentDetail[]>>(
    `/sales/orders/${orderId}/payments`,
    { payments },
  );
  return response.data.data;
}

/**
 * [FR12 - S05] Tra cứu danh sách tồn kho theo showroom/kho
 */
export async function getSalesInventoryApi(params?: {
  locationId?: number;
  sku?: string;
  lowStock?: number;
  page?: number;
  limit?: number;
}): Promise<{ data: InventoryItem[]; meta: PageMeta }> {
  const response = await axiosClient.get<{ data: InventoryItem[]; meta: PageMeta }>(
    '/sales/inventory',
    { params },
  );
  return {
    data: response.data.data || [],
    meta: response.data.meta || { page: 1, limit: 10, total: 0, totalPages: 1 },
  };
}

/**
 * [FR12 - S06] Cảnh báo các biến thể sắp hết hàng trên toàn hệ thống
 */
export async function getSalesLowStockApi(threshold: number = 5): Promise<InventoryItem[]> {
  const response = await axiosClient.get<ApiResponse<InventoryItem[]>>(
    '/sales/inventory/low-stock',
    { params: { threshold } },
  );
  return response.data.data || [];
}

/**
 * [FR12 - S06] Nhập thêm tồn kho có kiểm soát phiên bản (Optimistic Locking)
 */
export async function restockInventoryApi(payload: {
  variantId: number;
  locationId: number;
  quantity: number;
  version: number;
}): Promise<InventoryItem> {
  const response = await axiosClient.patch<ApiResponse<InventoryItem>>(
    '/sales/inventory/restock',
    payload,
  );
  return response.data.data;
}

/**
 * [FR13 - S07] Tra cứu danh sách công nợ & các khoản quá hạn
 */
export async function getSalesReceivablesApi(params?: {
  status?: string;
  dueBefore?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: ReceivableItem[]; meta: PageMeta & { totalOutstanding: number } }> {
  const response = await axiosClient.get<{
    data: ReceivableItem[];
    meta: PageMeta & { totalOutstanding: number };
  }>('/sales/receivables', { params });
  return {
    data: response.data.data || [],
    meta: response.data.meta || {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
      totalOutstanding: 0,
    },
  };
}

/**
 * [FR13 - S07] Đánh dấu các khoản pending quá hạn sang 'overdue'
 */
export async function markOverdueApi(
  paymentIds?: number[],
): Promise<{ updated: number; paymentIds: number[] }> {
  const response = await axiosClient.post<
    ApiResponse<{ updated: number; paymentIds: number[] }>
  >('/sales/receivables/mark-overdue', { paymentIds });
  return response.data.data;
}
