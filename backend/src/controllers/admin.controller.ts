// ============================================================================
// File: backend/src/controllers/admin.controller.ts
// Vai trò: Tầng Controller — Tiếp nhận các request thuộc phân hệ Admin
//          (quản lý sản phẩm/biến thể/danh mục FR14, báo cáo thống kê FR15a,
//          quản lý & nâng hạng thành viên tự động FR15b),
//          gọi admin.service và trả kết quả HTTP response chuẩn.
// Quy tắc: Không viết câu lệnh SQL, không trực tiếp mở transaction.
// ============================================================================

import type { Request, Response } from 'express';
import { z } from 'zod';
import * as adminService from '../services/admin.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccessRes } from '../utils/sendSuccessRes.js';
import { BadRequestError } from '../utils/AppError.js';

const adminPageSchema = z.object({
  q: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
const userListSchema = adminPageSchema.extend({ role: z.enum(['admin', 'sales', 'customer']).optional() });
const reviewListSchema = adminPageSchema.extend({ rating: z.coerce.number().int().min(1).max(5).optional() });
const internalUserSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(150).toLowerCase(),
  password: z.string().min(8).refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Mật khẩu tối đa 72 byte'),
  role: z.enum(['admin', 'sales']),
}).strict();
const userStatusSchema = z.object({ isActive: z.boolean() }).strict();
const userIdSchema = z.coerce.number().int().positive().max(4_294_967_295);

function sendPage<T>(res: Response, { data, total }: { data: T[]; total: number }, { page, limit }: { page: number; limit: number }) {
  return res.json({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export const listUsers = asyncHandler(async (req, res) => {
  const filters = userListSchema.parse(req.query);
  return sendPage(res, await adminService.listUsers(filters), filters);
});

export const createInternalUser = asyncHandler(async (req, res) => {
  const user = await adminService.createInternalUser(internalUserSchema.parse(req.body));
  return sendSuccessRes(res, user, 'Tạo tài khoản thành công', 201);
});

export const setUserActive = asyncHandler(async (req, res) => {
  const id = userIdSchema.parse(req.params.id);
  const { isActive } = userStatusSchema.parse(req.body);
  return sendSuccessRes(res, await adminService.setUserActive(id, isActive), 'Đã cập nhật trạng thái tài khoản');
});

export const listReviews = asyncHandler(async (req, res) => {
  const filters = reviewListSchema.parse(req.query);
  return sendPage(res, await adminService.listReviews(filters), filters);
});

// ============================================================================
// SCHEMAS VALIDATION ZOD
// ============================================================================

export const createProductSchema = z.object({
  brandId: z.coerce.number().int().positive('brandId phải là số nguyên dương'),
  categoryId: z.coerce.number().int().positive('categoryId phải là số nguyên dương'),
  name: z.string().min(2, 'Tên sản phẩm tối thiểu 2 ký tự').max(200, 'Tên sản phẩm tối đa 200 ký tự'),
  description: z.string().optional(),
  collectionName: z.string().max(120).optional(),
  designerName: z.string().max(120).optional(),
  isLimited: z.boolean().optional().default(false),
  isMadeToOrder: z.boolean().optional().default(false),
});

export const updateProductSchema = createProductSchema.partial();

export const variantMaterialItemSchema = z.object({
  materialId: z.coerce.number().int().positive('materialId phải là số nguyên dương'),
  portion: z.coerce.number().min(0).max(100).optional(),
  finishNote: z.string().max(120).optional(),
});

export const createVariantSchema = z.object({
  sku: z.string().min(1, 'SKU không được để trống').max(60, 'SKU tối đa 60 ký tự'),
  size: z.string().max(60).optional(),
  finish: z.string().max(60).optional(),
  price: z.coerce.number().min(0, 'Giá bán không được âm'),
  leadTimeDays: z.coerce.number().int().min(0, 'Thời gian sản xuất không được âm').optional().default(0),
  status: z.enum(['active', 'discontinued']).optional().default('active'),
  materials: z.array(variantMaterialItemSchema).optional(),
  editionSize: z.coerce.number().int().positive().optional(),
});

export const updateVariantSchema = z.object({
  sku: z.string().min(1).max(60).optional(),
  size: z.string().max(60).optional(),
  finish: z.string().max(60).optional(),
  price: z.coerce.number().min(0).optional(),
  leadTimeDays: z.coerce.number().int().min(0).optional(),
  status: z.enum(['active', 'discontinued']).optional(),
  materials: z.array(variantMaterialItemSchema).optional(),
});

export const updateTierSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  minSpent: z.coerce.number().min(0, 'Ngưỡng chi tiêu không được âm').optional(),
  discountPct: z.coerce.number().min(0).max(100, 'Phần trăm giảm giá từ 0-100%').optional(),
});

export const recalculateTiersSchema = z.object({
  dryRun: z.boolean().optional().default(false),
});

// ============================================================================
// CONTROLLERS - SẢN PHẨM & BIẾN THỂ (FR14)
// ============================================================================

/**
 * [FR14 - Endpoint 20] Tạo sản phẩm mới
 */
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createProductSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError('Dữ liệu tạo sản phẩm không hợp lệ: ' + JSON.stringify(parsed.error.flatten().fieldErrors));
  }
  const result = await adminService.createProduct(parsed.data);
  return sendSuccessRes(res, result, 'Tạo sản phẩm mới thành công', 201);
});

/**
 * [FR14 - Endpoint 21] Cập nhật thông tin sản phẩm
 */
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id) || id <= 0) {
    throw new BadRequestError('ID sản phẩm không hợp lệ');
  }
  const parsed = updateProductSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError('Dữ liệu cập nhật sản phẩm không hợp lệ: ' + JSON.stringify(parsed.error.flatten().fieldErrors));
  }
  const result = await adminService.updateProduct(id, parsed.data);
  return sendSuccessRes(res, result, 'Cập nhật thông tin sản phẩm thành công');
});

/**
 * [FR14 - Endpoint 22] Xóa sản phẩm an toàn
 */
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id) || id <= 0) {
    throw new BadRequestError('ID sản phẩm không hợp lệ');
  }
  const result = await adminService.deleteProduct(id);
  return sendSuccessRes(res, result, 'Xóa sản phẩm thành công');
});

/**
 * [FR14 - Endpoint 23] Tạo biến thể cho sản phẩm
 */
export const createVariant = asyncHandler(async (req: Request, res: Response) => {
  const productId = Number(req.params.id);
  if (isNaN(productId) || productId <= 0) {
    throw new BadRequestError('ID sản phẩm không hợp lệ');
  }
  const parsed = createVariantSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError('Dữ liệu tạo biến thể không hợp lệ: ' + JSON.stringify(parsed.error.flatten().fieldErrors));
  }
  const result = await adminService.createVariant(productId, parsed.data);
  return sendSuccessRes(res, result, 'Tạo biến thể mới thành công', 201);
});

/**
 * [FR14 - Endpoint 24] Cập nhật biến thể
 */
export const updateVariant = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id) || id <= 0) {
    throw new BadRequestError('ID biến thể không hợp lệ');
  }
  const parsed = updateVariantSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError('Dữ liệu cập nhật biến thể không hợp lệ: ' + JSON.stringify(parsed.error.flatten().fieldErrors));
  }
  const result = await adminService.updateVariant(id, parsed.data);
  return sendSuccessRes(res, result, 'Cập nhật biến thể thành công');
});

/**
 * [FR14 - Endpoint 25] Xóa biến thể an toàn bằng mệnh đề NOT EXISTS
 */
export const deleteVariant = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id) || id <= 0) {
    throw new BadRequestError('ID biến thể không hợp lệ');
  }
  const result = await adminService.deleteVariant(id);
  return sendSuccessRes(res, result, 'Xoá biến thể thành công');
});

/**
 * [FR14] Lấy danh sách biến thể theo ID sản phẩm (dành cho màn hình A06)
 */
export const getVariantsByProductId = asyncHandler(async (req: Request, res: Response) => {
  const productId = Number(req.params.id);
  if (isNaN(productId) || productId <= 0) {
    throw new BadRequestError('ID sản phẩm không hợp lệ');
  }
  const variants = await adminService.getVariantsByProductId(productId);
  return sendSuccessRes(res, variants, 'Lấy danh sách biến thể thành công');
});

// ============================================================================
// CONTROLLERS - DỮ LIỆU THAM CHIẾU (FR14)
// ============================================================================

/**
 * [FR14 - Endpoint 26] Tạo mới dữ liệu tham chiếu (categories, brands, materials)
 */
export const createReferenceResource = asyncHandler(async (req: Request, res: Response) => {
  const resource = req.params.resource as 'categories' | 'brands' | 'materials';
  const result = await adminService.createReferenceResource(resource, req.body);
  return sendSuccessRes(res, result, `Tạo mới ${resource} thành công`, 201);
});

/**
 * [FR14 - Endpoint 27] Cập nhật dữ liệu tham chiếu
 */
export const updateReferenceResource = asyncHandler(async (req: Request, res: Response) => {
  const resource = req.params.resource as 'categories' | 'brands' | 'materials';
  const id = Number(req.params.id);
  if (isNaN(id) || id <= 0) {
    throw new BadRequestError('ID không hợp lệ');
  }
  const result = await adminService.updateReferenceResource(resource, id, req.body);
  return sendSuccessRes(res, result, `Cập nhật ${resource} thành công`);
});

/**
 * [FR14 - Endpoint 28] Xóa dữ liệu tham chiếu
 */
export const deleteReferenceResource = asyncHandler(async (req: Request, res: Response) => {
  const resource = req.params.resource as 'categories' | 'brands' | 'materials';
  const id = Number(req.params.id);
  if (isNaN(id) || id <= 0) {
    throw new BadRequestError('ID không hợp lệ');
  }
  const result = await adminService.deleteReferenceResource(resource, id);
  return sendSuccessRes(res, result, `Xoá ${resource} thành công`);
});

// ============================================================================
// CONTROLLERS - BÁO CÁO THỐNG KÊ (FR15a)
// ============================================================================

/**
 * [FR15a - Endpoint 29] Báo cáo thống kê theo loại (summary, revenue, brand-sales, ratings, top-customers)
 */
export const getReport = asyncHandler(async (req: Request, res: Response) => {
  const type = String(req.params.type);
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;
  const min = req.query.min ? Number(req.query.min) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;

  const data = await adminService.getReport(type, { from, to, min, limit });
  return sendSuccessRes(res, data, `Báo cáo ${type} thành công`);
});

// ============================================================================
// CONTROLLERS - HẠNG THÀNH VIÊN (FR15b)
// ============================================================================

/**
 * [FR15b - Endpoint 30] Danh sách cấu hình hạng thành viên
 */
export const getTiers = asyncHandler(async (_req: Request, res: Response) => {
  const tiers = await adminService.getTiers();
  return sendSuccessRes(res, tiers, 'Lấy danh sách hạng thành viên thành công');
});

/**
 * [FR15b - Endpoint 31] Cập nhật cấu hình hạng thành viên
 */
export const updateTier = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id) || id <= 0) {
    throw new BadRequestError('ID hạng thành viên không hợp lệ');
  }
  const parsed = updateTierSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError('Dữ liệu cập nhật hạng không hợp lệ: ' + JSON.stringify(parsed.error.flatten().fieldErrors));
  }
  const result = await adminService.updateTier(id, parsed.data);
  return sendSuccessRes(res, result, 'Cập nhật hạng thành viên thành công');
});

/**
 * [FR15b - Endpoint 32] Tính toán và nâng/hạ hạng tự động hàng loạt
 */
export const recalculateTiers = asyncHandler(async (req: Request, res: Response) => {
  const parsed = recalculateTiersSchema.safeParse(req.body);
  const dryRun = parsed.success ? parsed.data.dryRun : false;
  const result = await adminService.recalculateTiers(dryRun);
  return sendSuccessRes(res, result, dryRun ? 'Xem trước nâng hạng thành công' : 'Thực thi nâng hạng tự động thành công');
});
