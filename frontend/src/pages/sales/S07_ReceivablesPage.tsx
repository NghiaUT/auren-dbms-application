// ============================================================================
// File: frontend/src/pages/sales/S07_ReceivablesPage.tsx
// Mã màn hình: S07 | Route: /sales/receivables | FR: FR13
// Vai trò: Sổ theo dõi công nợ & quá hạn — Liệt kê các khoản thanh toán chưa tất toán
//          của các đơn do Sales phụ trách (R9), tính số ngày quá hạn và nút đánh dấu quá hạn.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CreditCard, AlertCircle, RefreshCw, CheckCircle2, Filter, AlertTriangle } from 'lucide-react';
import { SalesHeaderNav } from '../../components/layout';
import { getSalesReceivablesApi, markOverdueApi } from '../../api/sales.api';
import type { PageMeta, ReceivableItem } from '../../types';
import { formatVND } from '../../utils/formatVND';
import { formatDate } from '../../utils/formatDate';

export const S07_ReceivablesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStatus = searchParams.get('status') || '';
  const currentPage = Number(searchParams.get('page')) || 1;

  const [receivables, setReceivables] = useState<ReceivableItem[]>([]);
  const [meta, setMeta] = useState<PageMeta & { totalOutstanding: number }>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    totalOutstanding: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchReceivables = async () => {
    try {
      setLoading(true);
      const res = await getSalesReceivablesApi({
        status: currentStatus || undefined,
        page: currentPage,
        limit: 10,
      });
      setReceivables(res.data);
      setMeta(res.meta);
    } catch (err: any) {
      console.error('Lỗi khi nạp danh sách công nợ:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceivables();
  }, [currentStatus, currentPage]);

  const handleStatusFilterChange = (status: string) => {
    const params: Record<string, string> = { page: '1' };
    if (status) params.status = status;
    setSearchParams(params);
  };

  const handleMarkOverdue = async () => {
    try {
      setActionLoading(true);
      setFeedback(null);
      const res = await markOverdueApi();
      setFeedback({
        text: `Đã tự động cập nhật ${res.updated} khoản thanh toán quá hạn (due_date < hôm nay) sang trạng thái 'overdue'.`,
        type: 'success',
      });
      await fetchReceivables();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Không thể cập nhật nợ quá hạn.';
      setFeedback({ text: msg, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#FCF9F3]">
      <SalesHeaderNav />

      <main className="max-w-[1600px] mx-auto px-6 md:px-12">
        {/* Tiêu đề & Tổng công nợ */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A7824B] font-bold">
              Receivables Ledger & Aging
            </span>
            <h2 className="font-serif text-3xl text-[#0D0703] mt-1">Sổ Theo Dõi Công Nợ Phải Thu</h2>
            <p className="font-sans text-xs text-[#7B6E64] mt-1">
              Quy tắc R9: Chỉ hiển thị các khoản thanh toán thuộc các đơn hàng do chính bạn phụ trách.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleMarkOverdue}
              disabled={actionLoading || loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#271E18] hover:bg-[#0D0703] text-[#FAF8F3] rounded-[2px] text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-[#A7824B]" />
              <span>{actionLoading ? 'Đang cập nhật...' : 'Đánh Dấu Khoản Quá Hạn'}</span>
            </button>

            <button
              onClick={fetchReceivables}
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
            className={`p-4 mb-6 text-xs uppercase tracking-wider font-semibold rounded-[2px] flex items-center justify-between border ${
              feedback.type === 'success'
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

        {/* Banner Tổng Giá Trị Công Nợ Chưa Thu */}
        <section className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#7B6E64] block">
              Tổng Giá Trị Công Nợ Cần Thu Hồi
            </span>
            <span className="font-serif text-3xl font-medium text-[#0D0703] block mt-1">
              {formatVND(meta.totalOutstanding)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-[#7B6E64]" />
            <select
              value={currentStatus}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="text-xs bg-white border border-[#D2C8BA] rounded-[2px] px-3 py-2 text-[#0D0703] focus:outline-none focus:border-[#271E18]"
            >
              <option value="">Tất cả (Chờ thu & Quá hạn)</option>
              <option value="pending">Chỉ khoản chờ thu (Pending)</option>
              <option value="overdue">Chỉ khoản quá hạn (Overdue)</option>
            </select>
          </div>
        </section>

        {/* ============================================================ */}
        {/* BẢNG SỔ NỢ (RECEIVABLES TABLE)                               */}
        {/* ============================================================ */}
        <section className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] overflow-hidden shadow-xs">
          {loading ? (
            <div className="py-20 text-center text-xs text-[#7B6E64]">
              Đang tải danh mục công nợ...
            </div>
          ) : receivables.length === 0 ? (
            <div className="py-16 text-center">
              <CheckCircle2 className="w-8 h-8 text-[#246A38] mx-auto mb-2 opacity-80" />
              <p className="font-serif text-lg text-[#0D0703]">Không có khoản nợ nào tồn đọng</p>
              <p className="font-sans text-xs text-[#7B6E64] mt-1">
                Toàn bộ các đơn hàng do bạn phụ trách đã được quyết toán hoặc chưa đến hạn.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#D2C8BA] bg-[#F4EFE6]/60 text-[10px] font-mono uppercase tracking-widest text-[#7B6E64]">
                    <th className="py-3.5 px-5">Khoản ID</th>
                    <th className="py-3.5 px-4">Đơn Hàng</th>
                    <th className="py-3.5 px-4">Khách Hàng</th>
                    <th className="py-3.5 px-4">Loại Đợt</th>
                    <th className="py-3.5 px-4 text-right">Số Tiền Nợ</th>
                    <th className="py-3.5 px-4">Hạn Thu</th>
                    <th className="py-3.5 px-4 text-center">Trễ Hạn</th>
                    <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                    <th className="py-3.5 px-5 text-right">Chi Tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D2C8BA]/30 font-sans text-xs">
                  {receivables.map((r) => (
                    <tr key={r.id} className="hover:bg-white/70 transition-colors">
                      <td className="py-4 px-5 font-mono text-[#7B6E64]">
                        #{r.id}
                      </td>
                      <td className="py-4 px-4 font-mono font-semibold text-[#0D0703]">
                        <Link to={`/sales/orders/${r.orderId}`} className="hover:underline">
                          #AUR-2026-{String(r.orderId).padStart(4, '0')}
                        </Link>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-[#0D0703] block">{r.customer.fullName}</span>
                        {r.customer.phone && (
                          <span className="text-[10px] text-[#7B6E64] block">{r.customer.phone}</span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-mono uppercase text-[11px] text-[#503625]">
                        {r.type}
                      </td>
                      <td className="py-4 px-4 text-right font-serif font-medium text-sm text-[#0D0703]">
                        {formatVND(r.amount)}
                      </td>
                      <td className="py-4 px-4 text-[#7B6E64]">
                        {r.dueDate ? formatDate(r.dueDate) : '—'}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {r.daysOverdue > 0 ? (
                          <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-[1px] bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2]">
                            +{r.daysOverdue} ngày
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-[#7B6E64]">Đúng hạn</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-[1px] border ${
                            r.status === 'overdue'
                              ? 'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]'
                              : 'bg-[#FFF8E1] text-[#8D6E63] border-[#FFE082]'
                          }`}
                        >
                          {r.status === 'overdue' ? 'Quá hạn' : 'Chờ thu'}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <Link
                          to={`/sales/orders/${r.orderId}/payments`}
                          className="text-[11px] font-semibold text-[#0D0703] hover:underline"
                        >
                          Xem Lịch →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Phân trang */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-[#D2C8BA]/40 bg-[#F4EFE6]/30 text-xs">
              <span className="text-[#7B6E64]">
                Hiển thị trang {meta.page} trên {meta.totalPages} ({meta.total} khoản)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={meta.page <= 1}
                  onClick={() => setSearchParams({ status: currentStatus, page: String(meta.page - 1) })}
                  className="px-3 py-1 bg-white border border-[#D2C8BA] rounded-[2px] disabled:opacity-40"
                >
                  Trước
                </button>
                <button
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setSearchParams({ status: currentStatus, page: String(meta.page + 1) })}
                  className="px-3 py-1 bg-white border border-[#D2C8BA] rounded-[2px] disabled:opacity-40"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
export default S07_ReceivablesPage;
