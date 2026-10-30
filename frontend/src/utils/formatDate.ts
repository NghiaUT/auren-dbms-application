// ============================================================================
// File: frontend/src/utils/formatDate.ts
// Vai trò: Hàm tiện ích định dạng ngày tháng theo chuẩn Việt Nam (vi-VN, Asia/Ho_Chi_Minh).
// ============================================================================

const TIMEZONE_VN = 'Asia/Ho_Chi_Minh';

/**
 * Định dạng ngày theo chuẩn Việt Nam (dd/mm/yyyy).
 * Hỗ trợ chuỗi Date ISO, chuỗi 'YYYY-MM-DD' hoặc đối tượng Date.
 */
export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '';

  // Xử lý chuỗi 'YYYY-MM-DD' trực tiếp tránh lệch ngày do múi giờ
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: TIMEZONE_VN,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Định dạng ngày giờ theo chuẩn Việt Nam (HH:mm dd/mm/yyyy).
 * Hỗ trợ chuỗi Date ISO hoặc đối tượng Date.
 */
export function formatDateTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: TIMEZONE_VN,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/**
 * Lấy chuỗi ngày 'YYYY-MM-DD' của hôm nay theo múi giờ Việt Nam.
 * Dùng cho các thẻ input dạng date (min/max/value).
 */
export function getTodayDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE_VN,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
