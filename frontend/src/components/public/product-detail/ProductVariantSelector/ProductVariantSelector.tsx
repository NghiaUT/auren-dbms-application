import React from 'react';
import type { ProductDetail, Variant } from '../../../../types';
import { VariantPicker } from '../../../common/VariantPicker';

export interface ProductVariantSelectorProps {
  product: ProductDetail;
  selectedVariant: Variant;
  onSelectVariant: (v: Variant) => void;
}

export const ProductVariantSelector: React.FC<ProductVariantSelectorProps> = ({
  product,
  selectedVariant,
  onSelectVariant,
}) => {
  return (
    <div className="bg-[#F6F3ED] p-6 shadow-sm rounded-[2px] border border-[#D2C8BA]/40 space-y-6">
      <VariantPicker
        variants={product.variants}
        selectedVariant={selectedVariant}
        onSelect={onSelectVariant}
      />

      {/* Phân rã vật liệu của biến thể được chọn */}
      {selectedVariant.materials && selectedVariant.materials.length > 0 && (
        <div className="pt-4 border-t border-[#D2C8BA]/40 space-y-2">
          <span className="font-sans text-[10px] font-semibold text-[#0D0703] uppercase tracking-widest block">
            Phân bổ tỉ lệ chất liệu tự nhiên:
          </span>
          <div className="flex flex-wrap gap-2">
            {selectedVariant.materials.map((m) => {
              const portionVal = m.portion ?? m.pct;
              return (
                <span
                  key={m.materialId}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FCF9F3] border border-[#D2C8BA] font-sans text-[11px] text-[#372A22] rounded-[1px]"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A58548]" />
                  <strong>{m.name}</strong>
                  {portionVal !== null && portionVal !== undefined && (
                    <span className="text-[#7B6E64]">({portionVal}%)</span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
