// ============================================================================
// File: frontend/src/utils/formatVND.ts
// Vai trò: Hàm tiện ích định dạng số tiền sang chuẩn tiền tệ Việt Nam Đồng (VND).
// ============================================================================

export function formatVND(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0 ₫';
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPriceUSD(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '$0';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}
