import React from 'react';
import { Link } from 'react-router-dom';
import type { OrderDetail } from '../../../../types';
import { formatVND } from '../../../../utils/formatVND';
import { formatDate, formatDateTime } from '../../../../utils/formatDate';
import { ORDER_STATUS_MAP } from '../OrderCardList';

export interface OrderDetailModalProps {
  order: OrderDetail | null;
  onClose: () => void;
  actionLoading: boolean;
  actionMessage: string | null;
  onPayPayment: (paymentId: number) => void;
  onCancelOrder: (orderId: number) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  onClose,
  actionLoading,
  actionMessage,
  onPayPayment,
  onCancelOrder,
}) => {
  if (!order) return null;

  const statusCfg = ORDER_STATUS_MAP[order.status] || {
    label: order.status,
    class: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0D0703]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FCF9F3] border border-[#D2C8BA] max-w-3xl w-full p-8 md:p-10 rounded-[2px] shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto space-y-6">
        <button
          type="button"
          onClick={onClose}
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
              Hồ Sơ Đơn Hàng AUR-2026-{String(order.id).padStart(4, '0')}
            </h3>
            <span
              className={`font-sans text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-[1px] border ${statusCfg.class}`}
            >
              {statusCfg.label}
            </span>
          </div>
          <p className="font-sans text-xs text-[#7B6E64] mt-1">
            Khách hàng: {order.customerName} • Ngày ủy thác: {formatDateTime(order.orderDate)}
          </p>
          <p className="font-sans text-xs text-[#4E4540] mt-0.5">
            Địa chỉ giao nhận: {order.shippingAddress}
          </p>
        </div>

        {/* Dòng hàng */}
        <div className="space-y-3">
          <h4 className="font-sans text-[11px] font-semibold uppercase tracking-wider text-[#A7824B]">
            Danh sách tác phẩm ủy thác
          </h4>
          <div className="divide-y divide-[#D2C8BA]/40 bg-[#FAF8F3] p-4 border border-[#D2C8BA]/60 rounded-[2px]">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4 text-xs"
              >
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
                    Ref. {item.sku} • {item.finish} ({item.size}) • Chi nhánh: {item.locationName} • SL:{' '}
                    {item.quantity}
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
                  {order.status === 'delivered' && (
                    <Link
                      to={`/account/orders/${order.id}/items/${item.id}/review`}
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
            {order.payments.map((p) => {
              const isPaid = p.status === 'paid';
              return (
                <div
                  key={p.id}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="font-sans text-xs uppercase text-[#0D0703]">
                        {p.type === 'deposit'
                          ? 'Đợt 1: Đặt cọc giữ xưởng'
                          : 'Đợt 2: Quyết toán White-Glove'}
                      </strong>
                      <span
                        className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-[1px] ${
                          isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isPaid ? 'Đã thanh toán' : 'Chờ thu'}
                      </span>
                    </div>
                    <p className="text-[#7B6E64] text-[11px] mt-0.5">
                      Hạn trả: {p.dueDate ? formatDate(p.dueDate) : 'Khi giao hàng'}
                      {p.paidAt && ` • Đã nạp lúc ${formatDateTime(p.paidAt)} (${p.method})`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-serif text-base font-semibold text-[#0D0703] tabular-nums">
                      {formatVND(p.amount)}
                    </span>
                    {!isPaid && order.status !== 'cancelled' && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => onPayPayment(p.id)}
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
            {formatVND(order.total)}
          </span>
        </div>

        {/* Action buttons */}
        <div className="pt-2 flex items-center justify-end gap-3">
          {order.status === 'pending' && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => onCancelOrder(order.id)}
              className="px-4 py-2 border border-[#BA1A1A] text-[#BA1A1A] font-sans text-xs uppercase tracking-wider rounded-[2px] hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Hủy đơn hàng
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-[#EAE4D9] text-[#0D0703] font-sans text-xs uppercase tracking-widest rounded-[2px] hover:bg-[#D2C8BA] transition-colors"
          >
            Đóng hồ sơ
          </button>
        </div>
      </div>
    </div>
  );
};
