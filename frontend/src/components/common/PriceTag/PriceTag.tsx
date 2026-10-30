// ============================================================================
// File: frontend/src/components/common/PriceTag/PriceTag.tsx
// Vai trò: Component định dạng tiền tệ VND đồng nhất với tabular numbers
// ============================================================================

import React from 'react';
import { formatVND } from '../../../utils/formatVND';

export interface PriceTagProps {
  amount: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  prefix?: string;
  suffix?: string;
}

export const PriceTag: React.FC<PriceTagProps> = ({
  amount,
  className = '',
  size = 'md',
  prefix,
  suffix,
}) => {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm font-semibold',
    lg: 'text-xl sm:text-2xl font-serif',
    xl: 'text-3xl sm:text-4xl font-serif',
  }[size];

  return (
    <span className={`tabular-nums text-[#0D0703] ${sizeClasses} ${className}`}>
      {prefix && <span className="mr-1">{prefix}</span>}
      {formatVND(amount)}
      {suffix && <span className="ml-1 text-xs text-[#7B6E64] font-normal">{suffix}</span>}
    </span>
  );
};
