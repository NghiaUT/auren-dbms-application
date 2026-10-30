// ============================================================================
// File: frontend/src/components/common/VariantPicker/VariantPicker.tsx
// Vai trò: Bộ chọn biến thể tác phẩm (Finish, Size, Kích thước, Màu sắc):
//          - Hiển thị danh sách các tuỳ chọn biến thể của tác phẩm nội thất
//          - Hiển thị chênh lệch giá, số lượng bản đánh số còn lại (nếu có)
//          - Hỗ trợ đổi trạng thái mượt mà theo chuẩn Auren Architectural
// ============================================================================

import React from 'react';
import type { Variant } from '../../../types';
import { formatVND } from '../../../utils/formatVND';

export interface VariantPickerProps {
  readonly variants: Variant[];
  readonly selectedVariant: Variant;
  readonly onSelect: (variant: Variant) => void;
}

export const VariantPicker: React.FC<VariantPickerProps> = ({
  variants,
  selectedVariant,
  onSelect,
}) => {
  if (!variants || variants.length === 0) {
    return null;
  }

  // Nếu chỉ có 1 biến thể duy nhất, hiển thị tóm tắt gọn
  if (variants.length === 1) {
    const single = variants[0];
    return (
      <div className="bg-[#FAF8F3] border border-[#D2C8BA]/60 p-4 rounded-[2px] space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-sans uppercase tracking-widest text-[#7B6E64]">Biến thể tiêu chuẩn</span>
          <span className="font-mono text-[11px] text-[#A7824B]">SKU: {single.sku}</span>
        </div>
        <p className="font-sans text-sm font-medium text-[#0D0703]">
          {single.finish} {single.size ? `• ${single.size}` : ''}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0D0703]">
          Quy cách hoàn thiện &amp; Biến thể
        </label>
        <span className="font-sans text-xs text-[#7B6E64]">
          Đang chọn: <strong className="text-[#0D0703]">{selectedVariant.finish} ({selectedVariant.size})</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {variants.map((variant) => {
          const isSelected = variant.id === selectedVariant.id;
          const priceDiff = variant.price - variants[0].price;

          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => onSelect(variant)}
              className={`
                relative p-3.5 text-left transition-all duration-200 rounded-[2px] flex flex-col justify-between
                ${
                  isSelected
                    ? 'bg-[#FAF8F3] border-2 border-[#0D0703] shadow-sm'
                    : 'bg-[#FCF9F3] border border-[#D2C8BA] hover:border-[#0D0703]/60'
                }
              `}
            >
              {/* Active selection dot */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#A7824B]" />
              )}

              <div>
                <p className="font-serif text-base font-medium text-[#0D0703] leading-snug">
                  {variant.finish}
                </p>
                <p className="font-sans text-[11px] text-[#7B6E64] mt-0.5">
                  Kích thước: {variant.size}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-[#D2C8BA]/40 flex items-baseline justify-between gap-2">
                <span className="font-sans text-xs font-semibold text-[#0D0703] tabular-nums">
                  {formatVND(variant.price)}
                </span>

                {variant.leadTimeDays > 0 && (
                  <span className="font-sans text-[10px] text-[#7B6E64]">
                    {variant.leadTimeDays} ngày hoàn thiện
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
export default VariantPicker;
