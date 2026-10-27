// ============================================================================
// File: backend/src/middlewares/validate.ts
// Vai trò: Middleware kiểm tra và chuẩn hoá dữ liệu đầu vào (req.body, req.query,
//          req.params) dựa trên Zod schema; trả về lỗi 400 Bad Request nếu sai định dạng.
// ============================================================================

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';

/**
 * Tạo middleware xác thực dữ liệu request body bằng Zod schema.
 *
 * @param schema Zod schema định nghĩa cấu trúc và ràng buộc của dữ liệu
 * @returns Express RequestHandler bọc logic parse bất đồng bộ
 */
export function validate(schema: ZodTypeAny): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}
