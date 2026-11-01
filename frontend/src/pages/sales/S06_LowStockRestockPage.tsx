// ============================================================================
// File: frontend/src/pages/sales/S06_LowStockRestockPage.tsx
// Mã màn hình: S06 | Route: /sales/inventory/low-stock | FR: FR12
// Vai trò: Cảnh báo biến thể sắp hết & Nhập kho có kiểm soát tương tranh —
//          Hiển thị các biến thể có tổng khả dụng toàn mạng lưới < ngưỡng (5),
//          cho phép mở modal nhập thêm hàng với Optimistic Concurrency Control (version).
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AlertTriangle, Plus, RefreshCw, CheckCircle2, ArrowLeft, ShieldAlert } from 'lucide-react';
import { SalesHeaderNav } from '../../components/layout';
import { getSalesLowStockApi, restockInventoryApi } from '../../api/sales.api';
import { useToast } from '../../context/ToastContext';
import type { InventoryItem } from '../../types';

export const S06_LowStockRestockPage: React.FC = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const prefillVariantId = searchParams.get('variantId');
  const prefillLocationId = searchParams.get('locationId');
  const prefillVersion = searchParams.get('version');
  const prefillSku = searchParams.get('sku');

  const [lowStockList, setLowStockList] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [threshold, setThreshold] = useState<number>(5);

  // Modal Nhập Kho State
  const [showRestockModal, setShowRestockModal] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<{
    variantId: number;
    locationId: number;
    sku: string;
    productName: string;
    locationName: string;
    version: number;
  } | null>(null);
  const [restockQty, setRestockQty] = useState<number>(5);
  const [restockLoading, setRestockLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchLowStock = async () => {
    try {
      setLoading(true);
      const data = await getSalesLowStockApi(threshold);
      setLowStockList(data);
    } catch (err: any) {
      console.error('Lỗi khi nạp cảnh báo tồn kho:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStock();
  }, [threshold]);

  // Tự động mở modal nếu có param chuyển từ S05
  useEffect(() => {
    if (prefillVariantId && prefillLocationId) {
      setSelectedItem({
        variantId: Number(prefillVariantId),
        locationId: Number(prefillLocationId),
        sku: prefillSku || `Variant #${prefillVariantId}`,
        productName: 'Tác phẩm được chọn',
        locationName: `Showroom #${prefillLocationId}`,
        version: prefillVersion !== null && !isNaN(Number(prefillVersion))
          ? Number(prefillVersion)
          : 0,
      });
      setShowRestockModal(true);
    }
  }, [prefillVariantId, prefillLocationId, prefillVersion, prefillSku]);

  const openRestockModal = (item: InventoryItem) => {
    setSelectedItem({
      variantId: item.variantId,
      locationId: item.locationId,
      sku: item.sku,
      productName: item.productName,
      locationName: item.locationName,
      version: item.version,
    });
    setRestockQty(5);
    setFeedback(null);
    setShowRestockModal(true);
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    if (restockQty <= 0) {
      setFeedback({ text: 'Số lượng nhập kho phải lớn hơn 0.', type: 'error' });
      return;
    }

    try {
      setRestockLoading(true);
      setFeedback(null);
      await restockInventoryApi({
        variantId: selectedItem.variantId,
        locationId: selectedItem.locationId,
        quantity: restockQty,
        version: selectedItem.version,
      });

      const successMsg = `Đã nhập thêm +${restockQty} chiếc cho SKU ${selectedItem.sku} thành công! Phiên bản đã được cập nhật.`;
      setFeedback({
        text: successMsg,
        type: 'success',
      });
      toast.success(successMsg);
      setShowRestockModal(false);
      await fetchLowStock();
    } catch (err: any) {
      if (err.response?.data?.error?.code === 'VERSION_CONFLICT') {
        const conflictMsg = 'Xung đột phiên bản (VERSION_CONFLICT): Tồn kho của tác phẩm này vừa được cập nhật bởi một phiên làm việc khác. Dữ liệu đã được làm mới, vui lòng nhập lại!';
        setFeedback({
          text: conflictMsg,
          type: 'error',
        });
        toast.error(err, conflictMsg);
        await fetchLowStock();
      } else {
        const msg = err.response?.data?.error?.message || 'Không thể nhập hàng.';
        setFeedback({ text: msg, type: 'error' });
        toast.error(err, msg);
      }
    } finally {
      setRestockLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#FCF9F3]">
      <SalesHeaderNav />

      <main className="max-w-[1600px] mx-auto px-6 md:px-12">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link
              to="/sales/inventory"
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-[#7B6E64] hover:text-[#0D0703] transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại sổ tồn kho showroom</span>
            </Link>
            <h2 className="font-serif text-3xl text-[#0D0703]">
              Cảnh Báo Thiếu Hụt & Nhập Kho Nhanh
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] px-3 py-1.5 text-xs">
              <span className="text-[#7B6E64]">Ngưỡng cảnh báo:</span>
              <select
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="bg-transparent font-semibold text-[#0D0703] focus:outline-none"
              >
                <option value={3}>Dưới 3 chiếc</option>
                <option value={5}>Dưới 5 chiếc (Mặc định)</option>
                <option value={10}>Dưới 10 chiếc</option>
              </select>
            </div>

            <button
              onClick={fetchLowStock}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] text-xs font-semibold uppercase tracking-wider text-[#372A22] hover:bg-[#FAF8F3] transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* Thông báo thao tác */}
        {feedback && (
          <div
            className={`p-4 mb-6 text-xs uppercase tracking-wider font-semibold rounded-[2px] flex items-center justify-between border ${feedback.type === 'success'
                ? 'bg-[#EBF3ED] text-[#246A38] border-[#246A38]/30'
                : 'bg-[#FDF2F2] text-[#BA1A1A] border-[#BA1A1A]/30'
              }`}
          >
            <span>{feedback.text}</span>
            <button onClick={() => setFeedback(null)} className="text-xs font-bold hover:opacity-75">
              ✕
            </button>
          </div>
        )}

        {/* Giới thiệu cơ chế Optimistic Concurrency Control */}
        <div className="p-4 bg-[#F5EFE6]/60 border border-[#D2C8BA] rounded-[2px] mb-6 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-[#A7824B] shrink-0 mt-0.5" />
          <div className="text-xs text-[#503625] leading-relaxed font-sans">
            <strong className="font-semibold block uppercase font-mono text-[10px] tracking-wider mb-0.5">
              Optimistic Concurrency Control (FR12)
            </strong>
            Hệ thống quản lý phiên bản độc lập qua cột <code className="bg-white/80 px-1 py-0.5 rounded font-mono">version</code> của bảng tồn kho. Khi có nhiều chi nhánh cùng nhập hàng hoặc xuất kho đồng thời, giao dịch gửi sau có phiên bản cũ sẽ bị từ chối an toàn để bảo toàn số liệu kho.
          </div>
        </div>

        {/* ============================================================ */}
        {/* BẢNG CẢNH BÁO TỒN KHO THẤP                                   */}
        {/* ============================================================ */}
        <section className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] overflow-hidden shadow-xs">
          {loading ? (
            <div className="py-20 text-center text-xs text-[#7B6E64]">
              Đang phân tích dữ liệu tồn kho bằng Subquery...
            </div>
          ) : lowStockList.length === 0 ? (
            <div className="py-16 text-center">
              <CheckCircle2 className="w-8 h-8 text-[#246A38] mx-auto mb-2 opacity-80" />
              <p className="font-serif text-lg text-[#0D0703]">Toàn bộ biến thể đều đảm bảo mức an toàn</p>
              <p className="font-sans text-xs text-[#7B6E64] mt-1">
                Không có tác phẩm nào có tổng tồn khả dụng toàn mạng lưới dưới {threshold} chiếc.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#D2C8BA] bg-[#F4EFE6]/60 text-[10px] font-mono uppercase tracking-widest text-[#7B6E64]">
                    <th className="py-3.5 px-5">Mã SKU</th>
                    <th className="py-3.5 px-4">Tác Phẩm Kiến Trúc</th>
                    <th className="py-3.5 px-4">Showroom / Kho</th>
                    <th className="py-3.5 px-4 text-right">Khả Dụng Tại Chỗ</th>
                    <th className="py-3.5 px-4 text-right">Tổng Toàn Hệ Thống</th>
                    <th className="py-3.5 px-4 text-center">Mức Độ Cảnh Báo</th>
                    <th className="py-3.5 px-5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D2C8BA]/30 font-sans text-xs">
                  {lowStockList.map((item) => (
                    <tr key={`${item.variantId}-${item.locationId}`} className="hover:bg-white/70 transition-colors">
                      <td className="py-4 px-5 font-mono font-semibold text-[#0D0703]">
                        {item.sku}
                      </td>
                      <td className="py-4 px-4 font-medium text-[#0D0703]">
                        {item.productName}
                      </td>
                      <td className="py-4 px-4 text-[#7B6E64]">
                        {item.locationName}
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-semibold text-[#BA1A1A]">
                        {item.available} chiếc
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-bold text-[#BA1A1A]">
                        {item.totalAvailable} chiếc
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-[1px] bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2]">
                          Cần nhập gấp
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => openRestockModal(item)}
                          className="px-3.5 py-1.5 bg-[#271E18] hover:bg-[#0D0703] text-[#FAF8F3] text-[10px] uppercase tracking-wider font-semibold rounded-[2px] transition-all"
                        >
                          + Nhập Thêm Hàng
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* ============================================================ */}
      {/* MODAL: NHẬP HÀNG (RESTOCK MODAL - FR12)                      */}
      {/* ============================================================ */}
      {showRestockModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] max-w-md w-full p-6 shadow-xl">
            <h4 className="font-serif text-xl text-[#0D0703] mb-1">Nhập Thêm Tồn Kho Kiến Trúc</h4>
            <p className="font-sans text-xs text-[#7B6E64] mb-4">
              Cập nhật số lượng tồn thực tế cho tác phẩm tại showroom được chỉ định.
            </p>

            <div className="p-3 bg-white border border-[#D2C8BA] rounded-[2px] mb-4 text-xs font-sans space-y-1">
              <p>Mã SKU: <strong className="font-mono text-[#0D0703]">{selectedItem.sku}</strong></p>
              <p>Địa điểm: <strong className="text-[#0D0703]">{selectedItem.locationName}</strong></p>
              <p className="text-[10px] font-mono text-[#7B6E64]">Version kiểm soát: #{selectedItem.version}</p>
            </div>

            <form onSubmit={handleRestockSubmit}>
              <div className="mb-6">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7B6E64] mb-1">
                  Số Lượng Nhập Thêm (+ chiếc)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                  className="w-full text-xs p-2.5 bg-white border border-[#D2C8BA] rounded-[2px] text-[#0D0703] font-mono focus:outline-none focus:border-[#271E18]"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRestockModal(false)}
                  className="px-4 py-2 text-xs uppercase tracking-wider font-semibold text-[#7B6E64] hover:text-[#0D0703]"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={restockLoading}
                  className="px-4 py-2 bg-[#271E18] hover:bg-[#0D0703] text-[#FAF8F3] text-xs uppercase tracking-wider font-semibold rounded-[2px] disabled:opacity-50"
                >
                  {restockLoading ? 'Đang cập nhật...' : 'Xác Nhận Nhập Kho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default S06_LowStockRestockPage;
