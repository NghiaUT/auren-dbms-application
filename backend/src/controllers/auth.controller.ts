// ============================================================================
// File: backend/src/controllers/auth.controller.ts
// Vai trò: Tầng Controller — Nhận request xác thực & hồ sơ cá nhân (register,
//          login, logout, getMe, updateMe), gọi auth.service và trả HTTP response.
// Quy tắc: Không viết câu lệnh SQL, không trực tiếp mở transaction.
// ============================================================================

import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as authService from '../services/auth.service.js';
import { sendSuccessRes } from '../utils/sendSuccessRes.js';

/**
 * Zod Schema kiểm tra tính hợp lệ của dữ liệu đăng ký khách hàng (FR1)
 * Ràng buộc:
 * - fullName: độ dài từ 2 đến 120 ký tự
 * - email: đúng định dạng email, tối đa 150 ký tự
 * - password: độ dài từ 8 đến 72 ký tự
 * - phone: số điện thoại tối đa 20 ký tự (tuỳ chọn)
 * - address: địa chỉ tối đa 255 ký tự (tuỳ chọn)
 * - city: thành phố tối đa 80 ký tự (tuỳ chọn)
 */
export const registerSchema = z.object({
  fullName: z
    .string({ required_error: 'Họ tên là bắt buộc' })
    .trim()
    .min(2, 'Họ tên phải có ít nhất 2 ký tự')
    .max(120, 'Họ tên tối đa 120 ký tự'),
  email: z
    .string({ required_error: 'Email là bắt buộc' })
    .trim()
    .email('Email không đúng định dạng')
    .max(150, 'Email tối đa 150 ký tự'),
  password: z
    .string({ required_error: 'Mật khẩu là bắt buộc' })
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .max(72, 'Mật khẩu tối đa 72 ký tự'),
  phone: z.string().trim().max(20, 'Số điện thoại tối đa 20 ký tự').optional(),
  address: z.string().trim().max(255, 'Địa chỉ tối đa 255 ký tự').optional(),
  city: z.string().trim().max(80, 'Tên thành phố tối đa 80 ký tự').optional(),
});

/**
 * Zod Schema kiểm tra tính hợp lệ của dữ liệu đăng nhập (FR0)
 * Ràng buộc:
 * - email: đúng định dạng email
 * - password: chuỗi không được để trống
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email là bắt buộc' })
    .trim()
    .email('Email không đúng định dạng'),
  password: z.string({ required_error: 'Mật khẩu là bắt buộc' }).min(1, 'Vui lòng nhập mật khẩu'),
});

/**
 * Xử lý yêu cầu đăng ký tài khoản khách hàng mới (POST /api/auth/register).
 *
 * @param req Express Request chứa payload đăng ký đã qua Zod validation trong req.body
 * @param res Express Response dùng để trả kết quả HTTP 201 Created kèm dữ liệu token và profile
 * @returns Promise<void>
 */
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await authService.registerCustomer(req.body);
  sendSuccessRes(res, result, 'Đăng ký thành công.', 201);
});

/**
 * Xử lý yêu cầu đăng nhập hệ thống (POST /api/auth/login).
 *
 * @param req Express Request chứa email và password trong req.body
 * @param res Express Response dùng để trả kết quả HTTP 200 OK kèm accessToken, expiresIn và profile
 * @returns Promise<void>
 */
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  sendSuccessRes(res, result, 'Đăng nhập thành công.', 200);
});

/**
 * Xử lý yêu cầu đăng xuất khỏi hệ thống (POST /api/auth/logout).
 * Yêu cầu người dùng đã được xác thực qua middleware authenticate.
 *
 * @param req Express Request chứa thông tin tài khoản đã giải mã trong req.user
 * @param res Express Response dùng để trả kết quả HTTP 200 OK thông báo đăng xuất thành công
 * @returns Promise<void>
 */
export const logout = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  sendSuccessRes(res, {}, 'Đăng xuất thành công.', 200);
});

/**
 * Xử lý yêu cầu lấy thông tin hồ sơ và tiến độ hạng thành viên của tài khoản đang đăng nhập (GET /api/auth/me).
 *
 * @param req Express Request chứa thông tin xác thực của phiên đăng nhập trong req.user
 * @param res Express Response dùng để trả kết quả HTTP 200 OK kèm hồ sơ tài khoản
 * @returns Promise<void>
 */
export const getMe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await authService.getProfile(req.user!.id);
  sendSuccessRes(res, result, 'Lấy thông tin thành công.', 200);
});

export const updateMeSchema = z.object({
  fullName: z.string().min(2, 'Họ và tên tối thiểu 2 ký tự').max(120, 'Họ và tên tối đa 120 ký tự').optional(),
  phone: z.string().max(20, 'Số điện thoại tối đa 20 ký tự').optional().nullable(),
  address: z.string().max(255, 'Địa chỉ tối đa 255 ký tự').optional().nullable(),
  city: z.string().max(100, 'Tỉnh/Thành phố tối đa 100 ký tự').optional().nullable(),
});

/**
 * Xử lý yêu cầu cập nhật thông tin hồ sơ của tài khoản đang đăng nhập (PATCH /api/auth/me)
 */
export const updateMe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await authService.updateProfile(req.user!.id, req.body);
  sendSuccessRes(res, result, 'Cập nhật thông tin hồ sơ thành công.', 200);
});
