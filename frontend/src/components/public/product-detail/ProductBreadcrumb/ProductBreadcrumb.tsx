import React from 'react';
import { Link } from 'react-router-dom';
import type { ProductDetail, Variant } from '../../../../types';

export interface ProductBreadcrumbProps {
  product: ProductDetail;
  selectedVariant: Variant | null;
}

export const ProductBreadcrumb: React.FC<ProductBreadcrumbProps> = ({
  product,
  selectedVariant,
}) => {
  return (
    <section className="w-full bg-[#F6F3ED] py-4 border-b border-[#D2C8BA]/30">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16 flex flex-wrap items-center justify-between gap-y-2">
        <nav aria-label="Breadcrumb" className="flex items-center gap-3">
          <Link
            to="/products"
            className="font-sans text-[11px] text-[#7B6E64] hover:text-[#0D0703] transition-colors tracking-widest uppercase"
          >
            Bộ sưu tập
          </Link>
          <span className="text-[#7B6E64]/40 font-serif text-xs">/</span>
          <span className="font-sans text-[11px] text-[#7B6E64] uppercase tracking-widest">
            {product.category?.name || 'Nội thất'}
          </span>
          <span className="text-[#7B6E64]/40 font-serif text-xs">/</span>
          <span className="font-sans text-[11px] text-[#0D0703] font-semibold tracking-widest uppercase truncate max-w-xs">
            {product.name}
          </span>
        </nav>

        <div className="hidden sm:flex items-center gap-4 text-[#7B6E64]">
          {selectedVariant && (
            <span className="font-mono text-[11px] uppercase tracking-[0.2em]">
              Ref. {selectedVariant.sku}
            </span>
          )}
          <span className="w-1.5 h-1.5 rounded-full bg-[#A58548]" />
          <span className="font-sans text-[11px] uppercase tracking-[0.16em] text-[#4E4540]">
            {product.brand?.name} Atelier
          </span>
        </div>
      </div>
    </section>
  );
};
