import React from 'react';
import { Plus, Search, RefreshCw } from 'lucide-react';
import type { CatalogMeta } from '../../../../types';

export interface ProductManagementFilterProps {
  search: string;
  onSearchChange: (val: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  selectedCategory?: number;
  onSelectCategory: (catId?: number) => void;
  meta: CatalogMeta | null;
  onRefresh: () => void;
  onOpenCreateModal: () => void;
  loading: boolean;
}

export const ProductManagementFilter: React.FC<ProductManagementFilterProps> = ({
  search,
  onSearchChange,
  onSearchSubmit,
  selectedCategory,
  onSelectCategory,
  meta,
  onRefresh,
  onOpenCreateModal,
  loading,
}) => {
  return (
    <>
      {/* Tiêu đề & Hành động */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A7824B] font-bold">
            [FR14] Catalog Administration
          </span>
          <h2 className="font-serif text-3xl text-[#0D0703] font-medium tracking-tight mt-1">
            Quản lý Danh mục Sản phẩm Kiến trúc
          </h2>
          <p className="font-sans text-xs text-[#7B6E64] mt-0.5">
            Quản lý thông tin định danh sản phẩm, gán thương hiệu Atelier và chuyển hướng sang cấu hình biến thể.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs uppercase tracking-wider font-semibold border border-[#D2C8BA] bg-[#FAF8F3] hover:bg-white rounded-[2px] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>

          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs uppercase tracking-wider font-semibold bg-[#0D0703] text-white rounded-[2px] hover:bg-[#271E18] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Sản phẩm mới</span>
          </button>
        </div>
      </div>

      {/* Thanh tìm kiếm & Bộ lọc */}
      <div className="p-4 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={onSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#7B6E64] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên sản phẩm, bộ sưu tập..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] text-xs focus:outline-none focus:border-[#0D0703]"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-[#503625] text-white text-xs font-semibold uppercase tracking-wider rounded-[2px] hover:bg-[#271E18]"
          >
            Tìm
          </button>
        </form>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#7B6E64]">Lọc danh mục:</span>
          <select
            value={selectedCategory || ''}
            onChange={(e) => onSelectCategory(e.target.value ? Number(e.target.value) : undefined)}
            className="px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] focus:outline-none focus:border-[#0D0703]"
          >
            <option value="">Tất cả danh mục</option>
            {meta?.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
};
