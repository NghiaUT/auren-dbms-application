// ============================================================================
// File: frontend/src/components/ProductCard.tsx
// Vai trò: Thẻ sản phẩm kiến trúc theo chuẩn Stitch AUREN Design:
//          - Khung ảnh tỷ lệ cố định (ratio-4-5, ratio-3-4, ratio-1-1, etc.)
//          - Tiêu đề phong cách Editorial Serif (EB Garamond)
//          - Thông số chất liệu và giá tiền dạng số bảng (Tabular numerals)
//          - Đường kẻ chân hairline và liên kết chi tiết
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import type { ProductSummary } from '../types';
import { formatVND } from '../utils/formatVND';

export interface ProductCardProps {
  readonly product: ProductSummary;
  readonly className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, className = '' }) => {
  // Xác định tỷ lệ khung hình
  const ratioClass = {
    '4-5': 'ratio-4-5',
    '3-4': 'ratio-3-4',
    '1-1': 'ratio-1-1',
    '16-10': 'ratio-16-10',
    '16-9': 'ratio-16-9',
    '4-3': 'ratio-4-3',
  }[product.aspectRatio || '4-5'];

  return (
    <article className={`group flex flex-col justify-between ${className}`}>
      <div>
        {/* Khung ảnh tĩnh với hiệu ứng zoom vi mô khi hover */}
        <Link
          to={`/products/${product.id}`}
          className={`block w-full overflow-hidden bg-[#EAE4D9] rounded-[2px] ${ratioClass} relative`}
          tabIndex={-1}
          aria-hidden="true"
        >
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#7B6E64] text-xs uppercase tracking-widest font-sans">
              AUREN ARCHIVE
            </div>
          )}

          {product.isLimited && (
            <span className="absolute top-3 left-3 bg-[#271E18]/85 backdrop-blur-sm text-[#FAF8F3] font-sans text-[9px] uppercase tracking-[0.18em] px-2.5 py-1 rounded-[1px]">
              Limited Edition
            </span>
          )}
        </Link>

        {/* Thông tin sản phẩm */}
        <div className="mt-4 pt-3 border-t border-[#D2C8BA]/60 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-serif text-xl sm:text-2xl text-[#0D0703] group-hover:text-[#503625] transition-colors leading-tight truncate">
              <Link to={`/products/${product.id}`}>{product.name}</Link>
            </h3>
            {product.materialNote && (
              <p className="font-sans text-[11px] text-[#7B6E64] mt-1 line-clamp-1">
                {product.materialNote}
              </p>
            )}
          </div>

          <span className="font-sans text-[13px] font-semibold text-[#0D0703] tabular-nums whitespace-nowrap pt-0.5">
            {formatVND(product.minPrice)}
          </span>
        </div>
      </div>

      {/* Hành động */}
      <div className="mt-3">
        <Link to={`/products/${product.id}`} className="arrow-link text-[10px]">
          Xem chi tiết tác phẩm →
        </Link>
      </div>
    </article>
  );
};
