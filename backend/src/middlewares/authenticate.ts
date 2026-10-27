// ============================================================================
// File: backend/src/middlewares/authenticate.ts
// Vai trò: Middleware xác thực người dùng qua JWT (header Authorization: Bearer).
//          Giải mã token, gắn thông tin { id, role, customerId } vào req.user,
//          trả về lỗi 401 nếu thiếu token hoặc token không hợp lệ / hết hạn.
// ============================================================================

import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { UnauthorizedError, InvalidTokenError, TokenExpiredError } from '../utils/AppError.js';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Thiếu thông tin đăng nhập hoặc Token đã bị lỗi.');
  }

  const token = authHeader.split(' ')[1];

  try {
    const user = verifyAccessToken(token);
    req.user = user; // Gắn thông tin người dùng vào request context
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new TokenExpiredError();
    }
    throw new InvalidTokenError();
  }
}
