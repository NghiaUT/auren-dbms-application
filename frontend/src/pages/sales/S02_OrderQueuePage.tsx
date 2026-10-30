// ============================================================================
// File: frontend/src/pages/sales/S02_OrderQueuePage.tsx
// Mã màn hình: S02 | Route: /sales/orders | FR: FR11
// Vai trò: Hàng đợi đơn hàng Sales — Gồm 2 tab:
//          - Tab 1 "Chờ tiếp nhận": Toàn bộ đơn pending chưa có ai nhận, có nút Tiếp nhận (Claim).
//          - Tab 2 "Đơn của tôi": Các đơn do Sales hiện tại phụ trách, lọc theo status,
//            dẫn đến trang chi tiết xử lý tiến độ S03.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Inbox, UserCheck, ChevronRight, RefreshCw, Filter } from 'lucide-react';
import { SalesHeaderNav } from '../../components/layout';
import { getSalesOrderQueueApi, claimOrderApi } from '../../api/sales.api';
import type { OrderStatus, PageMeta, SalesOrderQueueItem } from '../../types';
import { formatVND } from '../../utils/formatVND';

const STATUS_LABELS: Record<OrderStatus, { label: string; bg: string; text: string; border: string }> = {
  pending: { label: 'Chờ duyệt', bg: 'bg-[#FFF8E1]', text: 'text-[#8D6E63]', border: 'border-[#FFE082]' },
  confirmed: { label: 'Đã xác nhận', bg: 'bg-[#E3F2FD]', text: 'text-[#1976D2]', border: 'border-[#90CAF9]' },
  in_production: { label: 'Đang chế tác', bg: 'bg-[#F3E5F5]', text: 'text-[#7B1FA2]', border: 'border-[#CE93D8]' },
  shipped: { label: 'Đang vận chuyển', bg: 'bg-[#E0F2F1]', text: 'text-[#00796B]', border: 'border-[#80CBC4]' },
  delivered: { label: 'Đã bàn giao', bg: 'bg-[#E8F5E9]', text: 'text-[#2E7D32]', border: 'border-[#A5D6A7]' },
  cancelled: { label: 'Đã huỷ', bg: 'bg-[#FFEBEE]', text: 'text-[#C62828]', border: 'border-[#FFCDD2]' },
};

export const S02_OrderQueuePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = (searchParams.get('tab') as 'unassigned' | 'my_orders') || 'unassigned';
  const currentStatus = searchParams.get('status') || '';
  const currentPage = Number(searchParams.get('page')) || 1;

  const [orders, setOrders] = useState<SalesOrderQueueItem[]>([]);
  const [meta, setMeta] = useState<PageMeta>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await getSalesOrderQueueApi({
        tab: currentTab,
        status: currentStatus || undefined,
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
      });
      setOrders(res.data);
      setMeta(res.meta);
    } catch (err: any) {
      console.error('Lỗi khi nạp hàng đợi đơn:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentTab, currentStatus, currentPage]);

  const handleTabChange = (tab: 'unassigned' | 'my_orders') => {
    setSearchParams({ tab, page: '1' });
    setFeedback(null);
  };

  const handleStatusFilterChange = (status: string) => {
    const params: Record<string, string> = { tab: currentTab, page: '1' };
    if (status) params.status = status;
    setSearchParams(params);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleClaim = async (orderId: number) => {
    try {
      setActionLoading(orderId);
      setFeedback(null);
      await claimOrderApi(orderId);
      setFeedback({ text: `Đã tiếp nhận thành công đơn hàng #AUR-2026-${orderId}!`, type: 'success' });
      await fetchOrders();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Không thể nhận đơn hàng này.';
      setFeedback({ text: msg, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#FCF9F3]">
      <SalesHeaderNav />

      <main className="max-w-[1600px] mx-auto px-6 md:px-12">
        {/* Tiêu đề & Giới thiệu */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A7824B] font-bold">
              Dispatch Ledger
            </span>
            <h2 className="font-serif text-3xl text-[#0D0703] mt-1">Hàng Đợi Xử Lý Đơn Hàng</h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchOrders}
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

        {/* ============================================================ */}
        {/* TABS & BỘ LỌC TÌM KIẾM                                       */}
        {/* ============================================================ */}
        <div className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] mb-6 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Tab chuyển đổi Unassigned vs My Orders */}
            <div className="flex items-center gap-2 border-b lg:border-b-0 border-[#D2C8BA]/40 pb-3 lg:pb-0">
              <button
                type="button"
                onClick={() => handleTabChange('unassigned')}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-[0.12em] font-semibold rounded-[2px] transition-all ${
                  currentTab === 'unassigned'
                    ? 'bg-[#271E18] text-[#FAF8F3]'
                    : 'bg-white text-[#7B6E64] border border-[#D2C8BA]/60 hover:text-[#0D0703]'
                }`}
              >
                <Inbox className="w-3.5 h-3.5" />
                <span>Chờ Tiếp Nhận (Mới)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('my_orders')}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-[0.12em] font-semibold rounded-[2px] transition-all ${
                  currentTab === 'my_orders'
                    ? 'bg-[#271E18] text-[#FAF8F3]'
                    : 'bg-white text-[#7B6E64] border border-[#D2C8BA]/60 hover:text-[#0D0703]'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Đơn Tôi Đang Phụ Trách</span>
              </button>
            </div>

            {/* Tìm kiếm & Lọc theo Status (chỉ hiện khi xem My Orders) */}
            <div className="flex flex-wrap items-center gap-3">
              {currentTab === 'my_orders' && (
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-[#7B6E64]" />
                  <select
                    value={currentStatus}
                    onChange={(e) => handleStatusFilterChange(e.target.value)}
                    className="text-xs bg-white border border-[#D2C8BA] rounded-[2px] px-3 py-2 text-[#0D0703] focus:outline-none focus:border-[#271E18]"
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="confirmed">Đã xác nhận</option>
                    <option value="in_production">Đang chế tác</option>
                    <option value="shipped">Đang vận chuyển</option>
                    <option value="delivered">Đã bàn giao</option>
                    <option value="cancelled">Đã huỷ</option>
                  </select>
                </div>
              )}

              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm mã đơn, tên khách..."
                    className="text-xs bg-white border border-[#D2C8BA] rounded-[2px] pl-8 pr-3 py-2 text-[#0D0703] w-48 sm:w-64 focus:outline-none focus:border-[#271E18]"
                  />
                  <Search className="w-3.5 h-3.5 text-[#7B6E64] absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="submit"
                  className="px-3 py-2 bg-[#FAF8F3] hover:bg-white border border-[#D2C8BA] rounded-[2px] text-xs uppercase tracking-wider font-semibold text-[#0D0703]"
                >
                  Tìm
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* BẢNG DỮ LIỆU ĐƠN HÀNG (ATELIER LEDGER)                        */}
        {/* ============================================================ */}
        <section className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] overflow-hidden shadow-xs">
          {loading ? (
            <div className="py-20 text-center text-xs text-[#7B6E64]">
              Đang tải dữ liệu hàng đợi...
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-serif text-lg text-[#0D0703]">Không tìm thấy đơn hàng nào</p>
              <p className="font-sans text-xs text-[#7B6E64] mt-1">
                {currentTab === 'unassigned'
                  ? 'Tuyệt vời! Hiện không còn đơn nào tồn đọng chưa được tiếp nhận.'
                  : 'Bạn chưa có đơn hàng nào khớp với điều kiện lọc này.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#D2C8BA] bg-[#F4EFE6]/60 text-[10px] font-mono uppercase tracking-widest text-[#7B6E64]">
                    <th className="py-3.5 px-5">Mã Đơn</th>
                    <th className="py-3.5 px-4">Ngày Đặt</th>
                    <th className="py-3.5 px-4">Khách Hàng</th>
                    <th className="py-3.5 px-4">Số Dòng</th>
                    <th className="py-3.5 px-4 text-right">Tổng Tiền</th>
                    <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                    <th className="py-3.5 px-5 text-right">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D2C8BA]/30 font-sans text-xs">
                  {orders.map((order) => {
                    const badge = STATUS_LABELS[order.status] || STATUS_LABELS.pending;

                    return (
                      <tr key={order.id} className="hover:bg-white/70 transition-colors">
                        <td className="py-4 px-5 font-mono font-semibold text-[#0D0703]">
                          #AUR-2026-{String(order.id).padStart(4, '0')}
                        </td>
                        <td className="py-4 px-4 text-[#7B6E64]">
                          {new Date(order.orderDate).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-semibold text-[#0D0703] block">{order.customerName}</span>
                          <span className="text-[11px] text-[#7B6E64]">{order.customerEmail}</span>
                          {order.customerPhone && (
                            <span className="text-[10px] text-[#A7824B] block">{order.customerPhone}</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-[#7B6E64]">
                          {order.itemCount} tác phẩm
                        </td>
                        <td className="py-4 px-4 text-right font-serif font-medium text-sm text-[#0D0703]">
                          {formatVND(order.total)}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-[1px] border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right">
                          {currentTab === 'unassigned' ? (
                            <button
                              onClick={() => handleClaim(order.id)}
                              disabled={actionLoading === order.id}
                              className="px-3 py-1.5 bg-[#271E18] hover:bg-[#0D0703] text-[#FAF8F3] text-[10px] uppercase tracking-wider font-semibold rounded-[2px] transition-all disabled:opacity-50"
                            >
                              {actionLoading === order.id ? 'Đang nhận...' : 'Tiếp Nhận Đơn'}
                            </button>
                          ) : (
                            <Link
                              to={`/sales/orders/${order.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-[#D2C8BA] hover:border-[#271E18] text-[#0D0703] text-[10px] uppercase tracking-wider font-semibold rounded-[2px] transition-all"
                            >
                              <span>Xử Lý Đơn</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Phân trang */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-[#D2C8BA]/40 bg-[#F4EFE6]/30 text-xs">
              <span className="text-[#7B6E64]">
                Hiển thị trang {meta.page} trên tổng {meta.totalPages} ({meta.total} đơn)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={meta.page <= 1}
                  onClick={() => setSearchParams({ tab: currentTab, page: String(meta.page - 1) })}
                  className="px-3 py-1 bg-white border border-[#D2C8BA] rounded-[2px] disabled:opacity-40"
                >
                  Trước
                </button>
                <button
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setSearchParams({ tab: currentTab, page: String(meta.page + 1) })}
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
export default S02_OrderQueuePage;
