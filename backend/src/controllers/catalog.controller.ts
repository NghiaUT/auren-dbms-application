// ============================================================================
// File: backend/src/controllers/catalog.controller.ts
// Vai trò: Tầng Controller — Nhận request tra cứu danh mục / sản phẩm,
//          kiểm tra dữ liệu đầu vào bằng Zod schema, gọi catalog.service và trả response.
// Quy tắc: Không viết câu lệnh SQL, không trực tiếp mở transaction.
// ============================================================================

import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as catalogService from '../services/catalog.service.js';
import { sendSuccessRes } from '../utils/sendSuccessRes.js';

// Helper parse mảng số từ query param dạng chuỗi phân tách bởi dấu phẩy (vd: "1,2,3")
const commaSeparatedNumbers = z
  .string()
  .optional()
  .transform((val) => {
    if (!val) return undefined;
    return val
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);
  });

export const productFilterSchema = z
  .object({
    q: z.string().trim().optional(),
    categoryId: z.coerce.number().int().positive().optional(),
    brandId: commaSeparatedNumbers,
    materialId: commaSeparatedNumbers,
    minPrice: z.coerce.number().min(0, 'minPrice không được nhỏ hơn 0').optional(),
    maxPrice: z.coerce.number().min(0, 'maxPrice không được nhỏ hơn 0').optional(),
    isLimited: z
      .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
      .optional()
      .transform((val) => (val === true || val === 'true' || val === '1' ? true : val === undefined ? undefined : false)),
    featured: z
      .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
      .optional()
      .transform((val) => (val === true || val === 'true' || val === '1' ? true : val === undefined ? undefined : false)),
    includeInactive: z
      .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
      .optional()
      .transform((val) => (val === true || val === 'true' || val === '1' ? true : false)),
    sort: z.enum(['newest', 'price', 'rating', 'name']).default('newest'),
    order: z.enum(['asc', 'desc']).default('desc'),
    page: z.coerce.number().int().min(1, 'page tối thiểu là 1').default(1),
    limit: z.coerce.number().int().min(1).max(100, 'limit tối đa là 100').default(12),
  })
  .refine(
    (data) => {
      if (data.minPrice !== undefined && data.maxPrice !== undefined) {
        return data.minPrice <= data.maxPrice;
      }
      return true;
    },
    {
      message: 'minPrice không được lớn hơn maxPrice',
      path: ['minPrice'],
    },
  );

/**
 * [FR2, FR3] GET /api/products
 * Danh sách / tìm kiếm / lọc sản phẩm công khai
 */
export const getProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const query = productFilterSchema.parse(req.query);

  const result = await catalogService.getProducts(
    {
      q: query.q,
      categoryId: query.categoryId,
      brandIds: query.brandId,
      materialIds: query.materialId,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      isLimited: query.isLimited,
      featured: query.featured,
      includeInactive: query.includeInactive,
      sort: query.sort,
      order: query.order,
      page: query.page,
      limit: query.limit,
    },
    req.user,
  );

  res.status(200).json({
    data: result.data,
    meta: result.meta,
  });
});

/**
 * [FR4] GET /api/products/:id
 * Chi tiết sản phẩm, biến thể, tồn kho và đánh giá
 */
export const getProductDetail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id) || id <= 0) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Mã sản phẩm không hợp lệ.',
      },
    });
    return;
  }

  const reviewLimit = Math.min(50, Math.max(1, Number(req.query.reviewLimit) || 10));
  const result = await catalogService.getProductDetail(id, req.user, reviewLimit);

  sendSuccessRes(res, result, 'Lấy chi tiết sản phẩm thành công.', 200);
});

/**
 * [FR2] GET /api/catalog/meta
 * Dữ liệu tham chiếu danh mục, thương hiệu, chất liệu, địa điểm showroom/kho
 */
export const getCatalogMeta = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const result = await catalogService.getCatalogMeta();
  sendSuccessRes(res, result, 'Lấy dữ liệu tham chiếu catalog thành công.', 200);
});

/**
 * GET /api/categories
 */
export const getCategories = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const result = await catalogService.getCatalogMeta();
  sendSuccessRes(res, result.categories, 'Lấy danh mục thành công.', 200);
});

/**
 * GET /api/brands
 */
export const getBrands = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const result = await catalogService.getCatalogMeta();
  sendSuccessRes(res, result.brands, 'Lấy thương hiệu thành công.', 200);
});

/**
 * GET /api/materials
 */
export const getMaterials = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const result = await catalogService.getCatalogMeta();
  sendSuccessRes(res, result.materials, 'Lấy chất liệu thành công.', 200);
});

/**
 * GET /api/locations
 */
export const getLocations = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const result = await catalogService.getCatalogMeta();
  sendSuccessRes(res, result.locations, 'Lấy địa điểm thành công.', 200);
});
