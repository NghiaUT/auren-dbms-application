// ============================================================================
// File: frontend/src/pages/sales/S03_OrderProcessPage.tsx
// Mã màn hình: S03 | Route: /sales/orders/:id | FR: FR11, FR9
// Vai trò: Xử lý đơn hàng Sales — Hiển thị đầy đủ thông tin khách hàng, địa chỉ,
//          các tác phẩm đặt may đo, các bước chuyển trạng thái (confirmed -> in_production
//          -> shipped -> delivered) kèm modal chọn ngày giao dự kiến và huỷ đơn an toàn.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Truck,
  Hammer,
  CreditCard,
  Ban,
  Clock,
  MapPin,
  User,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { SalesHeaderNav } from '../../components/SalesHeaderNav';
import {
  getSalesOrderDetailApi,
  updateOrderStatusApi,
  cancelOrderBySalesApi,
} from '../../api/sales.api';
import type { OrderDetail, OrderStatus } from '../../types';
import { formatVND } from '../../utils/formatVND';

const STATUS_STEPS: Array<{ key: OrderStatus; label: string; icon: any }> = [
  { key: 'pending', label: 'Chờ duyệt', icon: Clock },
  { key: 'confirmed', label: 'Đã xác nhận', icon: CheckCircle },
  { key: 'in_production', label: 'Đang chế tác', icon: Hammer },
  { key: 'shipped', label: 'Đang vận chuyển', icon: Truck },
  { key: 'delivered', label: 'Đã bàn giao', icon: ShieldCheck },
];

export const S03_OrderProcessPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const navigate = useNavigate();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal chuyển sang in_production (nhập deliveryDate)
  const [showProductionModal, setShowProductionModal] = useState<boolean>(false);
  const [deliveryDateInput, setDeliveryDateInput] = useState<string>('');

  // Modal huỷ đơn
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');

  const fetchOrderDetail = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const data = await getSalesOrderDetailApi(orderId);
      setOrder(data);
      if (data.deliveryDate) {
        setDeliveryDateInput(data.deliveryDate.split('T')[0]);
      }
    } catch (err: any) {
      console.error('Lỗi khi nạp chi tiết đơn:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const handleUpdateStatus = async (targetStatus: OrderStatus, deliveryDate?: string | null) => {
    try {
      setActionLoading(true);
      setFeedback(null);
      const res = await updateOrderStatusApi(orderId, {
        status: targetStatus,
        deliveryDate,
      });
      setFeedback({ text: `Đã cập nhật trạng thái đơn sang "${targetStatus}" thành công!`, type: 'success' });
      setShowProductionModal(false);
      await fetchOrderDetail();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Không thể chuyển đổi trạng thái đơn hàng này.';
      setFeedback({ text: msg, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    try {
      setActionLoading(true);
      setFeedback(null);
      await cancelOrderBySalesApi(orderId, cancelReason);
      setFeedback({ text: 'Đơn hàng đã được huỷ bỏ và hoàn trả tồn kho thành công.', type: 'success' });
      setShowCancelModal(false);
      await fetchOrderDetail();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Không thể huỷ đơn hàng này.';
      setFeedback({ text: msg, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const getStepIndex = (status: OrderStatus) => {
    if (status === 'cancelled') return -1;
    return STATUS_STEPS.findIndex((s) => s.key === status);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-20 bg-[#FCF9F3]">
        <SalesHeaderNav />
        <div className="max-w-[1400px] mx-auto px-6 py-20 text-center text-xs text-[#7B6E64]">
          Đang nạp dữ liệu hồ sơ đơn hàng...
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen pt-24 pb-20 bg-[#FCF9F3]">
        <SalesHeaderNav />
        <div className="max-w-[1400px] mx-auto px-6 py-20 text-center">
          <p className="font-serif text-2xl text-[#0D0703]">Không tìm thấy đơn hàng</p>
          <p className="font-sans text-xs text-[#7B6E64] mt-2">
            Đơn hàng không tồn tại hoặc bạn không được phân công phụ trách đơn này.
          </p>
          <Link to="/sales/orders" className="btn-auren-outline mt-6 inline-block text-xs py-2 px-4">
            ← Quay lại hàng đợi
          </Link>
        </div>
      </div>
    );
  }

  const currentStepIdx = getStepIndex(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#FCF9F3]">
      <SalesHeaderNav />

      <main className="max-w-[1600px] mx-auto px-6 md:px-12">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/sales/orders?tab=my_orders"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-[#7B6E64] hover:text-[#0D0703] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại hàng đợi đơn</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to={`/sales/orders/${order.id}/payments`}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#D2C8BA] hover:border-[#271E18] text-[#0D0703] text-xs uppercase tracking-wider font-semibold rounded-[2px] transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5 text-[#A7824B]" />
              <span>Quản lý lịch thanh toán ({order.payments?.length || 0} đợt)</span>
            </Link>

            {(order.status === 'pending' || order.status === 'confirmed') && (
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#BA1A1A]/30 text-[#BA1A1A] hover:bg-[#BA1A1A]/10 text-xs uppercase tracking-wider font-semibold rounded-[2px] transition-colors"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Huỷ đơn hàng</span>
              </button>
            )}
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
        {/* BANNER THÔNG TIN ĐƠN HÀNG                                    */}
        {/* ============================================================ */}
        <section className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] p-6 md:p-8 mb-8 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#D2C8BA]/40">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-serif text-3xl font-medium text-[#0D0703]">
                  Đơn Hàng #AUR-2026-{String(order.id).padStart(4, '0')}
                </h2>
                <span className="font-mono text-xs uppercase tracking-wider px-2.5 py-1 bg-[#271E18] text-[#FAF8F3] rounded-[1px]">
                  {order.status}
                </span>
              </div>
              <p className="font-sans text-xs text-[#7B6E64] mt-1.5">
                Ngày đặt: {new Date(order.orderDate).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {/* Khối Thao tác chuyển trạng thái kế tiếp */}
            {!isCancelled && order.status !== 'delivered' && (
              <div className="flex flex-wrap items-center gap-3">
                {order.status === 'confirmed' && (
                  <button
                    onClick={() => setShowProductionModal(true)}
                    disabled={actionLoading}
                    className="px-5 py-2.5 bg-[#271E18] hover:bg-[#0D0703] text-[#FAF8F3] text-xs font-semibold uppercase tracking-wider rounded-[2px] transition-all shadow-sm"
                  >
                    1. Chuyển Sang Chế Tác (In Production) →
                  </button>
                )}

                {order.status === 'in_production' && (
                  <button
                    onClick={() => handleUpdateStatus('shipped')}
                    disabled={actionLoading}
                    className="px-5 py-2.5 bg-[#271E18] hover:bg-[#0D0703] text-[#FAF8F3] text-xs font-semibold uppercase tracking-wider rounded-[2px] transition-all shadow-sm"
                  >
                    2. Xuất Kho Vận Chuyển White-Glove (Shipped) →
                  </button>
                )}

                {order.status === 'shipped' && (
                  <button
                    onClick={() => handleUpdateStatus('delivered')}
                    disabled={actionLoading}
                    className="px-5 py-2.5 bg-[#246A38] hover:bg-[#1C532C] text-[#FAF8F3] text-xs font-semibold uppercase tracking-wider rounded-[2px] transition-all shadow-sm"
                  >
                    3. Xác Nhận Bàn Giao Thành Công (Delivered) ✓
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Stepper Quy trình điều phối */}
          {!isCancelled ? (
            <div className="pt-6">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#7B6E64] block mb-4">
                Tiến Trình Chế Tác & Bàn Giao White-Glove
              </span>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {STATUS_STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const isDone = currentStepIdx >= idx;
                  const isCurrent = currentStepIdx === idx;

                  return (
                    <div
                      key={step.key}
                      className={`p-3 rounded-[2px] border transition-all ${
                        isCurrent
                          ? 'bg-[#271E18] text-[#FAF8F3] border-[#271E18]'
                          : isDone
                          ? 'bg-white text-[#0D0703] border-[#246A38]/40'
                          : 'bg-white/40 text-[#7B6E64]/60 border-[#D2C8BA]/40'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-[#A7824B]' : isDone ? 'text-[#246A38]' : 'text-[#7B6E64]/60'}`} />
                        <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
                          0{idx + 1}
                        </span>
                      </div>
                      <span className="text-xs font-medium block truncate">{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="pt-6 flex items-center gap-3 text-[#BA1A1A]">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold text-xs uppercase tracking-wider">
                Đơn hàng này đã bị huỷ bỏ. Toàn bộ tồn kho đã được hoàn trả.
              </span>
            </div>
          )}
        </section>

        {/* ============================================================ */}
        {/* GRID 2 CỘT: CHI TIẾT KHÁCH HÀNG & DÒNG HÀNG TÁC PHẨM         */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Cột Trái (8 Cột): Danh sách tác phẩm */}
          <div className="lg:col-span-8 space-y-6">
            <section className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] p-6">
              <h3 className="font-serif text-xl text-[#0D0703] mb-4 pb-3 border-b border-[#D2C8BA]/40">
                Tác Phẩm Kiến Trúc May Đo ({order.items?.length || 0})
              </h3>

              <div className="divide-y divide-[#D2C8BA]/30">
                {order.items?.map((item) => (
                  <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-base font-medium text-[#0D0703]">
                          {item.productName}
                        </span>
                        {item.serialNo && (
                          <span className="font-mono text-[9px] uppercase px-2 py-0.5 bg-[#A7824B] text-[#FAF8F3] font-bold rounded-[1px]">
                            {item.serialNo}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-[#7B6E64] space-y-0.5 mt-1 font-sans">
                        <p>SKU: <span className="font-mono font-semibold">{item.sku}</span> | Lớp phủ: {item.finish} | Kích thước: {item.size}</p>
                        {item.locationName && (
                          <p>Showroom xuất: <strong className="text-[#0D0703]">{item.locationName}</strong></p>
                        )}
                        {item.customization && (item.customization.plaque || item.customization.monogram) && (
                          <div className="p-2 bg-white border border-[#D2C8BA] rounded-[2px] inline-block mt-2">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A7824B] font-bold block">
                              Khắc Biển Đồng Atelier Plaque:
                            </span>
                            <span className="font-serif italic text-xs text-[#0D0703]">
                              "{item.customization.plaque || item.customization.monogram}"
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right whitespace-nowrap">
                      <span className="text-xs text-[#7B6E64] block">Số lượng: {item.quantity}</span>
                      <span className="font-serif font-medium text-base text-[#0D0703] block mt-0.5">
                        {formatVND(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Cột Phải (4 Cột): Thông tin Khách hàng, Giao nhận & Giá trị */}
          <div className="lg:col-span-4 space-y-6">
            {/* Khối Khách hàng & Giao nhận */}
            <section className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] p-6">
              <h3 className="font-serif text-lg text-[#0D0703] mb-4 pb-2 border-b border-[#D2C8BA]/40 flex items-center gap-2">
                <User className="w-4 h-4 text-[#A7824B]" />
                <span>Hồ Sơ Khách Hàng</span>
              </h3>

              <div className="space-y-3 font-sans text-xs">
                <div>
                  <span className="text-[10px] text-[#7B6E64] uppercase font-mono block">Họ và tên</span>
                  <span className="font-semibold text-sm text-[#0D0703]">{order.customerName}</span>
                </div>

                <div>
                  <span className="text-[10px] text-[#7B6E64] uppercase font-mono block">Thư tín điện tử</span>
                  <span className="text-[#0D0703]">{order.customerEmail}</span>
                </div>

                <div>
                  <span className="text-[10px] text-[#7B6E64] uppercase font-mono block flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#A7824B]" /> Địa chỉ giao nhận White-Glove
                  </span>
                  <span className="text-[#0D0703] font-medium leading-relaxed block mt-0.5">
                    {order.shippingAddress}
                  </span>
                </div>

                {order.deliveryDate && (
                  <div className="pt-2 border-t border-[#D2C8BA]/30">
                    <span className="text-[10px] text-[#7B6E64] uppercase font-mono block flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#246A38]" /> Hạn bàn giao dự kiến
                    </span>
                    <span className="font-serif font-medium text-sm text-[#246A38] block mt-0.5">
                      {new Date(order.deliveryDate).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* Khối Quyết toán Tài chính */}
            <section className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] p-6">
              <h3 className="font-serif text-lg text-[#0D0703] mb-4 pb-2 border-b border-[#D2C8BA]/40">
                Giá Trị Hợp Đồng
              </h3>

              <div className="space-y-2 text-xs font-sans">
                <div className="flex justify-between text-[#7B6E64]">
                  <span>Tạm tính giá gốc</span>
                  <span className="font-mono">{formatVND(order.subtotal)}</span>
                </div>

                {order.discount > 0 && (
                  <div className="flex justify-between text-[#A7824B]">
                    <span>Chiết khấu thành viên</span>
                    <span className="font-mono">- {formatVND(order.discount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#7B6E64]">
                  <span>Vận chuyển White-Glove</span>
                  <span className="font-mono uppercase text-[10px] text-[#246A38] font-bold">Miễn phí</span>
                </div>

                <div className="pt-3 border-t border-[#D2C8BA] flex justify-between items-baseline">
                  <span className="font-serif text-sm font-semibold text-[#0D0703]">Tổng quyết toán</span>
                  <span className="font-serif text-xl font-medium text-[#0D0703]">
                    {formatVND(order.total)}
                  </span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#D2C8BA]/40">
                <Link
                  to={`/sales/orders/${order.id}/payments`}
                  className="w-full py-2.5 px-3 bg-white border border-[#D2C8BA] hover:border-[#271E18] text-[#0D0703] font-sans text-xs font-semibold uppercase tracking-wider rounded-[2px] block text-center transition-colors"
                >
                  Xem Tiến Độ Thanh Toán →
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* ============================================================ */}
      {/* MODAL: CHUYỂN SANG IN_PRODUCTION                             */}
      {/* ============================================================ */}
      {showProductionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] max-w-md w-full p-6 shadow-xl">
            <h4 className="font-serif text-xl text-[#0D0703] mb-2">Chuyển Sang Chế Tác Atelier</h4>
            <p className="font-sans text-xs text-[#7B6E64] mb-4">
              Theo quy định nghiệp vụ R7, vui lòng nhập ngày hẹn bàn giao tác phẩm dự kiến cho khách hàng:
            </p>

            <div className="mb-6">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7B6E64] mb-1">
                Ngày Bàn Giao Dự Kiến (Bắt Buộc)
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={deliveryDateInput}
                onChange={(e) => setDeliveryDateInput(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-[#D2C8BA] rounded-[2px] text-[#0D0703] focus:outline-none focus:border-[#271E18]"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowProductionModal(false)}
                className="px-4 py-2 text-xs uppercase tracking-wider font-semibold text-[#7B6E64] hover:text-[#0D0703]"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={!deliveryDateInput || actionLoading}
                onClick={() => handleUpdateStatus('in_production', deliveryDateInput)}
                className="px-4 py-2 bg-[#271E18] hover:bg-[#0D0703] text-[#FAF8F3] text-xs uppercase tracking-wider font-semibold rounded-[2px] disabled:opacity-50"
              >
                {actionLoading ? 'Đang cập nhật...' : 'Xác Nhận Chế Tác'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: HUỶ ĐƠN HÀNG (FR9)                                    */}
      {/* ============================================================ */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] max-w-md w-full p-6 shadow-xl">
            <h4 className="font-serif text-xl text-[#BA1A1A] mb-2">Xác Nhận Huỷ Đơn Hàng</h4>
            <p className="font-sans text-xs text-[#7B6E64] mb-4">
              Hành động này sẽ hoàn trả toàn bộ tồn kho đã giữ, giải phóng số bản Limited Edition và đánh dấu huỷ các khoản thanh toán chờ thu.
            </p>

            <div className="mb-6">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7B6E64] mb-1">
                Lý Do Huỷ (Tuỳ chọn)
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ví dụ: Khách hàng thay đổi yêu cầu thiết kế..."
                className="w-full text-xs p-2.5 bg-white border border-[#D2C8BA] rounded-[2px] text-[#0D0703] focus:outline-none focus:border-[#271E18]"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-xs uppercase tracking-wider font-semibold text-[#7B6E64] hover:text-[#0D0703]"
              >
                Quay lại
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleCancelOrder}
                className="px-4 py-2 bg-[#BA1A1A] hover:bg-[#8E1010] text-white text-xs uppercase tracking-wider font-semibold rounded-[2px] disabled:opacity-50"
              >
                {actionLoading ? 'Đang huỷ...' : 'Xác Nhận Huỷ Đơn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default S03_OrderProcessPage;
