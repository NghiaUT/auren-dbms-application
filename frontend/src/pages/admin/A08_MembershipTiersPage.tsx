// ============================================================================
// File: frontend/src/pages/admin/A08_MembershipTiersPage.tsx
// Mã màn hình: A08 | Route: /admin/tiers | FR: FR15b
// Vai trò: Quản trị Hạng thành viên & Nâng hạng tự động — Cấu hình ngưỡng chi tiêu,
//          tính toán lại hạng thành viên hàng loạt trong Transaction ACID (UPDATE + Subquery).
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Edit2,
  RefreshCw,
  AlertCircle,
  Check,
  X,
  Sparkles,
  Zap,
  Users,
  Eye,
} from 'lucide-react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { getTiersApi, updateTierApi, recalculateTiersApi } from '../../api/admin.api';
import type { AdminTier, RecalculateTiersResult } from '../../types';
import { formatVND } from '../../utils/formatVND';

export const A08_MembershipTiersPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [tiers, setTiers] = useState<AdminTier[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit Tier Modal State
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [selectedTier, setSelectedTier] = useState<AdminTier | null>(null);
  const [tierForm, setTierForm] = useState<{ name: string; minSpent: number; discountPct: number }>({
    name: '',
    minSpent: 0,
    discountPct: 0,
  });
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Recalculate Modal State
  const [recalcModalOpen, setRecalcModalOpen] = useState<boolean>(false);
  const [recalcResult, setRecalcResult] = useState<RecalculateTiersResult | null>(null);
  const [recalcLoading, setRecalcLoading] = useState<boolean>(false);

  const fetchTiers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTiersApi();
      setTiers(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải danh sách hạng thành viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTiers();
  }, []);

  const openEditModal = (t: AdminTier) => {
    setSelectedTier(t);
    setTierForm({
      name: t.name,
      minSpent: t.minSpent,
      discountPct: t.discountPct,
    });
    setEditModalOpen(true);
  };

  const handleUpdateTierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTier) return;

    try {
      setSubmitting(true);
      setError(null);
      await updateTierApi(selectedTier.id, tierForm);
      setSuccessMsg(`Cập nhật cấu hình hạng "${tierForm.name}" thành công!`);
      setEditModalOpen(false);
      fetchTiers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Lỗi khi cập nhật hạng thành viên');
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Chạy xem trước nâng hạng (dryRun = true)
  const handlePreviewRecalculate = async () => {
    try {
      setRecalcLoading(true);
      setError(null);
      const res = await recalculateTiersApi(true);
      setRecalcResult(res);
      setRecalcModalOpen(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể chạy tính toán nâng hạng');
    } finally {
      setRecalcLoading(false);
    }
  };

  // 2. Xác nhận thực thi nâng hạng thực tế (dryRun = false)
  const handleExecuteRecalculate = async () => {
    try {
      setRecalcLoading(true);
      setError(null);
      const res = await recalculateTiersApi(false);
      setRecalcResult(res);
      setSuccessMsg(`Đã cập nhật nâng hạng thành công cho ${res.affected} khách hàng!`);
      fetchTiers();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Lỗi khi thực thi nâng hạng');
    } finally {
      setRecalcLoading(false);
    }
  };

  const totalCustomers = tiers.reduce((sum, t) => sum + t.customerCount, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D2C8BA]/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A7824B] font-bold">
                [FR15b] Membership & Loyalty Tiers
              </span>
              <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 bg-[#271E18] text-[#FAF8F3] font-bold rounded-[1px]">
                TRANSACTION ACID + SUBQUERY
              </span>
            </div>
            <h2 className="font-serif text-3xl text-[#0D0703] font-medium tracking-tight mt-1">
              Hạng thành viên & Nâng hạng Tự động
            </h2>
            <p className="font-sans text-xs text-[#7B6E64] mt-0.5">
              Cấu hình các mức chiết khấu và tự động hoá thăng hạng cho khách hàng dựa trên tổng chi tiêu tích luỹ.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchTiers}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs uppercase tracking-wider font-semibold border border-[#D2C8BA] bg-[#FAF8F3] hover:bg-white rounded-[2px] transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Tải lại</span>
            </button>

            <button
              onClick={handlePreviewRecalculate}
              disabled={recalcLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs uppercase tracking-wider font-semibold bg-[#A7824B] text-white rounded-[2px] hover:bg-[#8A6738] transition-colors shadow-xs"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>{recalcLoading ? 'Đang phân tích...' : 'Nâng hạng Tự động'}</span>
            </button>
          </div>
        </div>

        {/* Khối giải thích học thuật */}
        <div className="p-4 bg-[#FAF8F3] border-l-4 border-[#A7824B] border border-[#D2C8BA] rounded-[2px] text-xs space-y-1">
          <p className="font-semibold text-[#0D0703]">
            💡 Điểm trọng tâm môn học Cơ sở dữ liệu (Transaction ACID + UPDATE Subquery):
          </p>
          <p className="text-[#503625]">
            Tính năng nâng hạng tự động thực thi trong một <strong>Transaction ACID duy nhất</strong>: So khớp <code className="font-mono bg-[#EAE4D9] px-1 py-0.5 rounded-[2px]">total_spent</code> của từng khách hàng với hạng có <code className="font-mono bg-[#EAE4D9] px-1 py-0.5 rounded-[2px]">min_spent</code> cao nhất thoả điều kiện bằng Subquery, đảm bảo tính toàn vẹn dữ liệu tuyệt đối ngay cả khi có hàng nghìn bản ghi.
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

        {/* Bảng Danh sách Hạng */}
        <div className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] overflow-hidden">
          <div className="p-4 border-b border-[#D2C8BA]/60 flex items-center justify-between">
            <h3 className="font-serif text-lg text-[#0D0703] font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#A7824B]" />
              <span>Cấu trúc Phân hạng Khách hàng AUREN</span>
            </h3>
            <span className="font-mono text-xs text-[#7B6E64]">
              Tổng: {totalCustomers} khách hàng có hạng
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#D2C8BA] bg-[#EAE4D9]/40 text-[#503625] font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">ID</th>
                  <th className="py-3 px-4">Tên Hạng Thành viên</th>
                  <th className="py-3 px-4 text-right">Ngưỡng Chi tiêu Tối thiểu</th>
                  <th className="py-3 px-4 text-center">Ưu đãi Chiết khấu</th>
                  <th className="py-3 px-4 text-right">Số Khách hàng Hiện tại</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D2C8BA]/40 font-sans text-xs">
                {tiers.map((t) => (
                  <tr key={t.id} className="hover:bg-[#FAF8F3]/60 transition-colors">
                    <td className="py-3.5 px-4 text-center font-mono font-medium text-[#7B6E64]">
                      #{t.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-serif text-sm font-medium text-[#0D0703]">
                        {t.name}
                      </span>
                      {t.minSpent === 0 && (
                        <span className="ml-2 font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded-[1px]">
                          Khởi tạo
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-[#0D0703] tabular-nums text-sm">
                      {formatVND(t.minSpent)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 font-mono text-xs font-bold text-[#A7824B] bg-white border border-[#D2C8BA] rounded-[1px]">
                        -{t.discountPct}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-[#503625] tabular-nums">
                      {t.customerCount} thành viên
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => openEditModal(t)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#503625] bg-white border border-[#D2C8BA] rounded-[2px] hover:bg-[#FAF8F3]"
                      >
                        <Edit2 className="w-3 h-3 text-[#A7824B]" />
                        <span>Sửa</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Chỉnh sửa Hạng */}
        {editModalOpen && selectedTier && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-[#FAF8F3] border border-[#D2C8BA] w-full max-w-md rounded-[2px] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-4 border-b border-[#D2C8BA] flex items-center justify-between bg-white">
                <h3 className="font-serif text-lg font-medium text-[#0D0703]">
                  Chỉnh sửa Hạng #{selectedTier.id} — {selectedTier.name}
                </h3>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="text-[#7B6E64] hover:text-[#0D0703]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateTierSubmit} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#0D0703] mb-1">
                    Tên Hạng Thành viên <span className="text-[#BA1A1A]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={tierForm.name}
                    onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] focus:outline-none focus:border-[#0D0703]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#0D0703] mb-1">
                    Ngưỡng Chi tiêu Tối thiểu (VND) <span className="text-[#BA1A1A]">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={tierForm.minSpent}
                    onChange={(e) => setTierForm({ ...tierForm, minSpent: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] font-mono focus:outline-none focus:border-[#0D0703]"
                  />
                  <p className="text-[11px] text-[#7B6E64] mt-1">
                    Hiện tại: {formatVND(tierForm.minSpent)}
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-[#0D0703] mb-1">
                    Phần trăm Chiết khấu Giảm giá (% 0 - 100) <span className="text-[#BA1A1A]">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    value={tierForm.discountPct}
                    onChange={(e) => setTierForm({ ...tierForm, discountPct: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] font-mono focus:outline-none focus:border-[#0D0703]"
                  />
                </div>

                <div className="pt-4 border-t border-[#D2C8BA] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-4 py-2 border border-[#D2C8BA] font-semibold text-[#503625] hover:bg-white rounded-[2px]"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-[#0D0703] text-white font-semibold uppercase tracking-wider rounded-[2px] hover:bg-[#271E18]"
                  >
                    {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Xem trước & Thực thi Nâng hạng */}
        {recalcModalOpen && recalcResult && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-[#FAF8F3] border border-[#D2C8BA] w-full max-w-lg rounded-[2px] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-4 border-b border-[#D2C8BA] flex items-center justify-between bg-white">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#A7824B]" />
                  <h3 className="font-serif text-lg font-medium text-[#0D0703]">
                    {recalcResult.dryRun ? 'Xem trước Kết quả Nâng hạng Tự động' : 'Kết quả Nâng hạng Hoàn tất'}
                  </h3>
                </div>
                <button
                  onClick={() => setRecalcModalOpen(false)}
                  className="text-[#7B6E64] hover:text-[#0D0703]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                {recalcResult.affected === 0 ? (
                  <div className="p-4 bg-green-50 border border-green-200 text-green-900 rounded-[2px] text-center">
                    <p className="font-semibold text-sm">Hệ thống đã đồng bộ chuẩn xác!</p>
                    <p className="text-xs mt-1">
                      Tất cả khách hàng hiện tại đều đã ở đúng hạng thành viên tương ứng với tổng chi tiêu tích luỹ.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-white border border-[#D2C8BA] rounded-[2px]">
                      <span className="text-[#7B6E64]">Tổng số khách hàng sẽ được nâng hạng:</span>
                      <div className="font-serif text-2xl text-[#0D0703] font-bold mt-0.5">
                        {recalcResult.affected} khách hàng
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold text-[#0D0703] block mb-2">
                        Chi tiết thăng hạng theo từng mức:
                      </span>
                      <div className="border border-[#D2C8BA] rounded-[2px] overflow-hidden bg-white">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-[#EAE4D9]/40 border-b border-[#D2C8BA] font-mono text-[10px] uppercase text-[#503625]">
                              <th className="py-2 px-3">Hạng Đích</th>
                              <th className="py-2 px-3 text-right">Số lượng Khách hàng</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#D2C8BA]/40">
                            {recalcResult.changes.map((c) => (
                              <tr key={c.tierId}>
                                <td className="py-2.5 px-3 font-medium text-[#0D0703]">
                                  {c.tierName}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-[#A7824B]">
                                  +{c.count} khách
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}

                <div className="pt-4 border-t border-[#D2C8BA] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setRecalcModalOpen(false)}
                    className="px-4 py-2 border border-[#D2C8BA] font-semibold text-[#503625] hover:bg-white rounded-[2px]"
                  >
                    {recalcResult.dryRun && recalcResult.affected > 0 ? 'Đóng / Xem xét lại' : 'Đóng'}
                  </button>

                  {recalcResult.dryRun && recalcResult.affected > 0 && (
                    <button
                      type="button"
                      disabled={recalcLoading}
                      onClick={handleExecuteRecalculate}
                      className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#0D0703] text-white font-semibold uppercase tracking-wider rounded-[2px] hover:bg-[#271E18]"
                    >
                      <Zap className="w-3.5 h-3.5 fill-white" />
                      <span>{recalcLoading ? 'Đang thực thi ACID...' : 'Xác nhận Nâng hạng Thực tế'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
