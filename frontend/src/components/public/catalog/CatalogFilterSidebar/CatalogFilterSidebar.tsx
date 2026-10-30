import React from 'react';
import type { CatalogMeta, Category, Brand, Material } from '../../../../types';

export interface CatalogFilterSidebarProps {
  meta: CatalogMeta | null;
  searchInput: string;
  onSearchInputChange: (val: string) => void;
  onSearchSubmit: () => void;
  selectedCategory?: number;
  selectedBrands: number[];
  selectedMaterials: number[];
  minPriceParam?: number;
  maxPriceParam?: number;
  isLimitedParam: boolean;
  hasActiveFilters: boolean;
  mobileFilterOpen: boolean;
  onCloseMobileFilter: () => void;
  onOpenMobileFilter: () => void;
  onSelectCategory: (categoryId?: number) => void;
  onToggleBrand: (brandId: number) => void;
  onToggleMaterial: (materialId: number) => void;
  onPriceChange: (minPrice?: number, maxPrice?: number) => void;
  onToggleLimited: (isLimited: boolean) => void;
  onResetFilters: () => void;
  totalCount: number;
  loading: boolean;
}

export const CatalogFilterSidebar: React.FC<CatalogFilterSidebarProps> = ({
  meta,
  searchInput,
  onSearchInputChange,
  onSearchSubmit,
  selectedCategory,
  selectedBrands,
  selectedMaterials,
  minPriceParam,
  maxPriceParam,
  isLimitedParam,
  hasActiveFilters,
  mobileFilterOpen,
  onCloseMobileFilter,
  onOpenMobileFilter,
  onSelectCategory,
  onToggleBrand,
  onToggleMaterial,
  onPriceChange,
  onToggleLimited,
  onResetFilters,
  totalCount,
  loading,
}) => {
  return (
    <>
      {/* Nút bật bộ lọc trên Mobile */}
      <div className="lg:hidden flex items-center justify-between gap-4 py-3 border-y border-[#D2C8BA]/50 mb-6">
        <button
          type="button"
          onClick={onOpenMobileFilter}
          className="flex items-center gap-2 font-sans text-xs uppercase tracking-widest text-[#0D0703] py-2 px-4 bg-[#FAF8F3] border border-[#D2C8BA]"
        >
          <svg className="w-4 h-4 text-[#A7824B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span>Bộ lọc nâng cao</span>
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-[#A7824B]" />}
        </button>

        <span className="font-sans text-xs text-[#7B6E64]">
          {loading ? 'Đang cập nhật...' : `${totalCount} tác phẩm`}
        </span>
      </div>

      {/* Desktop Sidebar / Mobile Drawer Panel */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-full max-w-xs bg-[#FCF9F3] p-6 shadow-2xl overflow-y-auto transition-transform duration-300
          lg:static lg:z-auto lg:w-auto lg:max-w-none lg:p-0 lg:shadow-none lg:overflow-visible lg:translate-x-0 lg:col-span-3
          ${mobileFilterOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Mobile Drawer Header */}
        <div className="lg:hidden flex items-center justify-between pb-4 border-b border-[#D2C8BA]/60 mb-6">
          <span className="font-serif text-xl text-[#0D0703]">Bộ lọc tác phẩm</span>
          <button
            type="button"
            onClick={onCloseMobileFilter}
            className="p-1 text-[#7B6E64] hover:text-[#0D0703]"
            aria-label="Đóng bộ lọc"
          >
            ✕
          </button>
        </div>

        <div className="space-y-8 pr-0 lg:pr-6">
          {/* 1. Ô tìm kiếm từ khoá (Search) */}
          <div>
            <h4 className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0D0703] mb-3">
              Tìm kiếm tác phẩm
            </h4>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSearchSubmit();
              }}
              className="relative"
            >
              <input
                type="text"
                value={searchInput}
                onChange={(e) => onSearchInputChange(e.target.value)}
                placeholder="Tên, bộ sưu tập, nhà thiết kế..."
                className="w-full bg-[#FAF8F3] border border-[#D2C8BA] py-2.5 pl-3 pr-9 font-sans text-xs text-[#0D0703] placeholder:text-[#7B6E64]/60 focus:outline-none focus:border-[#0D0703] transition-colors rounded-[2px]"
              />
              <button
                type="submit"
                aria-label="Tìm kiếm"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7B6E64] hover:text-[#0D0703]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>

          {/* 2. Cây Danh mục (Categories) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0D0703]">
                Phân loại danh mục
              </h4>
              {selectedCategory && (
                <button
                  type="button"
                  onClick={() => onSelectCategory(undefined)}
                  className="text-[10px] text-[#A7824B] underline tracking-wider uppercase"
                >
                  Tất cả
                </button>
              )}
            </div>
            <ul className="space-y-1.5 font-sans text-xs">
              <li key="cat-all">
                <button
                  type="button"
                  onClick={() => onSelectCategory(undefined)}
                  className={`w-full text-left py-1 px-2 rounded-[2px] transition-colors ${
                    !selectedCategory
                      ? 'bg-[#FAF8F3] text-[#0D0703] font-semibold border-l-2 border-[#A7824B]'
                      : 'text-[#7B6E64] hover:text-[#0D0703]'
                  }`}
                >
                  Tất cả danh mục
                </button>
              </li>
              {meta?.categories
                .filter((c: Category) => c.parentId === null)
                .map((parent: Category) => {
                  const isParentActive = selectedCategory === parent.id;
                  const subcats = meta.categories.filter((c: Category) => c.parentId === parent.id);
                  return (
                    <li key={parent.id} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => onSelectCategory(parent.id)}
                        className={`w-full text-left py-1 px-2 rounded-[2px] transition-colors ${
                          isParentActive
                            ? 'bg-[#FAF8F3] text-[#0D0703] font-semibold border-l-2 border-[#A7824B]'
                            : 'text-[#372A22] hover:text-[#0D0703]'
                        }`}
                      >
                        {parent.name}
                      </button>
                      {subcats.length > 0 && (
                        <ul className="pl-4 space-y-1 border-l border-[#D2C8BA]/40 ml-2">
                          {subcats.map((sub: Category) => {
                            const isSubActive = selectedCategory === sub.id;
                            return (
                              <li key={sub.id}>
                                <button
                                  type="button"
                                  onClick={() => onSelectCategory(sub.id)}
                                  className={`w-full text-left py-0.5 px-2 text-[11px] transition-colors ${
                                    isSubActive
                                      ? 'text-[#A7824B] font-semibold'
                                      : 'text-[#7B6E64] hover:text-[#0D0703]'
                                  }`}
                                >
                                  • {sub.name}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
            </ul>
          </div>

          {/* 3. Khoảng giá (Price Range) */}
          <div className="pt-4 border-t border-[#D2C8BA]/40">
            <h4 className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0D0703] mb-3">
              Khoảng giá (VND)
            </h4>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#7B6E64] uppercase block mb-1">Từ</label>
                  <input
                    type="number"
                    step={5000000}
                    placeholder={meta?.priceRange ? String(meta.priceRange.min) : '0'}
                    value={minPriceParam || ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : undefined;
                      onPriceChange(val, maxPriceParam);
                    }}
                    className="w-full bg-[#FAF8F3] border border-[#D2C8BA] p-2 text-xs text-[#0D0703] focus:outline-none focus:border-[#0D0703] tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#7B6E64] uppercase block mb-1">Đến</label>
                  <input
                    type="number"
                    step={5000000}
                    placeholder={meta?.priceRange ? String(meta.priceRange.max) : '600000000'}
                    value={maxPriceParam || ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : undefined;
                      onPriceChange(minPriceParam, val);
                    }}
                    className="w-full bg-[#FAF8F3] border border-[#D2C8BA] p-2 text-xs text-[#0D0703] focus:outline-none focus:border-[#0D0703] tabular-nums"
                  />
                </div>
              </div>

              {/* Quick Price Tier Shortcuts */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                <button
                  type="button"
                  onClick={() => onPriceChange(undefined, 50000000)}
                  className="text-[10px] uppercase tracking-wider px-2 py-1 bg-[#FAF8F3] border border-[#D2C8BA] hover:border-[#0D0703] text-[#7B6E64]"
                >
                  &lt; 50 triệu
                </button>
                <button
                  type="button"
                  onClick={() => onPriceChange(50000000, 150000000)}
                  className="text-[10px] uppercase tracking-wider px-2 py-1 bg-[#FAF8F3] border border-[#D2C8BA] hover:border-[#0D0703] text-[#7B6E64]"
                >
                  50 – 150 triệu
                </button>
                <button
                  type="button"
                  onClick={() => onPriceChange(150000000, undefined)}
                  className="text-[10px] uppercase tracking-wider px-2 py-1 bg-[#FAF8F3] border border-[#D2C8BA] hover:border-[#0D0703] text-[#7B6E64]"
                >
                  &gt; 150 triệu
                </button>
              </div>
            </div>
          </div>

          {/* 4. Thương hiệu thiết kế (Brands) */}
          <div className="pt-4 border-t border-[#D2C8BA]/40">
            <h4 className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0D0703] mb-3">
              Thương hiệu Atelier
            </h4>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {meta?.brands.map((b: Brand) => {
                const checked = selectedBrands.includes(b.id);
                return (
                  <label
                    key={b.id}
                    className="flex items-center gap-2.5 text-xs text-[#372A22] cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleBrand(b.id)}
                      className="rounded-[1px] border-[#D2C8BA] text-[#271E18] focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5 accent-[#271E18]"
                    />
                    <span className={`group-hover:text-[#0D0703] ${checked ? 'font-medium text-[#0D0703]' : ''}`}>
                      {b.name}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 5. Chất liệu đặc trưng (Materials) */}
          <div className="pt-4 border-t border-[#D2C8BA]/40">
            <h4 className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0D0703] mb-3">
              Chất liệu bề mặt
            </h4>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {meta?.materials.map((m: Material) => {
                const checked = selectedMaterials.includes(m.id);
                return (
                  <label
                    key={m.id}
                    className="flex items-center gap-2.5 text-xs text-[#372A22] cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleMaterial(m.id)}
                      className="rounded-[1px] border-[#D2C8BA] text-[#271E18] focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5 accent-[#271E18]"
                    />
                    <span className={`group-hover:text-[#0D0703] ${checked ? 'font-medium text-[#0D0703]' : ''}`}>
                      {m.name}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 6. Bản giới hạn (Limited Edition) */}
          <div className="pt-4 border-t border-[#D2C8BA]/40">
            <label className="flex items-center gap-2.5 text-xs text-[#0D0703] cursor-pointer group select-none">
              <input
                type="checkbox"
                checked={isLimitedParam}
                onChange={(e) => onToggleLimited(e.target.checked)}
                className="rounded-[1px] border-[#D2C8BA] text-[#271E18] focus:ring-0 focus:ring-offset-0 h-4 w-4 accent-[#271E18]"
              />
              <span className="font-medium group-hover:text-[#A7824B] transition-colors">
                Chỉ hiển thị Phiên bản giới hạn (Limited)
              </span>
            </label>
          </div>

          {/* 7. Xóa toàn bộ bộ lọc */}
          {hasActiveFilters && (
            <div className="pt-4 border-t border-[#D2C8BA]/40">
              <button
                type="button"
                onClick={onResetFilters}
                className="w-full py-2.5 px-4 bg-[#EAE4D9] hover:bg-[#D2C8BA] text-[#0D0703] font-sans text-xs uppercase tracking-widest transition-colors rounded-[2px]"
              >
                Xóa toàn bộ bộ lọc
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile overlay backdrop */}
      {mobileFilterOpen && (
        <div
          onClick={onCloseMobileFilter}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        />
      )}
    </>
  );
};
