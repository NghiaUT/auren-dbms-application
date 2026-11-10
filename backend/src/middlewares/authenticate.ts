// ============================================================================
// File: backend/src/middlewares/authenticate.ts
// Vai trò: Middleware xác thực người dùng qua JWT (header Authorization: Bearer).
//          Giải mã token, gắn thông tin { id, role, customerId } vào req.user,
//          trả về lỗi 401 nếu thiếu token hoặc token không hợp lệ / hết hạn.
// ============================================================================

import { verifyAccessToken } from '../utils/jwt.js';
import { UnauthorizedError, InvalidTokenError, TokenExpiredError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { isActiveAccount } from '../repository/user.repository.js';

export const authenticate = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Thiếu thông tin đăng nhập hoặc Token đã bị lỗi.');
  }

  const token = authHeader.split(' ')[1];

  let user;
  try {
    user = verifyAccessToken(token);
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new TokenExpiredError();
    }
    throw new InvalidTokenError();
  }
  if (!(await isActiveAccount(user.id, user.email, user.role))) {
    throw new InvalidTokenError('Tài khoản đã bị khóa hoặc phiên đăng nhập không còn hợp lệ.');
  }
  req.user = user;
  next();
});
