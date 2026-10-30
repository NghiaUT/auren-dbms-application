// ============================================================================
// File: frontend/src/components/common/StatusBadge/StatusBadge.tsx
// Vai trò: Component hiển thị nhãn trạng thái trực quan theo màu sắc ngữ nghĩa
//          cho đơn hàng, thanh toán, bản giới hạn
// ============================================================================

import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'gold';

export interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; dotColor: string }> = {
  success: { bg: 'bg-[#E8F5E9]', text: 'text-[#2E7D32]', dotColor: 'bg-[#2E7D32]' },
  warning: { bg: 'bg-[#FFF8E1]', text: 'text-[#F57F17]', dotColor: 'bg-[#F57F17]' },
  error: { bg: 'bg-[#FFEBEE]', text: 'text-[#C62828]', dotColor: 'bg-[#C62828]' },
  info: { bg: 'bg-[#E3F2FD]', text: 'text-[#1565C0]', dotColor: 'bg-[#1565C0]' },
  neutral: { bg: 'bg-[#F0EEE8]', text: 'text-[#4E4540]', dotColor: 'bg-[#7B6E64]' },
  gold: { bg: 'bg-[#F6EEDF]', text: 'text-[#8C6D37]', dotColor: 'bg-[#A7824B]' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'neutral',
  className = '',
  dot = true,
}) => {
  const style = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[1px] font-sans text-[11px] uppercase tracking-wider font-semibold ${style.bg} ${style.text} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${style.dotColor}`} />}
      <span>{label}</span>
    </span>
  );
};
