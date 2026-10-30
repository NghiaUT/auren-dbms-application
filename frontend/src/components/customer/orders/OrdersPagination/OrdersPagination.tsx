import React from 'react';

export interface OrdersPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

export const OrdersPagination: React.FC<OrdersPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="pt-6 flex justify-center items-center gap-2">
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="px-3 py-1 border border-[#D2C8BA] font-sans text-xs uppercase disabled:opacity-30 rounded-[2px]"
      >
        ← Trước
      </button>
      <span className="font-sans text-xs text-[#7B6E64] px-2">
        Trang {currentPage} / {totalPages}
      </span>
      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="px-3 py-1 border border-[#D2C8BA] font-sans text-xs uppercase disabled:opacity-30 rounded-[2px]"
      >
        Sau →
      </button>
    </div>
  );
};
