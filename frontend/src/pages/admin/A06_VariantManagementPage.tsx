// ============================================================================
// File: frontend/src/pages/admin/A06_VariantManagementPage.tsx
// Mã màn hình: A06 | Route: /admin/products/:id/variants | FR: FR14
// Vai trò: Quản lý Biến thể & Chất liệu của Sản phẩm — Minh họa loại truy vấn
//          b (DELETE kết hợp NOT EXISTS), thêm biến thể kèm chất liệu và serial giới hạn.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
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
  getVariantsByProductIdApi,
  createVariantApi,
  updateVariantApi,
  deleteVariantApi,
  getCatalogMetaApi,
} from '../../api/admin.api';
import type { AdminVariant, CatalogMeta, CreateVariantInput } from '../../types';
import { formatVND } from '../../utils/formatVND';

export const A06_VariantManagementPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);

  const [loading, setLoading] = useState<boolean>(true);
  const [variants, setVariants] = useState<AdminVariant[]>([]);
  const [meta, setMeta] = useState<CatalogMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingVariant, setEditingVariant] = useState<AdminVariant | null>(null);
  const [formData, setFormData] = useState<CreateVariantInput>({
    sku: '',
    size: '',
    finish: '',
    price: 0,
    leadTimeDays: 0,
    status: 'active',
    materials: [],
    editionSize: undefined,
  });
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchVariants = async () => {
    if (!productId || isNaN(productId)) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getVariantsByProductIdApi(productId);
      setVariants(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải danh sách biến thể');
    } finally {
      setLoading(false);
    }
  };

  const fetchMeta = async () => {
    try {
      const data = await getCatalogMetaApi();
      setMeta(data);
    } catch (err) {
      console.error('Lỗi tải meta chất liệu:', err);
    }
  };

  useEffect(() => {
    fetchMeta();
    fetchVariants();
  }, [productId]);

  const productName = variants[0]?.productName || `Sản phẩm #${productId}`;
  const isParentLimited = variants[0]?.isLimited ?? false;

  const openCreateModal = () => {
    setEditingVariant(null);
    setFormData({
      sku: `AUR-${productId}-${Date.now().toString().slice(-4)}`,
      size: '220x95x75 cm',
      finish: 'Natural Matte',
      price: 45000000,
      leadTimeDays: 30,
      status: 'active',
      materials: meta && meta.materials.length > 0
        ? [{ materialId: meta.materials[0].id, portion: 100, finishNote: 'Oiled' }]
        : [],
      editionSize: isParentLimited ? 25 : undefined,
    });
    setModalOpen(true);
  };

  const openEditModal = (v: AdminVariant) => {
    setEditingVariant(v);
    setFormData({
      sku: v.sku,
      size: v.size || '',
      finish: v.finish || '',
      price: v.price,
      leadTimeDays: v.leadTimeDays,
      status: v.status,
      materials: v.materials.map((m) => ({
        materialId: m.materialId,
        portion: m.portion || undefined,
        finishNote: m.finishNote || undefined,
      })),
    });
    setModalOpen(true);
  };

  // Thêm dòng chất liệu trong modal
  const addMaterialRow = () => {
    if (!meta || meta.materials.length === 0) return;
    setFormData({
      ...formData,
      materials: [
        ...(formData.materials || []),
        { materialId: meta.materials[0].id, portion: 10, finishNote: '' },
      ],
    });
  };

  // Xóa dòng chất liệu
  const removeMaterialRow = (index: number) => {
    const list = [...(formData.materials || [])];
    list.splice(index, 1);
    setFormData({ ...formData, materials: list });
  };

  // Cập nhật dòng chất liệu
  const updateMaterialRow = (index: number, field: string, val: any) => {
    const list = [...(formData.materials || [])];
    list[index] = { ...list[index], [field]: val };
    setFormData({ ...formData, materials: list });
  };

  const currentTotalPortion = (formData.materials || []).reduce(
    (sum, m) => sum + (Number(m.portion) || 0),
    0,
  );

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sku.trim()) {
      setError('Vui lòng nhập mã SKU định danh');
      return;
    }
    if (formData.price < 0) {
      setError('Giá bán không được là số âm');
      return;
    }
    if (currentTotalPortion > 100) {
      setError(`Tổng tỷ lệ phần trăm chất liệu (${currentTotalPortion}%) không được vượt quá 100%`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (editingVariant) {
        await updateVariantApi(editingVariant.id, formData);
        setSuccessMsg(`Cập nhật biến thể "${editingVariant.sku}" thành công!`);
      } else {
        await createVariantApi(productId, formData);
        setSuccessMsg(`Đã tạo biến thể mới cho sản phẩm #${productId}!`);
      }

      setModalOpen(false);
      fetchVariants();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Có lỗi khi lưu thông tin biến thể');
    } finally {
      setSubmitting(false);
    }
  };

  // Xoá biến thể (Truy vấn loại b DELETE NOT EXISTS)
  const handleDeleteVariant = async (vId: number, sku: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xoá biến thể "${sku}" (ID #${vId})?\nThao tác này chỉ thành công nếu biến thể CHƯA TỪNG phát sinh đơn hàng.`)) {
      return;
    }

    try {
      setError(null);
      await deleteVariantApi(vId);
      setSuccessMsg(`Đã xoá thành công biến thể "${sku}"!`);
      fetchVariants();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể xoá biến thể này';
      setError(`[Xung đột dữ liệu 409] ${msg}`);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <Link to="/admin/products" className="text-[#A7824B] hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại Danh mục Sản phẩm</span>
          </Link>
          <span className="text-[#D2C8BA]">/</span>
          <span className="text-[#7B6E64]">Biến thể Sản phẩm #{productId}</span>
        </div>

        {/* Tiêu đề & Thông tin học thuật */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D2C8BA]/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A7824B] font-bold">
                [FR14] Variants & Materials
              </span>
              <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 bg-[#BA1A1A] text-white font-bold rounded-[1px]">
                DELETE (b) NOT EXISTS
              </span>
            </div>
            <h2 className="font-serif text-3xl text-[#0D0703] font-medium tracking-tight mt-1">
              Biến thể của: {productName}
            </h2>
            <p className="font-sans text-xs text-[#7B6E64] mt-0.5">
              Quản lý danh sách SKU, thông số kích thước, màu hoàn thiện, tỉ lệ thành phần chất liệu và serial Limited Edition.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchVariants}
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
              <span>Thêm Biến thể mới</span>
            </button>
          </div>
        </div>

        {/* Khối giải thích học thuật về lệnh DELETE */}
        <div className="p-4 bg-[#FAF8F3] border-l-4 border-[#BA1A1A] border border-[#D2C8BA] rounded-[2px] text-xs space-y-1">
          <p className="font-semibold text-[#0D0703]">
            💡 Điểm trọng tâm môn học Cơ sở dữ liệu (Truy vấn Loại b - DELETE an toàn):
          </p>
          <p className="text-[#503625]">
            Hệ thống áp dụng câu lệnh: <code className="font-mono bg-[#EAE4D9] px-1 py-0.5 rounded-[2px]">DELETE FROM product_variants WHERE id = ? AND NOT EXISTS (SELECT 1 FROM order_items WHERE variant_id = ?)</code>. Nếu biến thể đã từng phát sinh đơn hàng, hệ thống chặn xoá và phản hồi HTTP 409 để bảo toàn tính toàn vẹn dữ liệu đơn hàng.
          </p>
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

        {/* Bảng Danh sách Biến thể */}
        <div className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#D2C8BA] bg-[#EAE4D9]/40 text-[#503625] font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">ID</th>
                  <th className="py-3 px-4">Mã SKU</th>
                  <th className="py-3 px-4">Kích thước & Hoàn thiện</th>
                  <th className="py-3 px-4 text-right">Giá niêm yết</th>
                  <th className="py-3 px-4">Chất liệu chế tác</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D2C8BA]/40 font-sans text-xs">
                {variants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-[#7B6E64]">
                      {loading ? 'Đang tải biến thể...' : 'Sản phẩm này chưa có biến thể nào.'}
                    </td>
                  </tr>
                ) : (
                  variants.map((v) => (
                    <tr key={v.id} className="hover:bg-[#FAF8F3]/60 transition-colors">
                      <td className="py-3 px-4 text-center font-mono font-medium text-[#7B6E64]">
                        #{v.id}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-[#0D0703] bg-white px-2 py-0.5 border border-[#D2C8BA] rounded-[1px]">
                          {v.sku}
                        </span>
                        {v.leadTimeDays > 0 && (
                          <div className="text-[10px] font-mono text-[#7B6E64] mt-1">
                            Lead time: {v.leadTimeDays} ngày
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#0D0703]">{v.size || 'N/A'}</div>
                        <div className="text-[11px] text-[#7B6E64]">{v.finish || 'Standard Finish'}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-[#0D0703] tabular-nums text-sm">
                        {formatVND(v.price)}
                      </td>
                      <td className="py-3 px-4">
                        {v.materials.length === 0 ? (
                          <span className="text-[#7B6E64] text-[11px] italic">Chưa gán</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {v.materials.map((m) => (
                              <span
                                key={m.materialId}
                                className="px-1.5 py-0.5 bg-white border border-[#D2C8BA] rounded-[1px] font-mono text-[10px] text-[#503625]"
                              >
                                {m.name} ({m.portion || '?'}%)
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider font-bold rounded-[1px] ${v.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-200 text-gray-700'
                            }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(v)}
                            className="p-1.5 text-[#503625] hover:text-[#0D0703] hover:bg-[#EAE4D9]/40 rounded-[2px]"
                            title="Sửa biến thể"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteVariant(v.id, v.sku)}
                            className="p-1.5 text-[#BA1A1A] hover:bg-red-50 rounded-[2px]"
                            title="Xóa biến thể (NOT EXISTS check)"
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

        {/* Modal Thêm mới / Sửa Biến thể */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-[#FAF8F3] border border-[#D2C8BA] w-full max-w-xl rounded-[2px] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
              <div className="p-4 border-b border-[#D2C8BA] flex items-center justify-between bg-white shrink-0">
                <h3 className="font-serif text-lg font-medium text-[#0D0703]">
                  {editingVariant ? `Chỉnh sửa Biến thể SKU: ${editingVariant.sku}` : 'Thêm Biến thể mới'}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-[#7B6E64] hover:text-[#0D0703]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[#0D0703] mb-1">
                      Mã SKU định danh <span className="text-[#BA1A1A]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] font-mono focus:outline-none focus:border-[#0D0703]"
                      placeholder="AUR-CHR-OAK-01"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0D0703] mb-1">
                      Giá niêm yết (VND) <span className="text-[#BA1A1A]">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] font-mono focus:outline-none focus:border-[#0D0703]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[#0D0703] mb-1">
                      Kích thước (Size)
                    </label>
                    <input
                      type="text"
                      value={formData.size || ''}
                      onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] focus:outline-none focus:border-[#0D0703]"
                      placeholder="240x100x85 cm"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0D0703] mb-1">
                      Màu hoàn thiện (Finish)
                    </label>
                    <input
                      type="text"
                      value={formData.finish || ''}
                      onChange={(e) => setFormData({ ...formData, finish: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] focus:outline-none focus:border-[#0D0703]"
                      placeholder="Oiled Walnut / Brass"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[#0D0703] mb-1">
                      Thời gian chế tác (Lead time - ngày)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.leadTimeDays || 0}
                      onChange={(e) => setFormData({ ...formData, leadTimeDays: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] font-mono focus:outline-none focus:border-[#0D0703]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0D0703] mb-1">
                      Trạng thái kinh doanh
                    </label>
                    <select
                      value={formData.status || 'active'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] focus:outline-none focus:border-[#0D0703]"
                    >
                      <option value="active">Active (Đang bán)</option>
                      <option value="discontinued">Discontinued (Ngừng kinh doanh)</option>
                    </select>
                  </div>
                </div>

                {/* Phần chất liệu (Dynamic rows) */}
                <div className="pt-3 border-t border-[#D2C8BA]">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-semibold text-[#0D0703]">Thành phần Chất liệu (Materials)</span>
                      <span className={`ml-2 font-mono text-[11px] ${currentTotalPortion > 100 ? 'text-[#BA1A1A] font-bold' : 'text-[#7B6E64]'}`}>
                        Tổng: {currentTotalPortion}% / 100%
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={addMaterialRow}
                      className="text-xs text-[#A7824B] hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm chất liệu</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(formData.materials || []).map((mat, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-white border border-[#D2C8BA] rounded-[2px]">
                        <select
                          value={mat.materialId}
                          onChange={(e) => updateMaterialRow(idx, 'materialId', Number(e.target.value))}
                          className="flex-1 px-2 py-1 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] text-xs"
                        >
                          {meta?.materials.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.type})
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center gap-1 w-20">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={mat.portion || 0}
                            onChange={(e) => updateMaterialRow(idx, 'portion', Number(e.target.value))}
                            className="w-14 px-2 py-1 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] text-xs font-mono text-right"
                          />
                          <span className="text-[#7B6E64]">%</span>
                        </div>

                        <input
                          type="text"
                          placeholder="Ghi chú hoàn thiện..."
                          value={mat.finishNote || ''}
                          onChange={(e) => updateMaterialRow(idx, 'finishNote', e.target.value)}
                          className="flex-initial min-w-0 px-2 py-1 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] text-xs overflow-hidden whitespace-nowrap text-ellipsis"
                        />

                        <button
                          type="button"
                          onClick={() => removeMaterialRow(idx)}
                          className="text-[#BA1A1A] hover:bg-red-50 p-1 rounded-[1px]"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Nếu là sản phẩm Limited Edition và đang tạo mới, cho phép sinh editionSize */}
                {!editingVariant && isParentLimited && (
                  <div className="p-3 bg-[#FAF8F3] border border-[#A7824B] rounded-[2px]">
                    <div className="flex items-center gap-1.5 font-semibold text-[#0D0703] mb-1">
                      <Sparkles className="w-4 h-4 text-[#A7824B]" />
                      <span>Số lượng phát hành giới hạn (Edition Size):</span>
                    </div>
                    <p className="text-[11px] text-[#7B6E64] mb-2">
                      Hệ thống sẽ tự động sinh N số serial độc bản (ví dụ 01/50, 02/50...) trong bảng <code className="font-mono">edition_units</code>.
                    </p>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={formData.editionSize || 25}
                      onChange={(e) => setFormData({ ...formData, editionSize: Number(e.target.value) })}
                      className="w-24 px-3 py-1.5 bg-white border border-[#D2C8BA] rounded-[2px] font-mono text-xs font-bold"
                    />
                  </div>
                )}

                <div className="pt-4 border-t border-[#D2C8BA] flex items-center justify-end gap-3 shrink-0">
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
                    {submitting ? 'Đang lưu...' : editingVariant ? 'Cập nhật' : 'Tạo biến thể'}
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
