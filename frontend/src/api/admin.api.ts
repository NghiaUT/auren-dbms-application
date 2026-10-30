// ============================================================================
// File: frontend/src/api/admin.api.ts
// Vai trò: Cung cấp các hàm gọi API dành cho phân hệ Admin (A01 - A08):
//   - Quản trị Sản phẩm & Biến thể (FR14 [20]-[25])
//   - Quản trị Dữ liệu tham chiếu (FR14 [26]-[28])
//   - Báo cáo thống kê kinh doanh (FR15a [29])
//   - Quản lý Hạng thành viên & Nâng hạng tự động (FR15b [30]-[32])
// ============================================================================

import axiosClient from './axiosClient';
import type {
  AdminProduct,
  AdminTier,
  AdminVariant,
  ApiResponse,
  BrandSalesReportItem,
  CatalogMeta,
  CreateProductInput,
  CreateVariantInput,
  PageMeta,
  ProductSummary,
  RatingReportItem,
  RecalculateTiersResult,
  ReportSummary,
  RevenueReportItem,
  TopCustomersReportResult,
  UpdateProductInput,
  UpdateVariantInput,
} from '../types';

// ============================================================================
// 1. QUẢN TRỊ SẢN PHẨM & BIẾN THỂ (FR14 [20]-[25])
// ============================================================================

/**
 * Lấy danh sách sản phẩm phục vụ quản trị (A05)
 */
export async function getAdminProductsApi(params?: {
  q?: string;
  categoryId?: number;
  brandIds?: number[];
  page?: number;
  limit?: number;
  includeInactive?: boolean;
}): Promise<{ data: ProductSummary[]; meta: PageMeta }> {
  const response = await axiosClient.get<{ data: ProductSummary[]; meta: PageMeta }>('/products', {
    params: {
      ...params,
      includeInactive: true,
      limit: params?.limit || 20,
    },
  });
  return response.data;
}

/**
 * [FR14 - [20]] Tạo sản phẩm mới
 */
export async function createProductApi(data: CreateProductInput): Promise<AdminProduct> {
  const response = await axiosClient.post<ApiResponse<AdminProduct>>('/admin/products', data);
  return response.data.data;
}

/**
 * [FR14 - [21]] Cập nhật thông tin sản phẩm
 */
export async function updateProductApi(
  id: number,
  data: UpdateProductInput,
): Promise<AdminProduct> {
  const response = await axiosClient.patch<ApiResponse<AdminProduct>>(
    `/admin/products/${id}`,
    data,
  );
  return response.data.data;
}

/**
 * [FR14 - [22]] Xóa sản phẩm an toàn
 */
export async function deleteProductApi(id: number): Promise<{ id: number; deleted: boolean }> {
  const response = await axiosClient.delete<ApiResponse<{ id: number; deleted: boolean }>>(
    `/admin/products/${id}`,
  );
  return response.data.data;
}

/**
 * [FR14] Lấy danh sách biến thể của sản phẩm (A06)
 */
export async function getVariantsByProductIdApi(productId: number): Promise<AdminVariant[]> {
  const response = await axiosClient.get<ApiResponse<AdminVariant[]>>(
    `/admin/products/${productId}/variants`,
  );
  return response.data.data;
}

/**
 * [FR14 - [23]] Tạo biến thể mới cho sản phẩm (kèm chất liệu và serial)
 */
export async function createVariantApi(
  productId: number,
  data: CreateVariantInput,
): Promise<AdminVariant> {
  const response = await axiosClient.post<ApiResponse<AdminVariant>>(
    `/admin/products/${productId}/variants`,
    data,
  );
  return response.data.data;
}

/**
 * [FR14 - [24]] Cập nhật biến thể
 */
export async function updateVariantApi(
  id: number,
  data: UpdateVariantInput,
): Promise<AdminVariant> {
  const response = await axiosClient.patch<ApiResponse<AdminVariant>>(
    `/admin/variants/${id}`,
    data,
  );
  return response.data.data;
}

/**
 * [FR14 - [25]] Xóa biến thể an toàn bằng mệnh đề NOT EXISTS
 */
export async function deleteVariantApi(id: number): Promise<{ id: number; deleted: boolean }> {
  const response = await axiosClient.delete<ApiResponse<{ id: number; deleted: boolean }>>(
    `/admin/variants/${id}`,
  );
  return response.data.data;
}

// ============================================================================
// 2. DỮ LIỆU THAM CHIẾU (FR14 [26]-[28])
// ============================================================================

/**
 * Lấy dữ liệu tham chiếu danh mục, thương hiệu, chất liệu
 */
export async function getCatalogMetaApi(): Promise<CatalogMeta> {
  const response = await axiosClient.get<ApiResponse<CatalogMeta>>('/catalog/meta');
  return response.data.data;
}

/**
 * [FR14 - [26]] Tạo mới dữ liệu tham chiếu
 */
export async function createReferenceResourceApi(
  resource: 'categories' | 'brands' | 'materials',
  data: Record<string, any>,
): Promise<any> {
  const response = await axiosClient.post<ApiResponse<any>>(`/admin/${resource}`, data);
  return response.data.data;
}

/**
 * [FR14 - [27]] Cập nhật dữ liệu tham chiếu
 */
export async function updateReferenceResourceApi(
  resource: 'categories' | 'brands' | 'materials',
  id: number,
  data: Record<string, any>,
): Promise<any> {
  const response = await axiosClient.patch<ApiResponse<any>>(`/admin/${resource}/${id}`, data);
  return response.data.data;
}

/**
 * [FR14 - [28]] Xóa dữ liệu tham chiếu
 */
export async function deleteReferenceResourceApi(
  resource: 'categories' | 'brands' | 'materials',
  id: number,
): Promise<{ id: number; deleted: boolean }> {
  const response = await axiosClient.delete<ApiResponse<{ id: number; deleted: boolean }>>(
    `/admin/${resource}/${id}`,
  );
  return response.data.data;
}

// ============================================================================
// 3. BÁO CÁO THỐNG KÊ (FR15a [29])
// ============================================================================

/**
 * [A01] Báo cáo tổng quan Dashboard KPI
 */
export async function getSummaryReportApi(params?: {
  from?: string;
  to?: string;
}): Promise<ReportSummary> {
  const response = await axiosClient.get<ApiResponse<ReportSummary>>('/admin/reports/summary', {
    params,
  });
  return response.data.data;
}

/**
 * [A02] Báo cáo doanh thu theo tháng
 */
export async function getRevenueReportApi(params?: {
  from?: string;
  to?: string;
}): Promise<RevenueReportItem[]> {
  const response = await axiosClient.get<ApiResponse<RevenueReportItem[]>>(
    '/admin/reports/revenue',
    { params },
  );
  return response.data.data;
}

/**
 * [A03] Báo cáo doanh số theo thương hiệu (mệnh đề HAVING)
 */
export async function getBrandSalesReportApi(params?: {
  min?: number;
  limit?: number;
}): Promise<BrandSalesReportItem[]> {
  const response = await axiosClient.get<ApiResponse<BrandSalesReportItem[]>>(
    '/admin/reports/brand-sales',
    { params },
  );
  return response.data.data;
}

/**
 * [A04 - Tab 1] Báo cáo điểm đánh giá trung bình sản phẩm (HAVING count >= min)
 */
export async function getRatingsReportApi(params?: {
  min?: number;
  limit?: number;
}): Promise<RatingReportItem[]> {
  const response = await axiosClient.get<ApiResponse<RatingReportItem[]>>(
    '/admin/reports/ratings',
    { params },
  );
  return response.data.data;
}

/**
 * [A04 - Tab 2] Báo cáo khách hàng VIP chi tiêu trên mức trung bình (Subquery)
 */
export async function getTopCustomersReportApi(params?: {
  limit?: number;
}): Promise<TopCustomersReportResult> {
  const response = await axiosClient.get<ApiResponse<TopCustomersReportResult>>(
    '/admin/reports/top-customers',
    { params },
  );
  return response.data.data;
}

// ============================================================================
// 4. HẠNG THÀNH VIÊN & NÂNG HẠNG TỰ ĐỘNG (FR15b [30]-[32])
// ============================================================================

/**
 * [A08] Lấy danh sách hạng thành viên
 */
export async function getTiersApi(): Promise<AdminTier[]> {
  const response = await axiosClient.get<ApiResponse<AdminTier[]>>('/admin/tiers');
  return response.data.data;
}

/**
 * [A08] Cập nhật thông số hạng thành viên
 */
export async function updateTierApi(
  id: number,
  data: { name?: string; minSpent?: number; discountPct?: number },
): Promise<AdminTier> {
  const response = await axiosClient.patch<ApiResponse<AdminTier>>(`/admin/tiers/${id}`, data);
  return response.data.data;
}

/**
 * [A08] Tính toán và nâng hạng tự động hàng loạt
 */
export async function recalculateTiersApi(
  dryRun: boolean = false,
): Promise<RecalculateTiersResult> {
  const response = await axiosClient.post<ApiResponse<RecalculateTiersResult>>(
    '/admin/tiers/recalculate',
    { dryRun },
  );
  return response.data.data;
}
