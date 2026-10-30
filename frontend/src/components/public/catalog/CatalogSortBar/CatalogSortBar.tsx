import React from 'react';

export interface CatalogSortBarProps {
  loading: boolean;
  currentCount: number;
  totalCount: number;
  sortParam: string;
  onSortChange: (newSort: string) => void;
}

export const CatalogSortBar: React.FC<CatalogSortBarProps> = ({
  loading,
  currentCount,
  totalCount,
  sortParam,
  onSortChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D2C8BA]/40">
      <span className="font-sans text-xs uppercase tracking-widest text-[#7B6E64]">
        {loading ? (
          'Đang tra cứu kho lưu trữ...'
        ) : (
          <>
            Hiển thị <strong className="text-[#0D0703]">{currentCount}</strong> trên tổng số{' '}
            <strong className="text-[#0D0703]">{totalCount}</strong> tác phẩm
          </>
        )}
      </span>

      {/* Sort selector */}
      <div className="flex items-center gap-3">
        <label
          htmlFor="catalog-sort"
          className="font-sans text-xs uppercase tracking-wider text-[#7B6E64] whitespace-nowrap"
        >
          Sắp xếp theo:
        </label>
        <select
          id="catalog-sort"
          value={sortParam}
          onChange={(e) => onSortChange(e.target.value)}
          className="bg-[#FAF8F3] border border-[#D2C8BA] py-1.5 px-3 font-sans text-xs text-[#0D0703] rounded-[2px] focus:outline-none focus:border-[#0D0703] cursor-pointer"
        >
          <option value="newest">Mới nhất (Kỳ phát hành 2026)</option>
          <option value="price_asc">Giá: Thấp đến Cao</option>
          <option value="price_desc">Giá: Cao đến Thấp</option>
          <option value="rating">Đánh giá tuyển chọn cao nhất</option>
          <option value="name">Tên tác phẩm (A – Z)</option>
        </select>
      </div>
    </div>
  );
};
