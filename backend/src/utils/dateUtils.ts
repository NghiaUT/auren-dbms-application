// ============================================================================
// File: backend/src/utils/dateUtils.ts
// Vai trò: Tiện ích xử lý chuỗi ngày tháng theo múi giờ Việt Nam (Asia/Ho_Chi_Minh).
//          Tránh lỗi cắt chuỗi toISOString().split('T')[0] bị tụt lùi ngày khi chạy sáng sớm (00h-07h).
// ============================================================================

const TIMEZONE_VN = 'Asia/Ho_Chi_Minh';

/**
 * Trả về chuỗi ngày 'YYYY-MM-DD' theo giờ địa phương Việt Nam.
 */
export function getVietnamDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE_VN,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Trả về chuỗi ngày 'YYYY-MM-DD' sau `daysAhead` ngày theo giờ địa phương Việt Nam.
 */
export function getVietnamFutureDateString(daysAhead: number, fromDate: Date = new Date()): string {
  const target = new Date(fromDate.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  return getVietnamDateString(target);
}
