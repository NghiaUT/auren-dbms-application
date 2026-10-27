// ============================================================================
// File: backend/src/middlewares/authorize.ts
// Vai trò: Middleware kiểm tra phân quyền theo vai trò (RBAC) ở cấp độ route.
//          Nhận danh sách vai trò cho phép (vd: authorize('sales', 'admin'))
//          và trả về lỗi 403 Forbidden nếu req.user.role không nằm trong danh sách.
// ============================================================================
import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '../types/index.js';
import { ForbiddenError, UnauthorizedError } from '../utils/AppError.js';

export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError();
    }

    next();
  };
}
