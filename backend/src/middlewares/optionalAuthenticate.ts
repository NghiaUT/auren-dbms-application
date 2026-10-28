// ============================================================================
// File: backend/src/middlewares/optionalAuthenticate.ts
// Vai trò: Middleware xác thực tuỳ chọn (Optional Authentication).
//          Nếu client gửi header Authorization: Bearer <token> hợp lệ,
//          req.user sẽ được nạp thông tin người dùng.
//          Nếu là Guest (không có token), request vẫn tiếp tục bình thường
//          mà không ném lỗi 401.
// ============================================================================

import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const user = verifyAccessToken(token);
      req.user = user;
    } catch {
      // Token lỗi hoặc hết hạn đối với public endpoint thì coi như Guest
      req.user = undefined;
    }
  }

  next();
}
