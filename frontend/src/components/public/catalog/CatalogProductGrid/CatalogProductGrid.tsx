import React from 'react';
import { ProductCard } from '../../../common/ProductCard';
import type { ProductSummary } from '../../../../types';

export interface CatalogProductGridProps {
  loading: boolean;
  products: ProductSummary[];
  onResetFilters: () => void;
}

export const CatalogProductGrid: React.FC<CatalogProductGridProps> = ({
  loading,
  products,
  onResetFilters,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="space-y-4 animate-pulse">
            <div className="w-full aspect-[4/5] bg-[#EAE4D9] rounded-[2px]" />
            <div className="h-5 bg-[#EAE4D9] rounded w-3/4" />
            <div className="h-4 bg-[#EAE4D9] rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length > 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    );
  }

  return (
    <div className="text-center py-20 px-6 bg-[#FAF8F3] border border-[#D2C8BA]/60 rounded-[2px] space-y-4">
      <div className="w-12 h-12 mx-auto rounded-full bg-[#EAE4D9] flex items-center justify-center text-[#7B6E64]">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      </div>
      <h3 className="font-serif text-2xl text-[#0D0703]">Không tìm thấy tác phẩm phù hợp</h3>
      <p className="font-sans text-xs text-[#7B6E64] max-w-md mx-auto leading-relaxed">
        Không có sản phẩm nào khớp với điều kiện lọc hiện tại. Quý khách vui lòng thử tìm kiếm với từ khoá khác hoặc đặt lại bộ lọc.
      </p>
      <button
        type="button"
        onClick={onResetFilters}
        className="mt-4 px-6 py-2.5 bg-[#271E18] text-[#FAF8F3] font-sans text-xs uppercase tracking-widest hover:bg-[#0D0703] transition-colors rounded-[2px]"
      >
        Khôi phục tất cả bộ lọc
      </button>
    </div>
  );
};
