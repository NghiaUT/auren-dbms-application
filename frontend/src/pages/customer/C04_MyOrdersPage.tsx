// ============================================================================
// File: frontend/src/pages/customer/C04_MyOrdersPage.tsx
// Mã màn hình: C04 | Route: /account/orders | FR: FR7, FR8, FR9
// Vai trò: Màn hình Đơn hàng của tôi (Customer Dashboard):
//          - Hiển thị hồ sơ khách hàng, chiết khấu hạng thành viên Patron
//          - Danh sách đơn hàng cá nhân, lọc theo trạng thái
//          - Xem chi tiết dòng hàng, số serial Limited, lịch thanh toán đợt
//          - Thanh toán trực tiếp các khoản chờ (FR7) và Huỷ đơn hàng (FR9)
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import {
  getMyOrdersApi,
  getOrderDetailApi,
  cancelOrderApi,
  payPaymentApi,
} from '../../api/order.api';
import type { OrderDetail, OrderStatus, OrderSummary } from '../../types';
import { formatVND } from '../../utils/formatVND';
import { formatDate } from '../../utils/formatDate';

const STATUS_MAP: Record<OrderStatus, { label: string; class: string }> = {
  pending: { label: 'Chờ duyệt', class: 'bg-amber-100 text-amber-900 border-amber-300' },
  confirmed: { label: 'Đã xác nhận', class: 'bg-blue-100 text-blue-900 border-blue-300' },
  in_production: { label: 'Đang chế tác', class: 'bg-purple-100 text-purple-900 border-purple-300' },
  shipped: { label: 'Đang vận chuyển', class: 'bg-indigo-100 text-indigo-900 border-indigo-300' },
  delivered: { label: 'Đã bàn giao', class: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  cancelled: { label: 'Đã hủy', class: 'bg-stone-200 text-stone-700 border-stone-300' },
};

export const C04_MyOrdersPage: React.FC = () => {
  const { user, logout } = useAuth();

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal chi tiết đơn hàng
  const [activeOrderDetail, setActiveOrderDetail] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Tải danh sách đơn hàng
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getMyOrdersApi({
        status: selectedStatus || undefined,
        page: currentPage,
        limit: 8,
      });
      setOrders(response.data);
      setTotalPages(response.meta.totalPages);
    } catch (err) {
      console.error('Lỗi khi tải đơn hàng:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, currentPage]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Xem chi tiết đơn
  const handleViewDetail = async (orderId: number) => {
    setDetailLoading(true);
    setActionMessage(null);
    try {
      const detail = await getOrderDetailApi(orderId);
      setActiveOrderDetail(detail);
    } catch (err) {
      console.error('Lỗi khi tải chi tiết đơn hàng:', err);
      alert('Không thể tải chi tiết đơn hàng.');
    } finally {
      setDetailLoading(false);
    }
  };

  // Thanh toán một khoản
  const handlePayPayment = async (paymentId: number) => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      await payPaymentApi(paymentId, 'bank_transfer');
      setActionMessage('Ghi nhận thanh toán thành công!');
      // Cập nhật lại chi tiết đơn và danh sách
      if (activeOrderDetail) {
        const refreshed = await getOrderDetailApi(activeOrderDetail.id);
        setActiveOrderDetail(refreshed);
      }
      fetchOrders();
    } catch (err: any) {
      console.error('Lỗi thanh toán:', err);
      alert(err.response?.data?.error?.message || 'Không thể thanh toán khoản này.');
    } finally {
      setActionLoading(false);
    }
  };

  // Hủy đơn hàng
  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm('Quý khách có chắc chắn muốn hủy đơn hàng này? Các bản Limited và tồn kho sẽ được giải phóng.')) {
      return;
    }

    setActionLoading(true);
    setActionMessage(null);
    try {
      await cancelOrderApi(orderId);
      setActionMessage('Đã hủy đơn hàng thành công.');
      if (activeOrderDetail && activeOrderDetail.id === orderId) {
        setActiveOrderDetail(null);
      }
      fetchOrders();
    } catch (err: any) {
      console.error('Lỗi hủy đơn:', err);
      alert(err.response?.data?.error?.message || 'Không thể hủy đơn hàng này.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="w-full pt-28 pb-20">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">

        {/* Header Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-sans text-[#7B6E64] mb-6">
          <Link to="/" className="hover:text-[#0D0703]">Trang chủ</Link>
          <span>/</span>
          <span className="text-[#0D0703] font-medium">Hồ sơ khách hàng Patron</span>
          <span>/</span>
          <span className="text-[#A7824B]">Lịch sử đơn hàng</span>
        </div>

        {/* Customer Profile Banner */}
        <div className="p-8 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-[#271E18] text-[#FAF8F3] flex items-center justify-center font-serif text-2xl font-bold">
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-serif text-3xl text-[#0D0703]">{user?.fullName}</h1>
                <span className="px-3 py-1 bg-[#503625] text-[#FAF8F3] text-[10px] font-sans font-bold uppercase tracking-widest rounded-[1px]">
                  {user?.customer?.tier?.name || 'Classic'} Patron
                </span>
              </div>
              <p className="font-sans text-xs text-[#7B6E64] mt-1">{user?.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-8 text-xs font-sans border-t md:border-t-0 md:border-l border-[#D2C8BA]/60 pt-4 md:pt-0 md:pl-8">
            <div>
              <span className="text-[#7B6E64] block text-[10px] uppercase tracking-wider mb-0.5">
                Tổng chi tiêu tích lũy
              </span>
              <span className="font-bold text-lg text-[#0D0703] tabular-nums">
                {formatVND(user?.customer?.totalSpent || 0)}
              </span>
            </div>
            {user?.customer?.tier && (
              <div>
                <span className="text-[#7B6E64] block text-[10px] uppercase tracking-wider mb-0.5">
                  Đặc quyền giảm giá
                </span>
                <span className="font-bold text-lg text-[#A7824B]">
                  -{user.customer.tier.discountPct}%
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => logout()}
              className="text-xs uppercase tracking-wider font-semibold text-[#BA1A1A] hover:underline"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-[#D2C8BA]/50 pb-4">
          {[
            { label: 'Tất cả đơn', value: '' },
            { label: 'Chờ duyệt', value: 'pending' },
            { label: 'Đã xác nhận', value: 'confirmed' },
            { label: 'Đang chế tác', value: 'in_production' },
            { label: 'Đang vận chuyển', value: 'shipped' },
            { label: 'Đã bàn giao', value: 'delivered' },
            { label: 'Đã hủy', value: 'cancelled' },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setSelectedStatus(tab.value);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 font-sans text-xs uppercase tracking-wider rounded-[2px] transition-colors ${selectedStatus === tab.value
                ? 'bg-[#271E18] text-[#FAF8F3] font-semibold'
                : 'bg-[#FAF8F3] text-[#7B6E64] hover:text-[#0D0703] border border-[#D2C8BA]'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders List Section */}
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px]" />
            ))}
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((ord) => {
              const statusCfg = STATUS_MAP[ord.status] || { label: ord.status, class: 'bg-gray-100 text-gray-800' };
              const orderCode = `AUR-2026-${String(ord.id).padStart(4, '0')}`;

              return (
                <div
                  key={ord.id}
                  className="bg-[#FAF8F3] border border-[#D2C8BA]/70 p-6 rounded-[2px] shadow-sm hover:border-[#0D0703] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-semibold text-[#0D0703] tracking-wider">
                        {orderCode}
                      </span>
                      <span
                        className={`font-sans text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-[1px] border ${statusCfg.class}`}
                      >
                        {statusCfg.label}
                      </span>
                    </div>

                    <p className="font-sans text-xs text-[#7B6E64]">
                      Ngày ủy thác: {formatDate(ord.orderDate)} • Số tác phẩm: {ord.itemCount}
                    </p>

                    <p className="font-sans text-xs text-[#4E4540] truncate max-w-lg">
                      Địa chỉ: {ord.shippingAddress}
                    </p>
                  </div>

                  <div className="flex flex-col md:items-end justify-between gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-[#D2C8BA]/40">
                    <div>
                      <span className="font-sans text-[10px] text-[#7B6E64] uppercase block md:text-right">
                        Tổng thanh toán:
                      </span>
                      <span className="font-serif text-2xl font-medium text-[#0D0703] tabular-nums">
                        {formatVND(ord.total)}
                      </span>
                      {ord.paidAmount > 0 && (
                        <span className="block text-[11px] text-emerald-700 font-sans md:text-right">
                          Đã thanh toán: {formatVND(ord.paidAmount)}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleViewDetail(ord.id)}
                      className="px-4 py-2 bg-[#271E18] text-[#FAF8F3] font-sans text-xs uppercase tracking-widest hover:bg-[#0D0703] transition-colors rounded-[2px]"
                    >
                      Xem chi tiết &amp; Thanh toán →
                    </button>

                    {ord.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleCancelOrder(ord.id)}
                        className="px-3 py-2 border border-[#BA1A1A] text-[#BA1A1A] font-sans text-xs uppercase tracking-wider hover:bg-red-50 transition-colors rounded-[2px]"
                      >
                        Hủy đơn
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pt-6 flex justify-center items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-3 py-1 border border-[#D2C8BA] font-sans text-xs uppercase disabled:opacity-30 rounded-[2px]"
                >
                  ← Trước
                </button>
                <span className="font-sans text-xs text-[#7B6E64] px-2">
                  Trang {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-3 py-1 border border-[#D2C8BA] font-sans text-xs uppercase disabled:opacity-30 rounded-[2px]"
                >
                  Sau →
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Empty Orders State */
          <div className="py-20 text-center bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] space-y-3">
            <h3 className="font-serif text-2xl text-[#0D0703]">Không tìm thấy đơn hàng nào</h3>
            <p className="font-sans text-xs text-[#7B6E64] max-w-sm mx-auto">
              Quý khách chưa có đơn hàng nào ở trạng thái này. Mời quý khách tiếp tục thưởng lãm các tác phẩm nội thất.
            </p>
            <div className="pt-2">
              <Link
                to="/products"
                className="inline-block px-6 py-2.5 bg-[#271E18] text-[#FAF8F3] font-sans text-xs uppercase tracking-widest rounded-[2px]"
              >
                Khám phá Bộ sưu tập
              </Link>
            </div>
          </div>
        )}

      </div>

      {/* ============================================================ */}
      {/* Modal Chi tiết đơn hàng & Lịch thanh toán                    */}
      {/* ============================================================ */}
      {activeOrderDetail && (
        <div className="fixed inset-0 z-50 bg-[#0D0703]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FCF9F3] border border-[#D2C8BA] max-w-3xl w-full p-8 md:p-10 rounded-[2px] shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto space-y-6">

            <button
              type="button"
              onClick={() => setActiveOrderDetail(null)}
              className="absolute top-6 right-6 text-[#7B6E64] hover:text-[#0D0703] text-lg font-bold"
              aria-label="Đóng"
            >
              ✕
            </button>

            {actionMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-sans rounded-[2px]">
                {actionMessage}
              </div>
            )}

            {/* Header Modal */}
            <div className="border-b border-[#D2C8BA]/50 pb-4">
              <div className="flex items-center gap-3">
                <h3 className="font-serif text-3xl text-[#0D0703]">
                  Hồ Sơ Đơn Hàng AUR-2026-{String(activeOrderDetail.id).padStart(4, '0')}
                </h3>
                <span
                  className={`font-sans text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-[1px] border ${STATUS_MAP[activeOrderDetail.status]?.class
                    }`}
                >
                  {STATUS_MAP[activeOrderDetail.status]?.label}
                </span>
              </div>
              <p className="font-sans text-xs text-[#7B6E64] mt-1">
                Khách hàng: {activeOrderDetail.customerName} • Ngày ủy thác: {formatDate(activeOrderDetail.orderDate)}
              </p>
              <p className="font-sans text-xs text-[#4E4540] mt-0.5">
                Địa chỉ giao nhận: {activeOrderDetail.shippingAddress}
              </p>
            </div>

            {/* Dòng hàng */}
            <div className="space-y-3">
              <h4 className="font-sans text-[11px] font-semibold uppercase tracking-wider text-[#A7824B]">
                Danh sách tác phẩm ủy thác
              </h4>
              <div className="divide-y divide-[#D2C8BA]/40 bg-[#FAF8F3] p-4 border border-[#D2C8BA]/60 rounded-[2px]">
                {activeOrderDetail.items.map((item) => (
                  <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="font-serif text-base text-[#0D0703]">{item.productName}</strong>
                        {item.serialNo && (
                          <span className="font-mono text-[10px] bg-[#EAE4D9] text-[#0D0703] px-1.5 py-0.5 font-bold rounded-[1px]">
                            Bản khắc {item.serialNo}
                          </span>
                        )}
                      </div>
                      <p className="text-[#7B6E64] mt-0.5">
                        Ref. {item.sku} • {item.finish} ({item.size}) • Chi nhánh: {item.locationName} • SL: {item.quantity}
                      </p>
                      {item.customization?.monogram && (
                        <p className="text-[#A58548] italic text-[11px] mt-0.5">
                          Khắc biển đồng lưu niệm: "{item.customization.monogram}"
                        </p>
                      )}
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="font-semibold tabular-nums text-[#0D0703]">
                        {formatVND(item.unitPrice * item.quantity)}
                      </span>
                      {activeOrderDetail.status === 'delivered' && (
                        <Link
                          to={`/account/orders/${activeOrderDetail.id}/items/${item.id}/review`}
                          className="inline-flex items-center gap-1 mt-2 text-[10px] font-sans font-semibold text-[#A58548] hover:text-[#271E18] underline uppercase tracking-wider bg-[#FAF8F3] px-2 py-1 border border-[#A58548]/30 rounded-[1px]"
                        >
                          <span>★ Viết cảm nhận</span>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bảng phân kỳ thanh toán */}
            <div className="space-y-3">
              <h4 className="font-sans text-[11px] font-semibold uppercase tracking-wider text-[#A7824B]">
                Lịch phân kỳ thanh toán (Installment Schedule)
              </h4>
              <div className="bg-[#FAF8F3] p-4 border border-[#D2C8BA]/60 rounded-[2px] divide-y divide-[#D2C8BA]/40">
                {activeOrderDetail.payments.map((p) => {
                  const isPaid = p.status === 'paid';
                  return (
                    <div key={p.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="font-sans text-xs uppercase text-[#0D0703]">
                            {p.type === 'deposit' ? 'Đợt 1: Đặt cọc giữ xưởng' : 'Đợt 2: Quyết toán White-Glove'}
                          </strong>
                          <span
                            className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-[1px] ${isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}
                          >
                            {isPaid ? 'Đã thanh toán' : 'Chờ thu'}
                          </span>
                        </div>
                        <p className="text-[#7B6E64] text-[11px] mt-0.5">
                          Hạn trả: {p.dueDate ? formatDate(p.dueDate) : 'Khi giao hàng'}
                          {p.paidAt && ` • Đã nạp lúc ${formatDate(p.paidAt)} (${p.method})`}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-serif text-base font-semibold text-[#0D0703] tabular-nums">
                          {formatVND(p.amount)}
                        </span>
                        {!isPaid && activeOrderDetail.status !== 'cancelled' && (
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handlePayPayment(p.id)}
                            className="px-3 py-1.5 bg-[#271E18] text-[#FAF8F3] font-sans text-[11px] uppercase tracking-wider rounded-[2px] hover:bg-[#0D0703] transition-colors disabled:opacity-50"
                          >
                            Thanh toán đợt
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tổng giá trị */}
            <div className="pt-2 border-t border-[#D2C8BA]/60 flex items-baseline justify-between text-xs">
              <span className="text-[#7B6E64]">Tổng thanh toán sau chiết khấu:</span>
              <span className="font-serif text-3xl font-medium text-[#0D0703] tabular-nums">
                {formatVND(activeOrderDetail.total)}
              </span>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              {activeOrderDetail.status === 'pending' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleCancelOrder(activeOrderDetail.id)}
                  className="px-4 py-2 border border-[#BA1A1A] text-[#BA1A1A] font-sans text-xs uppercase tracking-wider rounded-[2px] hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  Hủy đơn hàng
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveOrderDetail(null)}
                className="px-6 py-2.5 bg-[#EAE4D9] text-[#0D0703] font-sans text-xs uppercase tracking-widest rounded-[2px] hover:bg-[#D2C8BA] transition-colors"
              >
                Đóng hồ sơ
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
export default C04_MyOrdersPage;
