import React from 'react';
import { Link } from 'react-router-dom';
import type { OrderStatus, OrderSummary } from '../../../../types';
import { formatVND } from '../../../../utils/formatVND';
import { formatDateTime } from '../../../../utils/formatDate';

export const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; class: string }> = {
  pending: { label: 'Chờ duyệt', class: 'bg-amber-100 text-amber-900 border-amber-300' },
  confirmed: { label: 'Đã xác nhận', class: 'bg-blue-100 text-blue-900 border-blue-300' },
  in_production: { label: 'Đang chế tác', class: 'bg-purple-100 text-purple-900 border-purple-300' },
  shipped: { label: 'Đang vận chuyển', class: 'bg-indigo-100 text-indigo-900 border-indigo-300' },
  delivered: { label: 'Đã bàn giao', class: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  cancelled: { label: 'Đã hủy', class: 'bg-stone-200 text-stone-700 border-stone-300' },
};

export interface OrderCardListProps {
  orders: OrderSummary[];
  loading: boolean;
  onViewDetail: (orderId: number) => void;
  onCancelOrder: (orderId: number) => void;
}

export const OrderCardList: React.FC<OrderCardListProps> = ({
  orders,
  loading,
  onViewDetail,
  onCancelOrder,
}) => {
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px]" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((ord) => {
        const statusCfg = ORDER_STATUS_MAP[ord.status] || {
          label: ord.status,
          class: 'bg-gray-100 text-gray-800',
        };
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
                Ngày ủy thác: {formatDateTime(ord.orderDate)} • Số tác phẩm: {ord.itemCount}
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

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onViewDetail(ord.id)}
                  className="px-4 py-2 bg-[#271E18] text-[#FAF8F3] font-sans text-xs uppercase tracking-widest hover:bg-[#0D0703] transition-colors rounded-[2px]"
                >
                  Xem chi tiết &amp; Thanh toán →
                </button>

                {ord.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => onCancelOrder(ord.id)}
                    className="px-3 py-2 border border-[#BA1A1A] text-[#BA1A1A] font-sans text-xs uppercase tracking-wider hover:bg-red-50 transition-colors rounded-[2px]"
                  >
                    Hủy đơn
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
