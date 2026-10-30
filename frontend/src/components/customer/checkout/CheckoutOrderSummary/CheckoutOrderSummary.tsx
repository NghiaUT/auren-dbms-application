import React from 'react';
import type { CartItem } from '../../../../utils/cartStorage';
import { formatVND } from '../../../../utils/formatVND';

export interface CheckoutOrderSummaryProps {
  cartItems: CartItem[];
  subtotal: number;
  discountAmount: number;
  discountPct: number;
  finalTotal: number;
  depositDue: number;
  finalDue: number;
  loading: boolean;
}

export const CheckoutOrderSummary: React.FC<CheckoutOrderSummaryProps> = ({
  cartItems,
  subtotal,
  discountAmount,
  discountPct,
  finalTotal,
  depositDue,
  finalDue,
  loading,
}) => {
  return (
    <div className="bg-[#271E18] text-[#FAF8F3] p-8 rounded-[2px] shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#FAF8F3]/15">
        <h3 className="font-serif text-2xl tracking-wide">Quy Hoạch Đơn Hàng</h3>
        <span className="font-sans text-[10px] uppercase tracking-widest text-[#FFDDB1]">
          {cartItems.length} Dòng tác phẩm
        </span>
      </div>

      {/* Danh sách rút gọn các tác phẩm */}
      <div className="space-y-3 max-h-56 overflow-y-auto pr-1 divide-y divide-[#FAF8F3]/10 text-xs">
        {cartItems.map((item) => (
          <div key={item.variantId} className="pt-2 first:pt-0 flex items-center justify-between gap-3">
            <div>
              <p className="font-serif text-sm font-medium text-[#FAF8F3] truncate max-w-[200px]">
                {item.productName}
              </p>
              <p className="text-[10px] text-[#FAF8F3]/60">
                {item.variantFinish} • SL: {item.quantity}
              </p>
            </div>
            <span className="tabular-nums font-semibold text-[#FFDDB1]">
              {formatVND(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* Phân rã giá trị */}
      <div className="pt-4 border-t border-[#FAF8F3]/15 space-y-2.5 font-sans text-xs">
        <div className="flex justify-between text-[#FAF8F3]/80">
          <span>Tổng nguyên giá:</span>
          <span className="tabular-nums font-semibold">{formatVND(subtotal)}</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-[#FFDDB1]">
            <span>Ưu đãi thành viên Patron (-{discountPct}%):</span>
            <span className="tabular-nums font-semibold">-{formatVND(discountAmount)}</span>
          </div>
        )}

        <div className="flex justify-between text-[#FAF8F3]/80">
          <span>Phí chuyên chở &amp; Lắp đặt White-Glove:</span>
          <span className="text-[#FFDDB1] uppercase text-[11px] font-semibold">Miễn phí</span>
        </div>
      </div>

      {/* Grand Total */}
      <div className="pt-4 border-t border-[#FAF8F3]/15 flex items-baseline justify-between">
        <span className="font-serif text-lg">Tổng giá trị đơn:</span>
        <div className="text-right">
          <span className="font-serif text-3xl font-medium text-[#FAF8F3] tabular-nums block">
            {formatVND(finalTotal)}
          </span>
        </div>
      </div>

      {/* Installment breakdown callout */}
      <div className="bg-[#FAF8F3]/10 p-4 rounded-[2px] space-y-2 font-sans text-xs">
        <div className="flex justify-between items-center text-[#FFDDB1]">
          <span>Đợt 1 (Đặt cọc 50% thanh toán hôm nay):</span>
          <strong className="tabular-nums text-sm">{formatVND(depositDue)}</strong>
        </div>
        <div className="flex justify-between items-center text-[#FAF8F3]/70 text-[11px]">
          <span>Đợt 2 (50% quyết toán khi bàn giao):</span>
          <span className="tabular-nums">{formatVND(finalDue)}</span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 px-6 bg-[#FAF8F3] hover:bg-white text-[#271E18] font-sans text-xs font-semibold uppercase tracking-[0.18em] rounded-[2px] shadow-lg flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span>Đang khởi tạo giao dịch ACID...</span>
        ) : (
          <>
            <span>Xác Nhận Đặt Hàng &amp; Niêm Phong Điều Phối</span>
            <span>→</span>
          </>
        )}
      </button>
    </div>
  );
};
