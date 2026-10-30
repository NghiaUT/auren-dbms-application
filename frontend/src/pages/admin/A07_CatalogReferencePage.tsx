// ============================================================================
// File: frontend/src/pages/admin/A07_CatalogReferencePage.tsx
// Mã màn hình: A07 | Route: /admin/catalog | FR: FR14
// Vai trò: Quản lý Dữ liệu Tham chiếu Danh mục (Reference Catalog) — CRUD 3 phân hệ:
//          1. Danh mục sản phẩm (Categories) — Có kiểm tra chống vòng lặp cha-con
//          2. Thương hiệu (Brands)
//          3. Chất liệu (Materials)
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
  FolderTree,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  AlertCircle,
  Check,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';
import { AdminLayout } from '../../layouts/AdminLayout';
import {
  getCatalogMetaApi,
  createReferenceResourceApi,
  updateReferenceResourceApi,
  deleteReferenceResourceApi,
} from '../../api/admin.api';
import type { CatalogMeta, Category, Brand, Material } from '../../types';

export const A07_CatalogReferencePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'categories' | 'brands' | 'materials'>('categories');
  const [loading, setLoading] = useState<boolean>(true);
  const [meta, setMeta] = useState<CatalogMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form States
  const [catForm, setCatForm] = useState<{ name: string; slug: string; parentId: number | null }>({
    name: '',
    slug: '',
    parentId: null,
  });

  const [brandForm, setBrandForm] = useState<{ name: string; country: string; foundedYear?: number }>({
    name: '',
    country: '',
    foundedYear: 2000,
  });

  const [matForm, setMatForm] = useState<{ name: string; type: string; origin: string }>({
    name: '',
    type: 'wood',
    origin: '',
  });

  const fetchCatalogData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCatalogMetaApi();
      setMeta(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải dữ liệu danh mục tham chiếu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogData();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    if (activeTab === 'categories') {
      setCatForm({ name: '', slug: '', parentId: null });
    } else if (activeTab === 'brands') {
      setBrandForm({ name: '', country: 'Vietnam', foundedYear: 2020 });
    } else {
      setMatForm({ name: '', type: 'wood', origin: 'Vietnam' });
    }
    setModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    if (activeTab === 'categories') {
      setCatForm({
        name: item.name,
        slug: item.slug,
        parentId: item.parentId || null,
      });
    } else if (activeTab === 'brands') {
      setBrandForm({
        name: item.name,
        country: item.country || '',
        foundedYear: item.foundedYear || 2000,
      });
    } else {
      setMatForm({
        name: item.name,
        type: item.type || 'wood',
        origin: item.origin || '',
      });
    }
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      let payload: any;
      if (activeTab === 'categories') {
        payload = { ...catForm, parentId: catForm.parentId || null };
      } else if (activeTab === 'brands') {
        payload = brandForm;
      } else {
        payload = matForm;
      }

      if (editingItem) {
        await updateReferenceResourceApi(activeTab, editingItem.id, payload);
        setSuccessMsg(`Cập nhật ${activeTab} #${editingItem.id} thành công!`);
      } else {
        await createReferenceResourceApi(activeTab, payload);
        setSuccessMsg(`Thêm mới vào ${activeTab} thành công!`);
      }

      setModalOpen(false);
      fetchCatalogData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Có lỗi khi lưu thông tin');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xoá "${name}" khỏi ${activeTab}?\nChỉ xoá được nếu không có bản ghi nào tham chiếu đến.`)) {
      return;
    }

    try {
      setError(null);
      await deleteReferenceResourceApi(activeTab, id);
      setSuccessMsg(`Đã xoá "${name}" thành công!`);
      fetchCatalogData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể xoá vì dữ liệu đang được sử dụng');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D2C8BA]/60">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A7824B] font-bold">
              [FR14] Master Metadata Management
            </span>
            <h2 className="font-serif text-3xl text-[#0D0703] font-medium tracking-tight mt-1">
              Quản trị Dữ liệu Tham chiếu (Reference Catalog)
            </h2>
            <p className="font-sans text-xs text-[#7B6E64] mt-0.5">
              Cấu hình các bảng tham chiếu chuẩn hóa: Cây Danh mục, Thương hiệu thiết kế và Chủng loại chất liệu.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchCatalogData}
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
              <span>
                Thêm {activeTab === 'categories' ? 'Danh mục' : activeTab === 'brands' ? 'Thương hiệu' : 'Chất liệu'}
              </span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#D2C8BA] gap-8">
          <button
            onClick={() => setActiveTab('categories')}
            className={`pb-3 text-xs tracking-wider uppercase font-semibold transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'categories'
                ? 'border-[#0D0703] text-[#0D0703]'
                : 'border-transparent text-[#7B6E64] hover:text-[#0D0703]'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5 text-[#A7824B]" />
            <span>Danh mục Sản phẩm ({meta?.categories.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('brands')}
            className={`pb-3 text-xs tracking-wider uppercase font-semibold transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'brands'
                ? 'border-[#0D0703] text-[#0D0703]'
                : 'border-transparent text-[#7B6E64] hover:text-[#0D0703]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#A7824B]" />
            <span>Thương hiệu Thiết kế ({meta?.brands.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('materials')}
            className={`pb-3 text-xs tracking-wider uppercase font-semibold transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'materials'
                ? 'border-[#0D0703] text-[#0D0703]'
                : 'border-transparent text-[#7B6E64] hover:text-[#0D0703]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#A7824B]" />
            <span>Chất liệu chế tác ({meta?.materials.length || 0})</span>
          </button>
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

        {/* TAB 1: CATEGORIES TABLE */}
        {activeTab === 'categories' && (
          <div className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#D2C8BA] bg-[#EAE4D9]/40 text-[#503625] font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">ID</th>
                  <th className="py-3 px-4">Tên Danh mục</th>
                  <th className="py-3 px-4">Slug URL</th>
                  <th className="py-3 px-4">Thuộc Danh mục Cha</th>
                  <th className="py-3 px-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D2C8BA]/40 font-sans text-xs">
                {meta?.categories.map((c) => {
                  const parent = meta.categories.find((p) => p.id === c.parentId);
                  return (
                    <tr key={c.id} className="hover:bg-[#FAF8F3]/60 transition-colors">
                      <td className="py-3 px-4 text-center font-mono font-medium text-[#7B6E64]">
                        #{c.id}
                      </td>
                      <td className="py-3 px-4 font-serif text-sm font-medium text-[#0D0703]">
                        {c.parentId ? `↳ ${c.name}` : c.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#503625]">{c.slug}</td>
                      <td className="py-3 px-4 text-[#7B6E64]">
                        {parent ? parent.name : '— Danh mục gốc'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(c)}
                            className="p-1.5 text-[#503625] hover:text-[#0D0703] hover:bg-[#EAE4D9]/40 rounded-[2px]"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id, c.name)}
                            className="p-1.5 text-[#BA1A1A] hover:bg-red-50 rounded-[2px]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: BRANDS TABLE */}
        {activeTab === 'brands' && (
          <div className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#D2C8BA] bg-[#EAE4D9]/40 text-[#503625] font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">ID</th>
                  <th className="py-3 px-4">Thương hiệu</th>
                  <th className="py-3 px-4">Quốc gia xuất xứ</th>
                  <th className="py-3 px-4">Năm thành lập</th>
                  <th className="py-3 px-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D2C8BA]/40 font-sans text-xs">
                {meta?.brands.map((b) => (
                  <tr key={b.id} className="hover:bg-[#FAF8F3]/60 transition-colors">
                    <td className="py-3 px-4 text-center font-mono font-medium text-[#7B6E64]">
                      #{b.id}
                    </td>
                    <td className="py-3 px-4 font-serif text-sm font-medium text-[#0D0703]">
                      {b.name}
                    </td>
                    <td className="py-3 px-4 text-[#503625]">{b.country || 'N/A'}</td>
                    <td className="py-3 px-4 font-mono text-[#7B6E64]">
                      {b.foundedYear || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(b)}
                          className="p-1.5 text-[#503625] hover:text-[#0D0703] hover:bg-[#EAE4D9]/40 rounded-[2px]"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(b.id, b.name)}
                          className="p-1.5 text-[#BA1A1A] hover:bg-red-50 rounded-[2px]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: MATERIALS TABLE */}
        {activeTab === 'materials' && (
          <div className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#D2C8BA] bg-[#EAE4D9]/40 text-[#503625] font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">ID</th>
                  <th className="py-3 px-4">Tên Chất liệu</th>
                  <th className="py-3 px-4">Chủng loại (Enum Type)</th>
                  <th className="py-3 px-4">Xuất xứ khai thác</th>
                  <th className="py-3 px-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D2C8BA]/40 font-sans text-xs">
                {meta?.materials.map((m) => (
                  <tr key={m.id} className="hover:bg-[#FAF8F3]/60 transition-colors">
                    <td className="py-3 px-4 text-center font-mono font-medium text-[#7B6E64]">
                      #{m.id}
                    </td>
                    <td className="py-3 px-4 font-serif text-sm font-medium text-[#0D0703]">
                      {m.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 bg-white border border-[#D2C8BA] rounded-[1px] text-[#503625] font-semibold">
                        {m.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#7B6E64]">{m.origin || 'N/A'}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(m)}
                          className="p-1.5 text-[#503625] hover:text-[#0D0703] hover:bg-[#EAE4D9]/40 rounded-[2px]"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id, m.name)}
                          className="p-1.5 text-[#BA1A1A] hover:bg-red-50 rounded-[2px]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal Thêm / Sửa Dữ liệu tham chiếu */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-[#FAF8F3] border border-[#D2C8BA] w-full max-w-md rounded-[2px] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-4 border-b border-[#D2C8BA] flex items-center justify-between bg-white">
                <h3 className="font-serif text-lg font-medium text-[#0D0703]">
                  {editingItem ? `Chỉnh sửa #${editingItem.id}` : `Thêm mới vào ${activeTab}`}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-[#7B6E64] hover:text-[#0D0703]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs">
                {activeTab === 'categories' && (
                  <>
                    <div>
                      <label className="block font-semibold text-[#0D0703] mb-1">
                        Tên Danh mục <span className="text-[#BA1A1A]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={catForm.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          const slug = name
                            .toLowerCase()
                            .normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '')
                            .replace(/[đĐ]/g, 'd')
                            .replace(/([^0-9a-z-\s])/g, '')
                            .replace(/(\s+)/g, '-')
                            .replace(/^-+|-+$/g, '');
                          setCatForm({ ...catForm, name, slug: catForm.slug || slug });
                        }}
                        className="w-full px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] focus:outline-none focus:border-[#0D0703]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#0D0703] mb-1">
                        Slug URL <span className="text-[#BA1A1A]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={catForm.slug}
                        onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] font-mono focus:outline-none focus:border-[#0D0703]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#0D0703] mb-1">
                        Danh mục cha (Tùy chọn)
                      </label>
                      <select
                        value={catForm.parentId || ''}
                        onChange={(e) => setCatForm({ ...catForm, parentId: e.target.value ? Number(e.target.value) : null })}
                        className="w-full px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] focus:outline-none focus:border-[#0D0703]"
                      >
                        <option value="">— Không có (Danh mục gốc cấp 1)</option>
                        {meta?.categories
                          .filter((c) => !editingItem || c.id !== editingItem.id)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </>
                )}

                {activeTab === 'brands' && (
                  <>
                    <div>
                      <label className="block font-semibold text-[#0D0703] mb-1">
                        Tên Thương hiệu <span className="text-[#BA1A1A]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={brandForm.name}
                        onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] focus:outline-none focus:border-[#0D0703]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#0D0703] mb-1">
                        Quốc gia
                      </label>
                      <input
                        type="text"
                        value={brandForm.country}
                        onChange={(e) => setBrandForm({ ...brandForm, country: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] focus:outline-none focus:border-[#0D0703]"
                        placeholder="Denmark, Italy, Vietnam..."
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#0D0703] mb-1">
                        Năm thành lập
                      </label>
                      <input
                        type="number"
                        min={1800}
                        max={2100}
                        value={brandForm.foundedYear || ''}
                        onChange={(e) => setBrandForm({ ...brandForm, foundedYear: Number(e.target.value) || undefined })}
                        className="w-full px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] font-mono focus:outline-none focus:border-[#0D0703]"
                      />
                    </div>
                  </>
                )}

                {activeTab === 'materials' && (
                  <>
                    <div>
                      <label className="block font-semibold text-[#0D0703] mb-1">
                        Tên Chất liệu <span className="text-[#BA1A1A]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={matForm.name}
                        onChange={(e) => setMatForm({ ...matForm, name: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] focus:outline-none focus:border-[#0D0703]"
                        placeholder="Walnut, Travertine Stone, Brass..."
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#0D0703] mb-1">
                        Chủng loại (Enum Type) <span className="text-[#BA1A1A]">*</span>
                      </label>
                      <select
                        value={matForm.type}
                        onChange={(e) => setMatForm({ ...matForm, type: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] focus:outline-none focus:border-[#0D0703]"
                      >
                        <option value="wood">Wood (Gỗ tự nhiên)</option>
                        <option value="leather">Leather (Da thuộc cao cấp)</option>
                        <option value="stone">Stone (Đá tự nhiên / Travertine)</option>
                        <option value="metal">Metal (Kim loại / Đồng brass)</option>
                        <option value="fabric">Fabric (Vải dệt cao cấp)</option>
                        <option value="glass">Glass (Kính kiến trúc)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#0D0703] mb-1">
                        Xuất xứ nguồn gốc
                      </label>
                      <input
                        type="text"
                        value={matForm.origin}
                        onChange={(e) => setMatForm({ ...matForm, origin: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] focus:outline-none focus:border-[#0D0703]"
                        placeholder="USA, Italy, Vietnam..."
                      />
                    </div>
                  </>
                )}

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
                    {submitting ? 'Đang lưu...' : editingItem ? 'Cập nhật' : 'Tạo mới'}
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
