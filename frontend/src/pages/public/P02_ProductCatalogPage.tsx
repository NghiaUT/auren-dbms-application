// ============================================================================
// File: frontend/src/pages/public/P02_ProductCatalogPage.tsx
// Mã màn hình: P02 | Route: /products | FR: FR2, FR3
// Vai trò: Danh sách sản phẩm — Cung cấp Sidebar bộ lọc đa điều kiện (danh mục,
//          thương hiệu, chất liệu, khoảng giá, bản giới hạn), ô tìm kiếm từ khoá,
//          tuỳ chọn sắp xếp và phân trang kết quả theo chuẩn Auren Architectural.
// ============================================================================

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ProductCard } from '../../components/ProductCard';
import { getCatalogMetaApi, getProductsApi } from '../../api/catalog.api';
import type { CatalogMeta, PageMeta, ProductSummary } from '../../types';
import { formatVND } from '../../utils/formatVND';

export const P02_ProductCatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Dữ liệu tham chiếu bộ lọc
  const [meta, setMeta] = useState<CatalogMeta | null>(null);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [pageMeta, setPageMeta] = useState<PageMeta>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);

  // Đọc params từ URL
  const searchKeyword = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined;
  const selectedBrands = useMemo(() => {
    const b = searchParams.get('brandId');
    return b ? b.split(',').map(Number).filter((n) => !isNaN(n)) : [];
  }, [searchParams]);
  const selectedMaterials = useMemo(() => {
    const m = searchParams.get('materialId');
    return m ? m.split(',').map(Number).filter((n) => !isNaN(n)) : [];
  }, [searchParams]);
  const minPriceParam = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPriceParam = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const isLimitedParam = searchParams.get('isLimited') === 'true';
  const sortParam = (searchParams.get('sort') || 'newest') as any;
  const currentPage = Number(searchParams.get('page')) || 1;

  // Local state cho ô tìm kiếm
  const [searchInput, setSearchInput] = useState(searchKeyword);

  // Tải dữ liệu tham chiếu (Catalog Meta)
  useEffect(() => {
    let isMounted = true;
    getCatalogMetaApi()
      .then((data) => {
        if (isMounted) setMeta(data);
      })
      .catch((err) => {
        console.error('Không thể tải siêu dữ liệu bộ lọc:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Tải danh sách sản phẩm khi URL searchParams thay đổi
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getProductsApi({
        page: currentPage,
        limit: 12,
        q: searchKeyword || undefined,
        categoryId: selectedCategory,
        brandId: selectedBrands.length > 0 ? selectedBrands : undefined,
        materialId: selectedMaterials.length > 0 ? selectedMaterials : undefined,
        minPrice: minPriceParam,
        maxPrice: maxPriceParam,
        isLimited: isLimitedParam ? true : undefined,
        sort: sortParam,
      });
      setProducts(response.data);
      setPageMeta(response.meta);
    } catch (err) {
      console.error('Lỗi khi tải danh sách sản phẩm:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    searchKeyword,
    selectedCategory,
    selectedBrands,
    selectedMaterials,
    minPriceParam,
    maxPriceParam,
    isLimitedParam,
    sortParam,
  ]);

  useEffect(() => {
    fetchProducts();
    // Cuộn lên đầu trang nhẹ nhàng khi đổi trang
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchProducts]);

  // Cập nhật URL helper
  const updateQuery = (updates: Record<string, string | number | undefined | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') {
        next.delete(k);
      } else {
        next.set(k, String(v));
      }
    });
    // Khi thay đổi bộ lọc thì reset về trang 1 (ngoại trừ khi update chính param 'page')
    if (!('page' in updates)) {
      next.delete('page');
    }
    setSearchParams(next);
  };

  // Toggle brand trong bộ lọc
  const toggleBrand = (brandId: number) => {
    const nextBrands = selectedBrands.includes(brandId)
      ? selectedBrands.filter((id) => id !== brandId)
      : [...selectedBrands, brandId];
    updateQuery({ brandId: nextBrands.length > 0 ? nextBrands.join(',') : undefined });
  };

  // Toggle material trong bộ lọc
  const toggleMaterial = (materialId: number) => {
    const nextMats = selectedMaterials.includes(materialId)
      ? selectedMaterials.filter((id) => id !== materialId)
      : [...selectedMaterials, materialId];
    updateQuery({ materialId: nextMats.length > 0 ? nextMats.join(',') : undefined });
  };

  // Xóa toàn bộ bộ lọc
  const resetFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = Boolean(
    searchKeyword ||
      selectedCategory ||
      selectedBrands.length > 0 ||
      selectedMaterials.length > 0 ||
      minPriceParam !== undefined ||
      maxPriceParam !== undefined ||
      isLimitedParam
  );

  return (
    <div className="w-full pt-28 pb-20">
      {/* Breadcrumb & Section Eyebrow */}
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16 pt-4 pb-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#7B6E64] mb-4">
            <Link to="/" className="hover:text-[#0D0703] transition-colors">Trang chủ</Link>
            <span className="text-[#D2C8BA]">/</span>
            <span className="text-[#0D0703] font-medium">Lưu trữ tác phẩm (Catalog)</span>
            {selectedCategory && meta && (
              <>
                <span className="text-[#D2C8BA]">/</span>
                <span className="text-[#A7824B]">
                  {meta.categories.find((c) => c.id === selectedCategory)?.name}
                </span>
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

        {/* Catalog Main Layout (Sidebar Filters + Products Grid) */}
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* ============================================================ */}
            {/* SIDEBAR BỘ LỌC (Desktop + Mobile Drawer)                     */}
            {/* ============================================================ */}
            
            {/* Nút bật bộ lọc trên Mobile */}
            <div className="lg:hidden flex items-center justify-between gap-4 py-3 border-y border-[#D2C8BA]/50">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className="flex items-center gap-2 font-sans text-xs uppercase tracking-widest text-[#0D0703] py-2 px-4 bg-[#FAF8F3] border border-[#D2C8BA]"
              >
                <svg className="w-4 h-4 text-[#A7824B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>Bộ lọc nâng cao</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-[#A7824B]"></span>
                )}
              </button>

              <span className="font-sans text-xs text-[#7B6E64]">
                {loading ? 'Đang cập nhật...' : `${pageMeta.total} tác phẩm`}
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
                  onClick={() => setMobileFilterOpen(false)}
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
                      updateQuery({ q: searchInput.trim() || undefined });
                    }}
                    className="relative"
                  >
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
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
                        onClick={() => updateQuery({ categoryId: undefined })}
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
                        onClick={() => updateQuery({ categoryId: undefined })}
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
                      .filter((c) => c.parentId === null)
                      .map((parent) => {
                        const isParentActive = selectedCategory === parent.id;
                        const subcats = meta.categories.filter((c) => c.parentId === parent.id);
                        return (
                          <li key={parent.id} className="space-y-1">
                            <button
                              type="button"
                              onClick={() => updateQuery({ categoryId: parent.id })}
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
                                {subcats.map((sub) => {
                                  const isSubActive = selectedCategory === sub.id;
                                  return (
                                    <li key={sub.id}>
                                      <button
                                        type="button"
                                        onClick={() => updateQuery({ categoryId: sub.id })}
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
                            updateQuery({ minPrice: val });
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
                            updateQuery({ maxPrice: val });
                          }}
                          className="w-full bg-[#FAF8F3] border border-[#D2C8BA] p-2 text-xs text-[#0D0703] focus:outline-none focus:border-[#0D0703] tabular-nums"
                        />
                      </div>
                    </div>

                    {/* Quick Price Tier Shortcuts */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      <button
                        type="button"
                        onClick={() => updateQuery({ minPrice: undefined, maxPrice: 50000000 })}
                        className="text-[10px] uppercase tracking-wider px-2 py-1 bg-[#FAF8F3] border border-[#D2C8BA] hover:border-[#0D0703] text-[#7B6E64]"
                      >
                        &lt; 50 triệu
                      </button>
                      <button
                        type="button"
                        onClick={() => updateQuery({ minPrice: 50000000, maxPrice: 150000000 })}
                        className="text-[10px] uppercase tracking-wider px-2 py-1 bg-[#FAF8F3] border border-[#D2C8BA] hover:border-[#0D0703] text-[#7B6E64]"
                      >
                        50 – 150 triệu
                      </button>
                      <button
                        type="button"
                        onClick={() => updateQuery({ minPrice: 150000000, maxPrice: undefined })}
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
                    {meta?.brands.map((b) => {
                      const checked = selectedBrands.includes(b.id);
                      return (
                        <label
                          key={b.id}
                          className="flex items-center gap-2.5 text-xs text-[#372A22] cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleBrand(b.id)}
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
                    {meta?.materials.map((m) => {
                      const checked = selectedMaterials.includes(m.id);
                      return (
                        <label
                          key={m.id}
                          className="flex items-center gap-2.5 text-xs text-[#372A22] cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleMaterial(m.id)}
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
                      onChange={(e) => updateQuery({ isLimited: e.target.checked ? 'true' : undefined })}
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
                      onClick={resetFilters}
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
                onClick={() => setMobileFilterOpen(false)}
                className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              />
            )}

            {/* ============================================================ */}
            {/* MAIN CATALOG GRID                                            */}
            {/* ============================================================ */}
            <div className="lg:col-span-9 space-y-8">
              {/* Header điều khiển: Tổng số & Tuỳ chọn sắp xếp */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D2C8BA]/40">
                <span className="font-sans text-xs uppercase tracking-widest text-[#7B6E64]">
                  {loading ? (
                    'Đang tra cứu kho lưu trữ...'
                  ) : (
                    <>
                      Hiển thị <strong className="text-[#0D0703]">{products.length}</strong> trên tổng số{' '}
                      <strong className="text-[#0D0703]">{pageMeta.total}</strong> tác phẩm
                    </>
                  )}
                </span>

                {/* Sort selector */}
                <div className="flex items-center gap-3">
                  <label htmlFor="catalog-sort" className="font-sans text-xs uppercase tracking-wider text-[#7B6E64] whitespace-nowrap">
                    Sắp xếp theo:
                  </label>
                  <select
                    id="catalog-sort"
                    value={sortParam}
                    onChange={(e) => updateQuery({ sort: e.target.value })}
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

              {/* Lưới sản phẩm hoặc Skeleton Loading */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div key={idx} className="space-y-4 animate-pulse">
                      <div className="w-full aspect-[4/5] bg-[#EAE4D9] rounded-[2px]"></div>
                      <div className="h-5 bg-[#EAE4D9] rounded w-3/4"></div>
                      <div className="h-4 bg-[#EAE4D9] rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                /* Empty State */
                <div className="text-center py-20 px-6 bg-[#FAF8F3] border border-[#D2C8BA]/60 rounded-[2px] space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#EAE4D9] flex items-center justify-center text-[#7B6E64]">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="font-serif text-2xl text-[#0D0703]">Không tìm thấy tác phẩm phù hợp</h3>
                  <p className="font-sans text-xs text-[#7B6E64] max-w-md mx-auto leading-relaxed">
                    Không có sản phẩm nào khớp với điều kiện lọc hiện tại. Quý khách vui lòng thử tìm kiếm với từ khoá khác hoặc đặt lại bộ lọc.
                  </p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-4 px-6 py-2.5 bg-[#271E18] text-[#FAF8F3] font-sans text-xs uppercase tracking-widest hover:bg-[#0D0703] transition-colors rounded-[2px]"
                  >
                    Khôi phục tất cả bộ lọc
                  </button>
                </div>
              )}

              {/* ============================================================ */}
              {/* PAGINATION                                                   */}
              {/* ============================================================ */}
              {pageMeta.totalPages > 1 && (
                <div className="pt-8 border-t border-[#D2C8BA]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="font-sans text-xs text-[#7B6E64]">
                    Trang {pageMeta.page} / {pageMeta.totalPages} ({pageMeta.total} tác phẩm)
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Previous Button */}
                    <button
                      type="button"
                      disabled={pageMeta.page <= 1}
                      onClick={() => updateQuery({ page: pageMeta.page - 1 })}
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
                          onClick={() => updateQuery({ page: pageNum })}
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
                      onClick={() => updateQuery({ page: pageMeta.page + 1 })}
                      className="px-3 py-1.5 border border-[#D2C8BA] font-sans text-xs uppercase tracking-wider text-[#0D0703] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#FAF8F3] transition-colors rounded-[2px]"
                    >
                      Sau →
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
    </div>
  );
};
export default P02_ProductCatalogPage;
