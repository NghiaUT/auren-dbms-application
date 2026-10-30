import React from 'react';
import type { PageMeta } from '../../../../types';

export interface CatalogPaginationProps {
  pageMeta: PageMeta;
  onPageChange: (newPage: number) => void;
}

export const CatalogPagination: React.FC<CatalogPaginationProps> = ({
  pageMeta,
  onPageChange,
}) => {
  if (pageMeta.totalPages <= 1) return null;

  return (
    <div className="pt-8 border-t border-[#D2C8BA]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
      <span className="font-sans text-xs text-[#7B6E64]">
        Trang {pageMeta.page} / {pageMeta.totalPages} ({pageMeta.total} tác phẩm)
      </span>

      <div className="flex items-center gap-1.5">
        {/* Previous Button */}
        <button
          type="button"
          disabled={pageMeta.page <= 1}
          onClick={() => onPageChange(pageMeta.page - 1)}
          className="px-3 py-1.5 border border-[#D2C8BA] font-sans text-xs uppercase tracking-wider text-[#0D0703] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#FAF8F3] transition-colors rounded-[2px]"
        >
          ← Trước
        </button>

        {/* Page Numbers */}
        {Array.from({ length: pageMeta.totalPages }, (_, i) => i + 1).map((pageNum) => {
          const isActive = pageNum === pageMeta.page;
          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={`w-8 h-8 font-sans text-xs rounded-[2px] transition-colors ${
                isActive
                  ? 'bg-[#271E18] text-[#FAF8F3] font-semibold'
                  : 'border border-[#D2C8BA] text-[#0D0703] hover:bg-[#FAF8F3]'
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          type="button"
          disabled={pageMeta.page >= pageMeta.totalPages}
          onClick={() => onPageChange(pageMeta.page + 1)}
          className="px-3 py-1.5 border border-[#D2C8BA] font-sans text-xs uppercase tracking-wider text-[#0D0703] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#FAF8F3] transition-colors rounded-[2px]"
        >
          Sau →
        </button>
      </div>
    </div>
  );
};
