// ============================================================================
// File: frontend/src/pages/sales/S01_SalesDashboardPage.tsx
// Mã màn hình: S01 | Route: /sales | FR: FR11-13
// Vai trò: Bảng điều khiển Sales — Tổng hợp số đơn chờ nhận, biến thể sắp hết,
//          tổng nợ quá hạn và danh sách các đơn hàng cần hành động gấp.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, FileText, AlertCircle, DollarSign, ArrowRight, CheckCircle2, ChevronRight, RefreshCw } from 'lucide-react';
import { SalesHeaderNav } from '../../components/SalesHeaderNav';
import { getSalesSummaryApi, getSalesOrderQueueApi, claimOrderApi } from '../../api/sales.api';
import type { SalesDashboardSummary, SalesOrderQueueItem } from '../../types';
import { formatVND } from '../../utils/formatVND';

export const S01_SalesDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<SalesDashboardSummary | null>(null);
  const [recentUnassigned, setRecentUnassigned] = useState<SalesOrderQueueItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, queueRes] = await Promise.all([
        getSalesSummaryApi(),
        getSalesOrderQueueApi({ tab: 'unassigned', limit: 5 }),
      ]);
      setSummary(sumRes);
      setRecentUnassigned(queueRes.data);
    } catch (err: any) {
      console.error('Lỗi khi nạp dữ liệu Sales Dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleClaim = async (orderId: number) => {
    try {
      setActionLoading(orderId);
      setActionMessage(null);
      await claimOrderApi(orderId);
      setActionMessage({ text: `Đã tiếp nhận thành công đơn hàng #AUR-2026-${orderId}!`, type: 'success' });
      await fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Không thể nhận đơn hàng này.';
      setActionMessage({ text: msg, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#FCF9F3]">
      <SalesHeaderNav />

      <main className="max-w-[1600px] mx-auto px-6 md:px-12">
        {/* Banner thông báo thao tác */}
        {actionMessage && (
          <div
            className={`p-4 mb-6 text-xs uppercase tracking-wider font-semibold rounded-[2px] flex items-center justify-between border ${
              actionMessage.type === 'success'
                ? 'bg-[#EBF3ED] text-[#246A38] border-[#246A38]/30'
                : 'bg-[#FDF2F2] text-[#BA1A1A] border-[#BA1A1A]/30'
            }`}
          >
            <span>{actionMessage.text}</span>
            <button
              onClick={() => setActionMessage(null)}
              className="text-xs font-bold hover:opacity-75"
            >
              ✕
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* 4 THẺ KPI TỔNG HỢP                                          */}
        {/* ============================================================ */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl text-[#0D0703]">Chỉ Số Hoạt Động Trọng Yếu (KPIs)</h2>
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs text-[#7B6E64] hover:text-[#0D0703] transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Đơn chờ tiếp nhận */}
            <Link
              to="/sales/orders?tab=unassigned"
              className="p-6 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] hover:border-[#271E18] transition-all hover:shadow-md block group"
            >
              <div className="flex items-center justify-between text-[#7B6E64] mb-2">
                <span className="font-mono text-[10px] uppercase tracking-widest">Đơn chờ tiếp nhận</span>
                <Clock className="w-4 h-4 text-[#A7824B]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl font-medium text-[#0D0703]">
                  {summary ? summary.pendingUnassignedCount : '—'}
                </span>
                <span className="text-xs text-[#7B6E64]">đơn chưa nhận</span>
              </div>
              <p className="font-sans text-[11px] text-[#A7824B] mt-3 group-hover:underline flex items-center gap-1 font-semibold">
                Xem hàng đợi chờ nhận <ChevronRight className="w-3.5 h-3.5" />
              </p>
            </Link>

            {/* Card 2: Đơn tôi đang xử lý */}
            <Link
              to="/sales/orders?tab=my_orders"
              className="p-6 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] hover:border-[#271E18] transition-all hover:shadow-md block group"
            >
              <div className="flex items-center justify-between text-[#7B6E64] mb-2">
                <span className="font-mono text-[10px] uppercase tracking-widest">Đang điều phối</span>
                <FileText className="w-4 h-4 text-[#503625]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl font-medium text-[#0D0703]">
                  {summary ? summary.myProcessingOrdersCount : '—'}
                </span>
                <span className="text-xs text-[#7B6E64]">đơn phụ trách</span>
              </div>
              <p className="font-sans text-[11px] text-[#503625] mt-3 group-hover:underline flex items-center gap-1 font-semibold">
                Xem đơn tôi phụ trách <ChevronRight className="w-3.5 h-3.5" />
              </p>
            </Link>

            {/* Card 3: Biến thể sắp hết */}
            <Link
              to="/sales/inventory/low-stock"
              className="p-6 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] hover:border-[#271E18] transition-all hover:shadow-md block group"
            >
              <div className="flex items-center justify-between text-[#7B6E64] mb-2">
                <span className="font-mono text-[10px] uppercase tracking-widest">Cảnh báo tồn kho</span>
                <AlertCircle className="w-4 h-4 text-[#BA1A1A]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`font-serif text-3xl font-medium ${summary && summary.lowStockVariantsCount > 0 ? 'text-[#BA1A1A]' : 'text-[#0D0703]'}`}>
                  {summary ? summary.lowStockVariantsCount : '—'}
                </span>
                <span className="text-xs text-[#7B6E64]">biến thể dưới ngưỡng</span>
              </div>
              <p className="font-sans text-[11px] text-[#BA1A1A] mt-3 group-hover:underline flex items-center gap-1 font-semibold">
                Kiểm tra & Nhập kho <ChevronRight className="w-3.5 h-3.5" />
              </p>
            </Link>

            {/* Card 4: Công nợ quá hạn */}
            <Link
              to="/sales/receivables"
              className="p-6 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] hover:border-[#271E18] transition-all hover:shadow-md block group"
            >
              <div className="flex items-center justify-between text-[#7B6E64] mb-2">
                <span className="font-mono text-[10px] uppercase tracking-widest">Công nợ quá hạn</span>
                <DollarSign className="w-4 h-4 text-[#BA1A1A]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-2xl font-medium text-[#BA1A1A]">
                  {summary ? formatVND(summary.myOverdueReceivablesAmount) : '—'}
                </span>
              </div>
              <p className="font-sans text-[11px] text-[#7B6E64] mt-3 group-hover:underline flex items-center gap-1 font-semibold">
                Mở sổ theo dõi nợ <ChevronRight className="w-3.5 h-3.5" />
              </p>
            </Link>
          </div>
        </section>

        {/* ============================================================ */}
        {/* DANH SÁCH ĐƠN HÀNG CHỜ TIẾP NHẬN GẤP                          */}
        {/* ============================================================ */}
        <section className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#D2C8BA]/40">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A7824B] font-bold">
                Action Required
              </span>
              <h3 className="font-serif text-2xl text-[#0D0703] mt-1">
                Đơn Hàng Mới Chờ Nhân Viên Tiếp Nhận
              </h3>
              <p className="font-sans text-xs text-[#7B6E64]">
                Nhân viên Sales tiếp nhận để xác nhận đơn, khóa đơn và bắt đầu lập lịch điều phối White-Glove.
              </p>
            </div>

            <Link
              to="/sales/orders?tab=unassigned"
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-[#0D0703] hover:underline whitespace-nowrap"
            >
              <span>Xem toàn bộ hàng đợi ({summary?.pendingUnassignedCount || 0})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-[#7B6E64]">
              Đang tải danh sách đơn hàng...
            </div>
          ) : recentUnassigned.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle2 className="w-8 h-8 text-[#246A38] mx-auto mb-2 opacity-80" />
              <p className="font-serif text-lg text-[#0D0703]">Không có đơn hàng nào đang chờ tiếp nhận</p>
              <p className="font-sans text-xs text-[#7B6E64] mt-1">Toàn bộ đơn hàng đã được phân công nhân viên phụ trách.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#D2C8BA] text-[10px] font-mono uppercase tracking-widest text-[#7B6E64]">
                    <th className="py-3 px-4">Mã Đơn</th>
                    <th className="py-3 px-4">Thời Gian Đặt</th>
                    <th className="py-3 px-4">Khách Hàng</th>
                    <th className="py-3 px-4">Số Dòng Hàng</th>
                    <th className="py-3 px-4 text-right">Tổng Giá Trị</th>
                    <th className="py-3 px-4 text-center">Tác Vụ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D2C8BA]/30 font-sans text-xs">
                  {recentUnassigned.map((order) => (
                    <tr key={order.id} className="hover:bg-white/60 transition-colors">
                      <td className="py-4 px-4 font-mono font-semibold text-[#0D0703]">
                        #AUR-2026-{String(order.id).padStart(4, '0')}
                      </td>
                      <td className="py-4 px-4 text-[#7B6E64]">
                        {new Date(order.orderDate).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-[#0D0703] block">{order.customerName}</span>
                        <span className="text-[11px] text-[#7B6E64]">{order.customerEmail}</span>
                      </td>
                      <td className="py-4 px-4 text-[#7B6E64]">
                        {order.itemCount} tác phẩm
                      </td>
                      <td className="py-4 px-4 text-right font-serif font-medium text-sm text-[#0D0703]">
                        {formatVND(order.total)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleClaim(order.id)}
                          disabled={actionLoading === order.id}
                          className="px-3.5 py-1.5 bg-[#271E18] hover:bg-[#0D0703] text-[#FAF8F3] text-[10px] uppercase tracking-wider font-semibold rounded-[2px] transition-all disabled:opacity-50"
                        >
                          {actionLoading === order.id ? 'Đang nhận...' : 'Tiếp Nhận Đơn'}
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
    </div>
  );
};
export default S01_SalesDashboardPage;
