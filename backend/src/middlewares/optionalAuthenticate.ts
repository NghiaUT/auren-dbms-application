// ============================================================================
// File: backend/src/middlewares/optionalAuthenticate.ts
// Vai trò: Middleware xác thực tuỳ chọn (Optional Authentication).
//          Nếu client gửi header Authorization: Bearer <token> hợp lệ,
//          req.user sẽ được nạp thông tin người dùng.
//          Nếu là Guest (không có token), request vẫn tiếp tục bình thường
//          mà không ném lỗi 401.
// ============================================================================

import { verifyAccessToken } from '../utils/jwt.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { isActiveAccount } from '../repository/user.repository.js';

export const optionalAuthenticate = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = verifyAccessToken(token);
    } catch {
      // Token lỗi hoặc hết hạn đối với public endpoint thì coi như Guest
      req.user = undefined;
    }
  }

  const user = req.user;
  if (user && !(await isActiveAccount(user.id, user.email, user.role))) {
    req.user = undefined;
  }
  next();
});
