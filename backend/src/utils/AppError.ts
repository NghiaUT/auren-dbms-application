// ============================================================================
// File: backend/src/utils/AppError.ts
// Vai trò: Định nghĩa lớp lỗi nghiệp vụ tuỳ chỉnh (AppError kế thừa từ Error),
//          lưu trữ mã trạng thái HTTP (statusCode) và mã lỗi định danh (code)
//          để chuyển cho middleware errorHandler xử lý thống nhất.
// ============================================================================

/**
 * Lớp lỗi cơ sở cho toàn bộ ứng dụng
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, code: string = 'APP_ERROR', details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 - Dữ liệu đầu vào không hợp lệ
 */
export class BadRequestError extends AppError {
  constructor(
    message: string = 'Dữ liệu không hợp lệ',
    code: string = 'VALIDATION_ERROR',
    details?: any,
  ) {
    super(400, message, code, details);
  }
}

/**
 * 401 - Lỗi xác thực tài khoản chung
 */
export class UnauthorizedError extends AppError {
  constructor(
    message: string = 'Yêu cầu xác thực tài khoản',
    code: string = 'UNAUTHORIZED',
    details?: any,
  ) {
    super(401, message, code, details);
  }
}

/**
 * 401 - JWT đã hết hạn (Token Expired)
 */
export class TokenExpiredError extends UnauthorizedError {
  constructor(message: string = 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại') {
    super(message, 'TOKEN_EXPIRED');
  }
}

/**
 * 401 - JWT không hợp lệ (sai chữ ký, sai cấu trúc)
 */
export class InvalidTokenError extends UnauthorizedError {
  constructor(message: string = 'Mã xác thực không hợp lệ hoặc bị giả mạo') {
    super(message, 'INVALID_TOKEN');
  }
}

/**
 * 401 - Đăng nhập thất bại (sai email hoặc mật khẩu)
 */
export class InvalidCredentialsError extends UnauthorizedError {
  constructor(message: string = 'Email hoặc mật khẩu không chính xác') {
    super(message, 'INVALID_CREDENTIALS');
  }
}

/**
 * 403 - Bị từ chối truy cập do thiếu quyền (Role hoặc Row-level)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Bạn không có quyền thực hiện hành động này', details?: any) {
    super(403, message, 'FORBIDDEN', details);
  }
}

/**
 * 404 - Tài nguyên không tồn tại
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Tài nguyên yêu cầu không tồn tại') {
    super(404, message, 'NOT_FOUND');
  }
}

/**
 * 409 - Xung đột trạng thái, trùng lặp hoặc vi phạm nghiệp vụ
 */
export class ConflictError extends AppError {
  constructor(message: string, code: string = 'CONFLICT', details?: any) {
    super(409, message, code, details);
  }
}

/**
 * 429 - Vượt quá tần suất gửi yêu cầu
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Quá nhiều yêu cầu, vui lòng thử lại sau') {
    super(429, message, 'RATE_LIMITED');
  }
}

/**
 * 500 - Lỗi máy chủ nội bộ
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Lỗi máy chủ nội bộ', details?: any) {
    super(500, message, 'INTERNAL_ERROR', details);
  }
}
