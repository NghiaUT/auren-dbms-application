// ============================================================================
// File: backend/src/utils/asyncHandler.ts
// Vai trò: Hàm tiện ích bọc các hàm bất đồng bộ (async route handlers / controllers)
//          để tự động bắt Promise rejection và chuyển tiếp tới next(err).
// ============================================================================

import type { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Bọc hàm async controller để tự động bắt lỗi và chuyển cho Express errorHandler
 */
export const asyncHandler = (fn: AsyncFunction): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
