// ============================================================================
// File: backend/src/routes/auth.routes.ts
// Vai trò: Tầng Route — Khai báo các endpoint xác thực và quản lý tài khoản cá nhân:
//   - POST   /api/auth/register (FR1 - Guest)
//   - POST   /api/auth/login    (FR0 - Guest)
//   - POST   /api/auth/logout   (FR0 - Đã đăng nhập)
//   - GET    /api/auth/me       (Xem hồ sơ & hạng thành viên - Đã đăng nhập)
// Quy tắc: Chỉ khai báo endpoint và gắn middleware, không chứa logic nghiệp vụ.
// ============================================================================

import { Router } from 'express';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import * as authController from '../controllers/auth.controller.js';
import { registerSchema, loginSchema } from '../controllers/auth.controller.js';

const authRouter = Router();

/**
 * [1] POST /api/auth/register
 * Đăng ký tài khoản khách hàng mới (FR1).
 * Middleware:
 * - authLimiter: Giới hạn tần suất gọi API từ cùng một IP (chống brute-force / spam)
 * - validate(registerSchema): Kiểm tra tính hợp lệ của dữ liệu đầu vào bằng Zod
 */
authRouter.post('/register', authLimiter, validate(registerSchema), authController.register);

/**
 * [2] POST /api/auth/login
 * Đăng nhập hệ thống (FR0).
 * Middleware:
 * - authLimiter: Giới hạn tần suất đăng nhập từ cùng một IP
 * - validate(loginSchema): Kiểm tra định dạng email và mật khẩu
 */
authRouter.post('/login', authLimiter, validate(loginSchema), authController.login);

/**
 * [3] POST /api/auth/logout
 * Đăng xuất tài khoản khỏi phiên hiện tại (FR0).
 * Middleware:
 * - authenticate: Yêu cầu JWT token hợp lệ trong header Authorization: Bearer <token>
 */
authRouter.post('/logout', authenticate, authController.logout);

/**
 * [2.2] GET /api/auth/me (Dự phòng theo API_CONTRACT.md)
 * Lấy thông tin hồ sơ và hạng thành viên của tài khoản đang đăng nhập.
 * Middleware:
 * - authenticate: Yêu cầu JWT token hợp lệ
 */
authRouter.get('/me', authenticate, authController.getMe);

/**
 * [C08] PATCH /api/auth/me
 * Cập nhật thông tin hồ sơ của tài khoản đang đăng nhập
 */
authRouter.patch(
  '/me',
  authenticate,
  validate(authController.updateMeSchema),
  authController.updateMe,
);

export default authRouter;
