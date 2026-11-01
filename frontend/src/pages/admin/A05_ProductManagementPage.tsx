// ============================================================================
// File: frontend/src/pages/admin/A05_ProductManagementPage.tsx
// Mã màn hình: A05 | Route: /admin/products | FR: FR14
// Vai trò: Quản lý Danh mục Sản phẩm — Danh sách sản phẩm, tạo mới, chỉnh sửa,
//          chuyển hướng sang cấu hình biến thể (A06) và xóa an toàn.
// Refactored: Container page composing modular components from components/admin/product-management
// ============================================================================

import React, { useEffect, useState } from 'react';
import { AlertCircle, X, Check } from 'lucide-react';
import { AdminLayout } from '../../layouts/AdminLayout';
import {
  getAdminProductsApi,
  createProductApi,
  updateProductApi,
  deleteProductApi,
  getCatalogMetaApi,
} from '../../api/admin.api';
import type { CatalogMeta, ProductSummary, CreateProductInput, PageMeta } from '../../types';
import {
  ProductManagementFilter,
  ProductManagementTable,
  ProductEditModal,
} from '../../components/admin/product-management';
import { useToast } from '../../context/ToastContext';

export const A05_ProductManagementPage: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [pageMeta, setPageMeta] = useState<PageMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [meta, setMeta] = useState<CatalogMeta | null>(null);
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<ProductSummary | null>(null);
  const [formData, setFormData] = useState<CreateProductInput>({
    brandId: 1,
    categoryId: 1,
    name: '',
    description: '',
    collectionName: '',
    designerName: '',
    isLimited: false,
    isMadeToOrder: false,
  });
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchProducts = async (targetPage = pageMeta.page) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminProductsApi({
        q: search || undefined,
        categoryId: selectedCategory,
        page: targetPage,
        limit: 20,
      });
      setProducts(res.data);
      if (res.meta) {
        setPageMeta(res.meta);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const fetchMeta = async () => {
    try {
      const data = await getCatalogMetaApi();
      setMeta(data);
      if (data.brands.length > 0 && data.categories.length > 0) {
        setFormData((prev) => ({
          ...prev,
          brandId: data.brands[0].id,
          categoryId: data.categories[0].id,
        }));
      }
    } catch (err) {
      console.error('Lỗi tải metadata catalog:', err);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchProducts(1);
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pageMeta.totalPages && newPage !== pageMeta.page) {
      fetchProducts(newPage);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      brandId: meta?.brands[0]?.id || 1,
      categoryId: meta?.categories[0]?.id || 1,
      name: '',
      description: '',
      collectionName: '',
      designerName: '',
      isLimited: false,
      isMadeToOrder: false,
    });
    setModalOpen(true);
  };

  const openEditModal = (p: ProductSummary) => {
    setEditingProduct(p);
    setFormData({
      brandId: p.brand.id,
      categoryId: p.category.id,
      name: p.name,
      description: '',
      collectionName: p.collectionName || '',
      designerName: p.designerName || '',
      isLimited: p.isLimited,
      isMadeToOrder: p.isMadeToOrder,
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      if (editingProduct) {
        await updateProductApi(editingProduct.id, formData);
        const msg = `Cập nhật tác phẩm #${editingProduct.id} thành công.`;
        setSuccessMsg(msg);
        toast.success(msg);
      } else {
        const created = await createProductApi(formData);
        const msg = `Đã tạo tác phẩm mới #${created.id} thành công.`;
        setSuccessMsg(msg);
        toast.success(msg);
      }
      setModalOpen(false);
      await fetchProducts(editingProduct ? pageMeta.page : 1);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Có lỗi xảy ra khi lưu sản phẩm.';
      setError(msg);
      toast.error(err, msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId: number, productName: string) => {
    if (
      !window.confirm(
        `Xác nhận xóa an toàn sản phẩm "${productName}" (ID #${productId})? Thao tác chỉ thành công nếu sản phẩm chưa phát sinh đơn hàng nào (FR14).`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await deleteProductApi(productId);
      const msg = `Xóa sản phẩm "${productName}" (ID #${productId}) thành công.`;
      setSuccessMsg(msg);
      toast.success(msg);
      const nextPage = products.length === 1 && pageMeta.page > 1 ? pageMeta.page - 1 : pageMeta.page;
      await fetchProducts(nextPage);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Không thể xóa sản phẩm. Sản phẩm này có thể đã có đơn hàng tham chiếu trong hệ thống.';
      setError(msg);
      toast.error(err, msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Thanh tìm kiếm & Bộ lọc */}
        <ProductManagementFilter
          search={search}
          onSearchChange={setSearch}
          onSearchSubmit={handleSearchSubmit}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          meta={meta}
          onRefresh={() => fetchProducts(pageMeta.page)}
          onOpenCreateModal={openCreateModal}
          loading={loading}
        />

        {/* Thông báo Alert */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-[2px] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-xs rounded-[2px] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Bảng Danh sách Sản phẩm */}
        <ProductManagementTable
          products={products}
          loading={loading}
          pageMeta={pageMeta}
          onPageChange={handlePageChange}
          onEdit={openEditModal}
          onDelete={handleDelete}
        />

        {/* Modal Thêm mới / Sửa Sản phẩm */}
        <ProductEditModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          editingProduct={editingProduct}
          formData={formData}
          onFormDataChange={setFormData}
          onSubmit={handleFormSubmit}
          submitting={submitting}
          meta={meta}
        />
      </div>
    </AdminLayout>
  );
};

export default A05_ProductManagementPage;
