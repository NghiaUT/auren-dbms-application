// ============================================================================
// File: frontend/src/pages/sales/S04_OrderPaymentSchedulePage.tsx
// Mã màn hình: S04 | Route: /sales/orders/:id/payments | FR: FR7b
// Vai trò: Lập lịch thanh toán cho đơn hàng — Hiển thị các đợt cọc, trả góp,
//          tất toán hiện có kèm tiến độ thanh toán và form thêm đợt thanh toán mới.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, CheckCircle, Clock, AlertCircle, DollarSign, Calendar } from 'lucide-react';
import { SalesHeaderNav } from '../../components/layout';
import { getSalesOrderDetailApi, createPaymentScheduleApi } from '../../api/sales.api';
import type { OrderDetail, PaymentDetail, PaymentType } from '../../types';
import { formatVND } from '../../utils/formatVND';
import { formatDate, formatDateTime, getTodayDateString } from '../../utils/formatDate';
import { useToast } from '../../context/ToastContext';

export const S04_OrderPaymentSchedulePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const { toast } = useToast();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [payments, setPayments] = useState<PaymentDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [newType, setNewType] = useState<PaymentType>('installment');
  const [newAmount, setNewAmount] = useState<string>('');
  const [newDueDate, setNewDueDate] = useState<string>('');

  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const data = await getSalesOrderDetailApi(orderId);
      setOrder(data);
      setPayments(data.payments || []);
    } catch (err: any) {
      console.error('Lỗi khi nạp chi tiết đơn:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  // Tính toán số liệu tổng
  const totalOrder = order?.total || 0;
  const activePayments = payments.filter((p) => p.status !== 'refunded');
  const scheduledAmount = activePayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const paidAmount = activePayments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0);
  const remainingUnscheduled = Math.max(0, totalOrder - scheduledAmount);

  const scheduledPercent = totalOrder > 0 ? Math.min(100, Math.round((scheduledAmount / totalOrder) * 100)) : 0;
  const paidPercent = totalOrder > 0 ? Math.min(100, Math.round((paidAmount / totalOrder) * 100)) : 0;

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(newAmount);

    if (isNaN(amountNum) || amountNum <= 0) {
      setFeedback({ text: 'Vui lòng nhập số tiền hợp lệ lớn hơn 0.', type: 'error' });
      return;
    }

    if (amountNum > remainingUnscheduled) {
      setFeedback({
        text: `Số tiền (${formatVND(amountNum)}) vượt quá số tiền còn lại chưa lập lịch (${formatVND(remainingUnscheduled)}).`,
        type: 'error',
      });
      return;
    }

    if (!newDueDate) {
      setFeedback({ text: 'Vui lòng chọn hạn thanh toán.', type: 'error' });
      return;
    }

    try {
      setActionLoading(true);
      setFeedback(null);
      const updatedPayments = await createPaymentScheduleApi(orderId, [
        {
          type: newType,
          amount: amountNum,
          dueDate: newDueDate,
        },
      ]);
      setPayments(updatedPayments);
      setNewAmount('');
      setNewDueDate('');
      const successMsg = 'Đã lập lịch thanh toán thành công!';
      setFeedback({ text: successMsg, type: 'success' });
      toast.success(successMsg);
      await fetchOrder();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Không thể lập lịch thanh toán.';
      setFeedback({ text: msg, type: 'error' });
      toast.error(err, msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-20 bg-[#FCF9F3]">
        <SalesHeaderNav />
        <div className="max-w-[1400px] mx-auto px-6 py-20 text-center text-xs text-[#7B6E64]">
          Đang nạp lịch thanh toán...
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
          <Link to="/sales/orders" className="btn-auren-outline mt-6 inline-block text-xs py-2 px-4">
            ← Quay lại hàng đợi
          </Link>
        </div>
      </div>
    );
  }

  const hasFinal = activePayments.some((p) => p.type === 'final');

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#FCF9F3]">
      <SalesHeaderNav />

      <main className="max-w-[1600px] mx-auto px-6 md:px-12">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to={`/sales/orders/${order.id}`}
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-[#7B6E64] hover:text-[#0D0703] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại chi tiết xử lý đơn #AUR-2026-{String(order.id).padStart(4, '0')}</span>
          </Link>
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
        {/* TỔNG QUAN GIÁ TRỊ & TIẾN ĐỘ LẬP LỊCH                         */}
        {/* ============================================================ */}
        <section className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] p-6 md:p-8 mb-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#D2C8BA]/40">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A7824B] font-bold">
                Payment Schedule Protocol
              </span>
              <h2 className="font-serif text-3xl font-medium text-[#0D0703] mt-1">
                Lịch Thanh Toán Hợp Đồng Đơn #{String(order.id).padStart(4, '0')}
              </h2>
              <p className="font-sans text-xs text-[#7B6E64] mt-1">
                Khách hàng: <strong className="text-[#0D0703]">{order.customerName}</strong> ({order.customerEmail})
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#7B6E64] block">
                Tổng Giá Trị Đơn Hàng
              </span>
              <span className="font-serif text-3xl font-medium text-[#0D0703] block mt-0.5">
                {formatVND(totalOrder)}
              </span>
            </div>
          </div>

          {/* Thanh Tiến độ Phân bổ Thanh toán */}
          <div className="pt-6">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-[#7B6E64]">
                Đã lập lịch: <strong className="text-[#0D0703]">{formatVND(scheduledAmount)}</strong> ({scheduledPercent}%)
              </span>
              <span className="text-[#7B6E64]">
                Còn lại chưa lập lịch: <strong className="text-[#A7824B]">{formatVND(remainingUnscheduled)}</strong>
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-[#EAE4D9] rounded-full overflow-hidden flex">
              <div
                style={{ width: `${paidPercent}%` }}
                className="bg-[#246A38] h-full transition-all duration-500"
                title={`Đã thực thu: ${formatVND(paidAmount)}`}
              />
              <div
                style={{ width: `${Math.max(0, scheduledPercent - paidPercent)}%` }}
                className="bg-[#A7824B] h-full transition-all duration-500"
                title={`Đã lập lịch chờ thu: ${formatVND(scheduledAmount - paidAmount)}`}
              />
            </div>

            <div className="flex items-center gap-6 text-[11px] text-[#7B6E64] mt-3 font-sans">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#246A38]" />
                <span>Đã tất toán ({paidPercent}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#A7824B]" />
                <span>Chờ thanh toán theo đợt</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EAE4D9]" />
                <span>Chưa lập lịch</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* DANH SÁCH CÁC ĐỢT THANH TOÁN HIỆN CÓ                         */}
        {/* ============================================================ */}
        <section className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] p-6 md:p-8 mb-8">
          <h3 className="font-serif text-xl text-[#0D0703] mb-4 pb-3 border-b border-[#D2C8BA]/40">
            Các Đợt Thu Tiền Theo Tiến Độ ({payments.length})
          </h3>

          {payments.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#7B6E64]">
              Chưa có đợt thanh toán nào được thiết lập cho đơn này.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#D2C8BA] text-[10px] font-mono uppercase tracking-widest text-[#7B6E64]">
                    <th className="py-3 px-4">Đợt</th>
                    <th className="py-3 px-4">Loại Đợt</th>
                    <th className="py-3 px-4 text-right">Số Tiền</th>
                    <th className="py-3 px-4">Hạn Thanh Toán</th>
                    <th className="py-3 px-4">Thời Điểm Thu</th>
                    <th className="py-3 px-4">Phương Thức</th>
                    <th className="py-3 px-4 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D2C8BA]/30 font-sans text-xs">
                  {payments.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-white/60 transition-colors">
                      <td className="py-4 px-4 font-mono text-[#7B6E64]">#{idx + 1}</td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-[#0D0703] uppercase font-mono text-[11px]">
                          {p.type === 'deposit'
                            ? 'Đặt cọc (Deposit)'
                            : p.type === 'installment'
                            ? 'Trả góp (Installment)'
                            : 'Tất toán (Final)'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-serif font-medium text-sm text-[#0D0703]">
                        {formatVND(p.amount)}
                      </td>
                      <td className="py-4 px-4 text-[#7B6E64]">
                        {p.dueDate ? formatDate(p.dueDate) : '—'}
                      </td>
                      <td className="py-4 px-4 text-[#7B6E64]">
                        {p.paidAt ? formatDateTime(p.paidAt) : '—'}
                      </td>
                      <td className="py-4 px-4 text-[#7B6E64] font-mono uppercase text-[10px]">
                        {p.method || '—'}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-[1px] border ${
                            p.status === 'paid'
                              ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#A5D6A7]'
                              : p.status === 'overdue'
                              ? 'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]'
                              : p.status === 'refunded'
                              ? 'bg-[#F5F5F5] text-[#757575] border-[#E0E0E0]'
                              : 'bg-[#FFF8E1] text-[#8D6E63] border-[#FFE082]'
                          }`}
                        >
                          {p.status === 'paid'
                            ? 'Đã thu'
                            : p.status === 'overdue'
                            ? 'Quá hạn'
                            : p.status === 'refunded'
                            ? 'Đã huỷ'
                            : 'Chờ thanh toán'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ============================================================ */}
        {/* FORM THÊM ĐỢT THANH TOÁN MỚI (FR7b)                          */}
        {/* ============================================================ */}
        {remainingUnscheduled > 0 && order.status !== 'cancelled' && (
          <section className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] p-6 md:p-8">
            <h3 className="font-serif text-xl text-[#0D0703] mb-2">Thêm Đợt Thanh Toán Mới</h3>
            <p className="font-sans text-xs text-[#7B6E64] mb-6">
              Số tiền tối đa có thể lập lịch đợt này là <strong className="text-[#0D0703]">{formatVND(remainingUnscheduled)}</strong>.
            </p>

            <form onSubmit={handleAddPayment} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7B6E64] mb-1">
                  Loại Khoản Thu
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as PaymentType)}
                  className="w-full text-xs p-2.5 bg-white border border-[#D2C8BA] rounded-[2px] text-[#0D0703] focus:outline-none focus:border-[#271E18]"
                >
                  <option value="deposit">Đặt cọc (Deposit)</option>
                  <option value="installment">Trả góp theo mốc chế tác (Installment)</option>
                  {!hasFinal && <option value="final">Quyết toán tất toán (Final)</option>}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7B6E64] mb-1">
                  Số Tiền (VNĐ)
                </label>
                <input
                  type="number"
                  min="1"
                  max={remainingUnscheduled}
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder={`Tối đa: ${remainingUnscheduled}`}
                  className="w-full text-xs p-2.5 bg-white border border-[#D2C8BA] rounded-[2px] text-[#0D0703] focus:outline-none focus:border-[#271E18]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7B6E64] mb-1">
                  Hạn Thanh Toán (Due Date)
                </label>
                <input
                  type="date"
                  min={getTodayDateString()}
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-[#D2C8BA] rounded-[2px] text-[#0D0703] focus:outline-none focus:border-[#271E18]"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full p-2.5 bg-[#271E18] hover:bg-[#0D0703] text-[#FAF8F3] text-xs font-semibold uppercase tracking-wider rounded-[2px] transition-all disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{actionLoading ? 'Đang thêm...' : 'Lưu Đợt Thu'}</span>
                </button>
              </div>
            </form>
          </section>
        )}
      </main>
    </div>
  );
};
export default S04_OrderPaymentSchedulePage;
