// ============================================================================
// File: frontend/src/utils/formatApiError.ts
// Vai trò: Tiện ích bóc tách và định dạng thông điệp lỗi từ Backend API chuẩn:
//          - Đọc chuẩn cấu trúc { error: { code, message, details } } từ API_CONTRACT
//          - Tự động phát hiện lỗi mất mạng (Network Error / Timeout)
//          - Chuyển đổi mã HTTP sang câu thông báo tiếng Việt dễ hiểu
// ============================================================================

import axios, { AxiosError } from 'axios';

export interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
    details?: Array<{ field?: string; message: string }>;
  };
  message?: string;
}

export interface FormattedError {
  message: string;
  code?: string;
  details?: string[];
}

export function formatApiError(
  err: unknown,
  fallbackMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại.',
): FormattedError {
  if (typeof err === 'string') {
    return { message: err };
  }

  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<ApiErrorResponse>;

    // 1. Trường hợp không nhận được phản hồi từ server (Mất mạng hoặc Timeout)
    if (!axiosErr.response) {
      if (axiosErr.code === 'ECONNABORTED') {
        return {
          message: 'Yêu cầu quá thời gian chờ (Timeout). Vui lòng thử lại sau.',
          code: 'TIMEOUT',
        };
      }
      return {
        message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền mạng.',
        code: 'NETWORK_ERROR',
      };
    }

    const data = axiosErr.response.data;
    const status = axiosErr.response.status;

    // 2. Trích xuất thông điệp từ Backend JSON chuẩn { error: { code, message, details } }
    if (data?.error?.message) {
      const detailsList = data.error.details?.map(
        (d) => `${d.field ? `[${d.field}] ` : ''}${d.message}`,
      );

      return {
        message: data.error.message,
        code: data.error.code,
        details: detailsList && detailsList.length > 0 ? detailsList : undefined,
      };
    }

    // 3. Fallback thông điệp theo mã trạng thái HTTP chuẩn
    switch (status) {
      case 400:
        return { message: 'Dữ liệu gửi lên không hợp lệ.', code: 'BAD_REQUEST' };
      case 401:
        return { message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', code: 'UNAUTHORIZED' };
      case 403:
        return { message: 'Bạn không có quyền thực hiện thao tác này.', code: 'FORBIDDEN' };
      case 404:
        return { message: 'Không tìm thấy dữ liệu yêu cầu.', code: 'NOT_FOUND' };
      case 409:
        return { message: 'Xung đột dữ liệu hoặc trạng thái không hợp lệ.', code: 'CONFLICT' };
      case 429:
        return { message: 'Hệ thống nhận quá nhiều yêu cầu. Vui lòng thử lại sau giây lát.', code: 'RATE_LIMITED' };
      case 500:
      case 502:
      case 503:
        return { message: 'Máy chủ nội bộ đang bận hoặc gặp sự cố.', code: 'SERVER_ERROR' };
      default:
        return { message: data?.message || fallbackMessage };
    }
  }

  if (err instanceof Error) {
    return { message: err.message };
  }

  return { message: fallbackMessage };
}
