// ============================================================================
// File: backend/src/middlewares/errorHandler.ts
// Vai trò: Middleware xử lý lỗi tập trung của Express.
//          Chuyển đổi AppError, lỗi JWT, lỗi Zod và lỗi MySQL (ER_DUP_ENTRY, ER_ROW_IS_REFERENCED...)
//          sang định dạng JSON thống nhất: { error: { code, message, details? } } với đúng mã HTTP.
// ============================================================================

import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // Nếu headers đã được gửi trước đó, nhường cho Express default handler
  if (res.headersSent) {
    return next(err);
  }

  const e = (err ?? {}) as { code?: string; type?: string; stack?: string };

  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Đã xảy ra lỗi máy chủ nội bộ';
  let details: any = undefined;

  // 1. Trường hợp là lỗi nghiệp vụ do ứng dụng chủ động ném (AppError và các lớp con)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  }
  // 2. Trường hợp là lỗi phát sinh từ thư viện `jsonwebtoken`
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Mã xác thực (Token) không hợp lệ hoặc bị lỗi định dạng';
  } else if (err.name === 'NotBeforeError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = 'Token chưa tới thời điểm có hiệu lực';
  }
  // 3. Trường hợp là lỗi do Zod schema validation
  else if (err instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Dữ liệu yêu cầu không hợp lệ';
    details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  }
  // 4. Trường hợp là mã lỗi phổ biến từ MySQL (mysql2)
  else if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    code = 'DUPLICATE_ENTRY';
    message = 'Dữ liệu đã tồn tại trong hệ thống (trùng lặp trường duy nhất)';
  } else if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 409;
    code = 'RESOURCE_IN_USE';
    message = 'Không thể thao tác do xung đột dữ liệu liên kết khóa ngoại';
  } else if (e.type === 'entity.parse.failed') {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Nội dung JSON không hợp lệ';
  }

  // Ghi log lỗi server (5xx) để lập trình viên theo dõi
  if (statusCode >= 500) {
    console.error(`[${statusCode} ERROR] ${req.method} ${req.originalUrl}:`, err);
  }

  // Trả về định dạng JSON chuẩn theo API_CONTRACT.md
  res.status(statusCode).json({
    error: {
      code,
      message,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && statusCode >= 500 && { stack: err.stack }),
    },
  });
}
