import React from 'react';
import { Link } from 'react-router-dom';
import { formatVND } from '../../../../utils/formatVND';

export interface CartSummaryProps {
  subtotal: number;
  discountAmount: number;
  discountPct: number;
  tierName?: string;
  estimatedTotal: number;
  totalItemCount: number;
  isAuthenticated: boolean;
  onProceedToCheckout: () => void;
}

export const CartSummary: React.FC<CartSummaryProps> = ({
  subtotal,
  discountAmount,
  discountPct,
  tierName,
  estimatedTotal,
  totalItemCount,
  isAuthenticated,
  onProceedToCheckout,
}) => {
  return (
    <div className="sticky top-28 space-y-6">
      {/* Commercial Summary Box */}
      <div className="bg-[#271E18] text-[#FAF8F3] p-8 rounded-[2px] shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#FAF8F3]/15">
          <h2 className="font-serif text-2xl tracking-wide">Tóm Tắt Đơn Hàng</h2>
          <span className="font-sans text-[10px] uppercase tracking-widest text-[#FFDDB1]">
            {totalItemCount} Tác phẩm
          </span>
        </div>

        {/* Price Lines */}
        <div className="space-y-3 font-sans text-xs">
          <div className="flex justify-between text-[#FAF8F3]/80">
            <span>Tạm tính tác phẩm</span>
            <span className="font-semibold tabular-nums text-[#FAF8F3]">{formatVND(subtotal)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-[#FFDDB1]">
              <span>Ưu đãi thành viên ({tierName} -{discountPct}%)</span>
              <span className="font-semibold tabular-nums">-{formatVND(discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between text-[#FAF8F3]/80">
            <div>
              <span>Dịch vụ lắp đặt White-Glove</span>
              <span className="block text-[10px] text-[#FAF8F3]/50">
                Đóng thùng gỗ thông &amp; vận chuyển tận phòng
              </span>
            </div>
            <span className="font-semibold uppercase text-[#FFDDB1] text-[11px]">Miễn phí</span>
          </div>

          <div className="flex justify-between text-[#FAF8F3]/80">
            <span>Thuế &amp; Phí bảo hiểm lưu kho</span>
            <span className="font-semibold text-[#FFDDB1] text-[11px] uppercase">Đã bao gồm</span>
          </div>
        </div>

        {/* Separator */}
        <div className="w-full h-[1px] bg-[#FAF8F3]/15" />

        {/* Grand Total */}
        <div className="flex items-baseline justify-between pt-1">
          <span className="font-serif text-xl text-[#FAF8F3]">Tổng thanh toán:</span>
          <div className="text-right">
            <span className="font-serif text-3xl font-medium text-[#FAF8F3] tabular-nums block">
              {formatVND(estimatedTotal)}
            </span>
            <span className="font-sans text-[10px] text-[#FFDDB1] uppercase tracking-widest">
              Ký quỹ 50% khi đặt hàng
            </span>
          </div>
        </div>

        {/* Checkout CTA */}
        <div className="pt-2 space-y-3">
          <button
            type="button"
            onClick={onProceedToCheckout}
            className="w-full py-4 px-6 bg-[#FAF8F3] text-[#271E18] hover:bg-white font-sans text-xs font-semibold uppercase tracking-[0.18em] rounded-[2px] flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 text-center shadow-md"
          >
            <span>Tiến hành Giao nhận White-Glove</span>
            <span>→</span>
          </button>

          <Link
            to="/products"
            className="w-full py-3 px-6 bg-transparent text-[#FAF8F3]/80 hover:text-[#FAF8F3] font-sans text-xs uppercase tracking-widest rounded-[2px] flex items-center justify-center transition-colors text-center"
          >
            Tiếp tục thưởng lãm Bộ sưu tập
          </Link>
        </div>

        {/* Trust Assurances inside Summary */}
        <div className="pt-6 border-t border-[#FAF8F3]/15 space-y-3 text-[#FAF8F3]/80 text-xs">
          <div className="flex items-start gap-2.5">
            <span className="text-[#A58548] text-sm">✓</span>
            <div>
              <p className="font-semibold text-[#FAF8F3]">Bảo hành kết cấu 10 năm</p>
              <p className="text-[10px] text-[#FAF8F3]/60">Cam kết bảo tồn mộng gỗ và bề mặt hoàn thiện.</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="text-[#A58548] text-sm">✓</span>
            <div>
              <p className="font-semibold text-[#FAF8F3]">Gỗ bền vững chứng nhận FSC</p>
              <p className="text-[10px] text-[#FAF8F3]/60">100% gỗ tự nhiên, không sử dụng keo hóa chất tổng hợp.</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="text-[#A58548] text-sm">✓</span>
            <div>
              <p className="font-semibold text-[#FAF8F3]">Ký quỹ an toàn tuyệt đối</p>
              <p className="text-[10px] text-[#FAF8F3]/60">Tài khoản bảo chứng chỉ tất toán sau khi nghiệm thu.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Patron Member Notice */}
      {!isAuthenticated && (
        <div className="bg-[#FAF8F3] p-5 rounded-[2px] border border-[#D2C8BA]/60 space-y-2">
          <span className="font-sans text-[10px] font-semibold text-[#A58548] uppercase tracking-widest block">
            Đặc quyền Thành viên AUREN
          </span>
          <p className="font-sans text-xs text-[#4E4540] leading-relaxed">
            Đăng nhập tài khoản Patron để kích hoạt chiết khấu tự động từ 5% đến 15% theo hạng thành viên của quý khách.
          </p>
          <Link
            to="/login?redirect=/cart"
            className="inline-block font-sans text-xs font-semibold uppercase tracking-wider text-[#0D0703] underline underline-offset-4 hover:text-[#A58548] pt-1"
          >
            Đăng nhập ngay →
          </Link>
        </div>
      )}
    </div>
  );
};
