import React from 'react';
import type { ProductDetail, Variant } from '../../../../types';
import { formatVND } from '../../../../utils/formatVND';

export interface ProductHeaderProps {
  product: ProductDetail;
  selectedVariant: Variant | null;
}

export const ProductHeader: React.FC<ProductHeaderProps> = ({
  product,
  selectedVariant,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-sans text-[10px] font-semibold text-[#A58548] uppercase tracking-[0.2em]">
          {product.collectionName ? `${product.collectionName} • ` : ''}Kỳ phát hành 2026
        </span>
        {product.isLimited && (
          <span className="bg-[#EAE4D9] px-2.5 py-1 text-[#4E4540] font-sans text-[10px] tracking-wider uppercase rounded-[1px]">
            Bản Đánh Số Giới Hạn
          </span>
        )}
      </div>

      <h1 className="font-serif text-4xl sm:text-5xl text-[#0D0703] tracking-tight font-normal leading-tight">
        {product.name}
      </h1>

      {product.designerName && (
        <p className="font-sans text-xs text-[#7B6E64] uppercase tracking-wider">
          Thiết kế bởi: <strong className="text-[#0D0703]">{product.designerName}</strong>
        </p>
      )}

      <div className="flex items-baseline gap-4 pt-2">
        <span className="font-serif text-3xl sm:text-4xl text-[#0D0703] font-normal tabular-nums">
          {selectedVariant
            ? formatVND(selectedVariant.price)
            : formatVND(product.variants?.[0]?.price ?? product.minPrice ?? 0)}
        </span>
        <span className="font-sans text-[10px] text-[#7B6E64] uppercase tracking-wider">
          Đã bao gồm thuế • Lắp đặt White-Glove
        </span>
      </div>

      <p className="font-sans text-xs sm:text-sm text-[#4E4540] pt-2 leading-relaxed">
        {product.description}
      </p>
    </div>
  );
};
