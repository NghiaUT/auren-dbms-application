// ============================================================================
// File: frontend/src/pages/admin/A05_ProductManagementPage.tsx
// Mã màn hình: A05 | Route: /admin/products | FR: FR14
// Vai trò: Quản lý Danh mục Sản phẩm — Danh sách sản phẩm, tạo mới, chỉnh sửa,
//          chuyển hướng sang cấu hình biến thể (A06) và xóa an toàn.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Layers,
  RefreshCw,
  AlertCircle,
  X,
  Check,
} from 'lucide-react';
import { AdminLayout } from '../../layouts/AdminLayout';
import {
  getAdminProductsApi,
  createProductApi,
  updateProductApi,
  deleteProductApi,
  getCatalogMetaApi,
} from '../../api/admin.api';
import type { CatalogMeta, ProductSummary, CreateProductInput } from '../../types';
import { formatVND } from '../../utils/formatVND';

export const A05_ProductManagementPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [products, setProducts] = useState<ProductSummary[]>([]);
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

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminProductsApi({
        q: search || undefined,
        categoryId: selectedCategory,
        limit: 50,
      });
      setProducts(res.data);
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
    fetchProducts();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
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
    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên sản phẩm');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (editingProduct) {
        await updateProductApi(editingProduct.id, formData);
        setSuccessMsg(`Cập nhật sản phẩm #${editingProduct.id} thành công!`);
      } else {
        await createProductApi(formData);
        setSuccessMsg('Tạo sản phẩm mới thành công!');
      }

      setModalOpen(false);
      fetchProducts();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Có lỗi khi lưu thông tin sản phẩm');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xoá sản phẩm "${name}" (ID #${id})?\nThao tác này chỉ thành công nếu sản phẩm chưa phát sinh đơn hàng.`)) {
      return;
    }

    try {
      setError(null);
      await deleteProductApi(id);
      setSuccessMsg(`Đã xoá sản phẩm "${name}" thành công!`);
      fetchProducts();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể xoá sản phẩm này (có thể đã phát sinh đơn hàng)');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header & Create Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D2C8BA]/60">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A7824B] font-bold">
              [FR14] Catalog Management
            </span>
            <h2 className="font-serif text-3xl text-[#0D0703] font-medium tracking-tight mt-1">
              Quản lý Danh mục Sản phẩm
            </h2>
            <p className="font-sans text-xs text-[#7B6E64] mt-0.5">
              Thêm mới, sửa đổi thông số sản phẩm và quản lý các biến thể kích thước, chất liệu.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchProducts}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs uppercase tracking-wider font-semibold border border-[#D2C8BA] bg-[#FAF8F3] hover:bg-white rounded-[2px] transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Tải lại</span>
            </button>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs uppercase tracking-wider font-semibold bg-[#0D0703] text-white rounded-[2px] hover:bg-[#271E18] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Sản phẩm mới</span>
            </button>
          </div>
        </div>

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

        {/* Thanh tìm kiếm & Bộ lọc */}
        <div className="p-4 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] flex flex-wrap items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#7B6E64] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên sản phẩm, bộ sưu tập..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
              onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : undefined)}
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

        {/* Bảng Danh sách Sản phẩm */}
        <div className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#D2C8BA] bg-[#EAE4D9]/40 text-[#503625] font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">ID</th>
                  <th className="py-3 px-4">Tác phẩm & Bộ sưu tập</th>
                  <th className="py-3 px-4">Thương hiệu</th>
                  <th className="py-3 px-4">Danh mục</th>
                  <th className="py-3 px-4 text-center">Đặc tính</th>
                  <th className="py-3 px-4 text-right">Giá khởi điểm</th>
                  <th className="py-3 px-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D2C8BA]/40 font-sans text-xs">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-[#7B6E64]">
                      {loading ? 'Đang tải danh sách...' : 'Không tìm thấy sản phẩm nào phù hợp.'}
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="hover:bg-[#FAF8F3]/60 transition-colors">
                      <td className="py-3 px-4 text-center font-mono font-medium text-[#7B6E64]">
                        #{p.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-serif text-sm font-medium text-[#0D0703]">{p.name}</div>
                        {(p.collectionName || p.designerName) && (
                          <div className="font-sans text-[11px] text-[#7B6E64] mt-0.5">
                            {p.collectionName} {p.designerName ? `— NTK ${p.designerName}` : ''}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#0D0703]">
                        {p.brand.name}
                      </td>
                      <td className="py-3 px-4 text-[#503625]">
                        {p.category.name}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {p.isLimited && (
                            <span className="px-1.5 py-0.5 bg-[#A7824B] text-white font-mono text-[9px] uppercase tracking-wider rounded-[1px] font-bold">
                              Limited
                            </span>
                          )}
                          {p.isMadeToOrder && (
                            <span className="px-1.5 py-0.5 bg-[#271E18] text-[#FAF8F3] font-mono text-[9px] uppercase tracking-wider rounded-[1px]">
                              Bespoke
                            </span>
                          )}
                          {!p.isLimited && !p.isMadeToOrder && (
                            <span className="text-[#7B6E64] text-[10px] font-mono">Standard</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-[#0D0703] tabular-nums">
                        {p.minPrice > 0 ? formatVND(p.minPrice) : 'Chưa có giá'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            to={`/admin/products/${p.id}/variants`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#503625] bg-white border border-[#D2C8BA] rounded-[2px] hover:bg-[#FAF8F3]"
                            title="Quản lý biến thể & chất liệu"
                          >
                            <Layers className="w-3.5 h-3.5 text-[#A7824B]" />
                            <span>Biến thể</span>
                          </Link>

                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-[#503625] hover:text-[#0D0703] hover:bg-[#EAE4D9]/40 rounded-[2px]"
                            title="Chỉnh sửa sản phẩm"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1.5 text-[#BA1A1A] hover:bg-red-50 rounded-[2px]"
                            title="Xóa an toàn"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Thêm mới / Sửa Sản phẩm */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-[#FAF8F3] border border-[#D2C8BA] w-full max-w-lg rounded-[2px] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-4 border-b border-[#D2C8BA] flex items-center justify-between bg-white">
                <h3 className="font-serif text-lg font-medium text-[#0D0703]">
                  {editingProduct ? `Chỉnh sửa Sản phẩm #${editingProduct.id}` : 'Thêm Sản phẩm Kiến trúc Mới'}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-[#7B6E64] hover:text-[#0D0703]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#0D0703] mb-1">
                    Tên Sản phẩm <span className="text-[#BA1A1A]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] focus:outline-none focus:border-[#0D0703]"
                    placeholder="Ví dụ: Auren Arch Lounge Chair"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[#0D0703] mb-1">
                      Thương hiệu <span className="text-[#BA1A1A]">*</span>
                    </label>
                    <select
                      value={formData.brandId}
                      onChange={(e) => setFormData({ ...formData, brandId: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] focus:outline-none focus:border-[#0D0703]"
                    >
                      {meta?.brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.country || 'N/A'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0D0703] mb-1">
                      Danh mục <span className="text-[#BA1A1A]">*</span>
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] focus:outline-none focus:border-[#0D0703]"
                    >
                      {meta?.categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[#0D0703] mb-1">
                      Bộ sưu tập (Collection)
                    </label>
                    <input
                      type="text"
                      value={formData.collectionName || ''}
                      onChange={(e) => setFormData({ ...formData, collectionName: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] focus:outline-none focus:border-[#0D0703]"
                      placeholder="Nordic Calm..."
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0D0703] mb-1">
                      Nhà thiết kế (Designer)
                    </label>
                    <input
                      type="text"
                      value={formData.designerName || ''}
                      onChange={(e) => setFormData({ ...formData, designerName: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] focus:outline-none focus:border-[#0D0703]"
                      placeholder="Alvar Aalto..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#0D0703] mb-1">
                    Mô tả kiến trúc / chế tác
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] focus:outline-none focus:border-[#0D0703]"
                    placeholder="Mô tả phong cách, cảm hứng thiết kế..."
                  />
                </div>

                <div className="p-3 bg-white border border-[#D2C8BA] rounded-[2px] space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isLimited"
                      checked={formData.isLimited}
                      onChange={(e) => setFormData({ ...formData, isLimited: e.target.checked })}
                      className="rounded-[2px]"
                    />
                    <label htmlFor="isLimited" className="font-semibold text-[#0D0703] cursor-pointer">
                      Sản phẩm Phiên bản Giới hạn (Limited Edition — Đánh số serial độc bản)
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isMadeToOrder"
                      checked={formData.isMadeToOrder}
                      onChange={(e) => setFormData({ ...formData, isMadeToOrder: e.target.checked })}
                      className="rounded-[2px]"
                    />
                    <label htmlFor="isMadeToOrder" className="font-semibold text-[#0D0703] cursor-pointer">
                      Chế tác theo yêu cầu riêng (Made-to-Order / Bespoke)
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#D2C8BA] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 border border-[#D2C8BA] font-semibold text-[#503625] hover:bg-white rounded-[2px]"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-[#0D0703] text-white font-semibold uppercase tracking-wider rounded-[2px] hover:bg-[#271E18]"
                  >
                    {submitting ? 'Đang lưu...' : editingProduct ? 'Cập nhật' : 'Tạo mới'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
