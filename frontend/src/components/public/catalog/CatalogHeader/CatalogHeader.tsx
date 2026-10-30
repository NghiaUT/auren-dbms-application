import React from 'react';
import { Link } from 'react-router-dom';

export interface CatalogHeaderProps {
  selectedCategoryName?: string;
}

export const CatalogHeader: React.FC<CatalogHeaderProps> = ({ selectedCategoryName }) => {
  return (
    <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16 pt-4 pb-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#7B6E64] mb-4">
        <Link to="/" className="hover:text-[#0D0703] transition-colors">
          Trang chủ
        </Link>
        <span className="text-[#D2C8BA]">/</span>
        <span className="text-[#0D0703] font-medium">Lưu trữ tác phẩm (Catalog)</span>
        {selectedCategoryName && (
          <>
            <span className="text-[#D2C8BA]">/</span>
            <span className="text-[#A7824B]">{selectedCategoryName}</span>
          </>
        )}
      </nav>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#D2C8BA]/40 pb-8">
        <div>
          <span className="font-sans text-[10px] font-semibold tracking-[0.25em] text-[#A7824B] uppercase block mb-2">
            Archival Collection // 2026 Edition
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#0D0703] tracking-tight font-normal">
            Tuyển Tập Tác Phẩm
          </h1>
        </div>
        <p className="font-sans text-xs sm:text-sm text-[#7B6E64] max-w-md leading-relaxed">
          Các thiết kế nội thất trường tồn, kết tinh từ cấu trúc mộng gỗ thủ công, da thuộc thảo mộc và đá cẩm thạch tự nhiên.
        </p>
      </div>
    </div>
  );
};
