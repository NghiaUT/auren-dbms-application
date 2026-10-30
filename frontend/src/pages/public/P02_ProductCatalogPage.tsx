// ============================================================================
// File: frontend/src/pages/public/P02_ProductCatalogPage.tsx
// Mã màn hình: P02 | Route: /products | FR: FR2, FR3
// Vai trò: Danh sách sản phẩm — Cung cấp Sidebar bộ lọc đa điều kiện (danh mục,
//          thương hiệu, chất liệu, khoảng giá, bản giới hạn), ô tìm kiếm từ khoá,
//          tuỳ chọn sắp xếp và phân trang kết quả theo chuẩn Auren Architectural.
// Refactored: Container page composing modular components from components/public/catalog
// ============================================================================

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCatalogMetaApi, getProductsApi } from '../../api/catalog.api';
import type { CatalogMeta, PageMeta, ProductSummary } from '../../types';
import {
  CatalogHeader,
  CatalogFilterSidebar,
  CatalogSortBar,
  CatalogProductGrid,
  CatalogPagination,
} from '../../components/public/catalog';

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

  const selectedCategoryName = useMemo(() => {
    if (!selectedCategory || !meta) return undefined;
    return meta.categories.find((c) => c.id === selectedCategory)?.name;
  }, [selectedCategory, meta]);

  return (
    <div className="w-full pt-28 pb-20">
      {/* Breadcrumb & Section Eyebrow */}
      <CatalogHeader selectedCategoryName={selectedCategoryName} />

      {/* Catalog Main Layout (Sidebar Filters + Products Grid) */}
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* SIDEBAR BỘ LỌC (Desktop + Mobile Drawer) */}
          <CatalogFilterSidebar
            meta={meta}
            searchInput={searchInput}
            onSearchInputChange={setSearchInput}
            onSearchSubmit={() => updateQuery({ q: searchInput.trim() || undefined })}
            selectedCategory={selectedCategory}
            selectedBrands={selectedBrands}
            selectedMaterials={selectedMaterials}
            minPriceParam={minPriceParam}
            maxPriceParam={maxPriceParam}
            isLimitedParam={isLimitedParam}
            hasActiveFilters={hasActiveFilters}
            mobileFilterOpen={mobileFilterOpen}
            onCloseMobileFilter={() => setMobileFilterOpen(false)}
            onOpenMobileFilter={() => setMobileFilterOpen(true)}
            onSelectCategory={(categoryId) => updateQuery({ categoryId })}
            onToggleBrand={toggleBrand}
            onToggleMaterial={toggleMaterial}
            onPriceChange={(minPrice, maxPrice) => updateQuery({ minPrice, maxPrice })}
            onToggleLimited={(isLimited) => updateQuery({ isLimited: isLimited ? 'true' : undefined })}
            onResetFilters={resetFilters}
            totalCount={pageMeta.total}
            loading={loading}
          />

          {/* MAIN CATALOG GRID */}
          <div className="lg:col-span-9 space-y-8">
            {/* Header điều khiển: Tổng số & Tuỳ chọn sắp xếp */}
            <CatalogSortBar
              loading={loading}
              currentCount={products.length}
              totalCount={pageMeta.total}
              sortParam={sortParam}
              onSortChange={(sort) => updateQuery({ sort })}
            />

            {/* Lưới sản phẩm hoặc Skeleton Loading / Empty State */}
            <CatalogProductGrid
              loading={loading}
              products={products}
              onResetFilters={resetFilters}
            />

            {/* Pagination Controls */}
            <CatalogPagination
              pageMeta={pageMeta}
              onPageChange={(page) => updateQuery({ page })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default P02_ProductCatalogPage;
