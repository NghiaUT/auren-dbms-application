// ============================================================================
// File: frontend/src/api/limited.api.ts
// Vai trò: Cung cấp API truy vấn thông tin ấn bản Limited Edition (FR6)
// ============================================================================

import axiosClient from './axiosClient';
import type { ApiResponse } from '../types';

export interface EditionUnit {
  id: number;
  variantId: number;
  serialNo: string;
  status: 'available' | 'reserved' | 'sold';
}

export interface VariantEditionData {
  variant: {
    variantId: number;
    sku: string;
    price: number;
    size: string | null;
    finish: string | null;
    leadTimeDays: number;
    productId: number;
    productName: string;
    productDescription: string | null;
    isLimited: boolean;
    collectionName: string | null;
    brandName: string | null;
    categoryName: string | null;
  };
  edition: {
    total: number;
    available: number;
    reserved: number;
    sold: number;
    nextAvailableSerial: string | null;
    units: EditionUnit[];
  };
}

/**
 * [FR6] Lấy thông tin ấn bản giới hạn và ma trận số hiệu bản khắc của biến thể
 * Endpoint: GET /api/limited/:variantId/units
 */
export async function getLimitedVariantUnitsApi(variantId: number): Promise<VariantEditionData> {
  const response = await axiosClient.get<ApiResponse<VariantEditionData>>(`/limited/${variantId}/units`);
  return response.data.data;
}
