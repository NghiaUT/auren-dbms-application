// backend/src/middlewares/rateLimiter.ts
import rateLimit from 'express-rate-limit';
import { RateLimitError } from '../utils/AppError.js';
import { env } from '../config/env.js';
/**
 * Giới hạn tần suất gọi API đăng nhập / đăng ký
 * Mặc định: Tối đa 10 lần thử trong vòng 15 phút trên mỗi IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  limit: env.NODE_ENV === 'test' ? 1000 : 10, // Nới lỏng khi test, nghiêm ngặt khi chạy thật
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    // Chuyển lỗi cho errorHandler.ts xử lý thống nhất format JSON { error: { code: "RATE_LIMITED", ... } }
    next(
      new RateLimitError('Bạn đã gửi quá nhiều yêu cầu xác thực. Vui lòng thử lại sau 15 phút.'),
    );
  },
});
