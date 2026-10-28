// ============================================================================
// File: frontend/src/api/catalog.api.ts
// Vai trò: Cung cấp các hàm gọi API tra cứu danh mục, sản phẩm và chi tiết:
//          - getProductsApi (FR2, FR3 - Tìm kiếm, lọc nâng cao, phân trang)
//          - getProductDetailApi (FR4 - Chi tiết sản phẩm, biến thể, tồn kho theo quyền)
//          - getCatalogMetaApi (FR2, FR3 - Tham chiếu bộ lọc)
//          - getFeaturedProductsApi, getCategoriesApi
// ============================================================================

import axiosClient from './axiosClient';
import type {
  ApiResponse,
  CatalogMeta,
  Category,
  PageMeta,
  ProductDetail,
  ProductFilterParams,
  ProductSummary,
} from '../types';

export interface ProductsResponse {
  data: ProductSummary[];
  meta: PageMeta;
}

/**
 * [FR2, FR3] Tìm kiếm, lọc và phân trang sản phẩm
 * Endpoint: GET /api/products
 */
export async function getProductsApi(
  params: ProductFilterParams = {},
): Promise<ProductsResponse> {
  const queryParams: Record<string, any> = { ...params };

  // Chuyển đổi array thành chuỗi phân cách bởi dấu phẩy nếu người dùng chọn nhiều
  if (Array.isArray(queryParams.brandId)) {
    queryParams.brandId = queryParams.brandId.join(',');
  }
  if (Array.isArray(queryParams.materialId)) {
    queryParams.materialId = queryParams.materialId.join(',');
  }

  // Tách sort thành sort và order nếu có quy ước
  if (params.sort) {
    if (params.sort === 'price_asc') {
      queryParams.sort = 'price';
      queryParams.order = 'asc';
    } else if (params.sort === 'price_desc') {
      queryParams.sort = 'price';
      queryParams.order = 'desc';
    } else if (params.sort === 'rating') {
      queryParams.sort = 'rating';
      queryParams.order = 'desc';
    } else if (params.sort === 'name') {
      queryParams.sort = 'name';
      queryParams.order = 'asc';
    } else {
      queryParams.sort = 'newest';
      queryParams.order = 'desc';
    }
  }

  const response = await axiosClient.get<{ data: ProductSummary[]; meta: PageMeta }>(
    '/products',
    { params: queryParams },
  );

  return {
    data: response.data.data || [],
    meta: response.data.meta || {
      page: params.page || 1,
      limit: params.limit || 12,
      total: response.data.data?.length || 0,
      totalPages: 1,
    },
  };
}

/**
 * [FR4] Lấy thông tin chi tiết một tác phẩm nội thất
 * Endpoint: GET /api/products/:id
 */
export async function getProductDetailApi(
  id: number,
  reviewLimit = 10,
): Promise<ProductDetail> {
  const response = await axiosClient.get<ApiResponse<ProductDetail>>(
    `/products/${id}`,
    { params: { reviewLimit } },
  );

  return response.data.data;
}

/**
 * [FR2, FR3] Lấy toàn bộ siêu dữ liệu tham chiếu danh mục, thương hiệu, chất liệu, khoảng giá
 * Endpoint: GET /api/catalog/meta
 */
export async function getCatalogMetaApi(): Promise<CatalogMeta> {
  const response = await axiosClient.get<ApiResponse<CatalogMeta>>('/catalog/meta');
  return response.data.data;
}

/**
 * Lấy danh sách sản phẩm nổi bật trang chủ (P01)
 * Endpoint: GET /api/products?featured=true
 */
export async function getFeaturedProductsApi(): Promise<ProductSummary[]> {
  try {
    const response = await axiosClient.get<{ data: ProductSummary[] }>(
      '/products',
      { params: { featured: true, limit: 6 } },
    );
    return response.data.data || [];
  } catch {
    return [];
  }
}

/**
 * Lấy danh sách cây danh mục (P01, P02)
 * Endpoint: GET /api/categories
 */
export async function getCategoriesApi(): Promise<Category[]> {
  try {
    const response = await axiosClient.get<ApiResponse<Category[]>>('/categories');
    return response.data.data || [];
  } catch {
    return [];
  }
}
