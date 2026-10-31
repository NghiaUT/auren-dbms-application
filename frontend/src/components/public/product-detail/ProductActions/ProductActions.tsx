import React from 'react';
import { Link } from 'react-router-dom';
import type { ProductDetail, UserRole, Variant } from '../../../../types';
import { formatVND } from '../../../../utils/formatVND';

export interface ProductActionsProps {
  product: ProductDetail;
  selectedVariant: Variant | null;
  userRole?: UserRole;
  onAddToBag: () => void;
  onOpenViewingModal: () => void;
}

export const ProductActions: React.FC<ProductActionsProps> = ({
  product,
  selectedVariant,
  userRole,
  onAddToBag,
  onOpenViewingModal,
}) => {
  const isInternalStaff = userRole === 'sales' || userRole === 'admin';

  return (
    <div className="space-y-4">
      {/* Banner thời gian chế tác */}
      <div className="flex items-center gap-3 bg-[#EAE4D9]/60 p-4 rounded-[2px]">
        <svg className="w-5 h-5 text-[#A58548] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <div>
          <p className="font-sans text-xs font-semibold text-[#0D0703]">
            Chế tác thủ công theo yêu cầu tại Atelier
          </p>
          <p className="font-sans text-[11px] text-[#4E4540]">
            {selectedVariant?.leadTimeDays
              ? `Thời gian hoàn thiện dự kiến: ${selectedVariant.leadTimeDays} ngày`
              : 'Tiêu chuẩn hoàn thiện 4–6 tuần'} • Gỗ chứng nhận bền vững FSC
          </p>
        </div>
      </div>

      {/* Purchase & Inquiry CTAs */}
      {isInternalStaff ? (
        <div className="bg-[#FAF8F3] border border-[#D2C8BA] p-4 rounded-[2px] flex items-start gap-3">
          <svg className="w-5 h-5 text-[#A58548] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div className="space-y-1">
            <p className="font-sans text-xs font-semibold uppercase tracking-wider text-[#0D0703]">
              Chế độ xem Nội bộ ({userRole === 'admin' ? 'Admin' : 'Sales'})
            </p>
            <p className="font-sans text-xs text-[#4E4540] leading-relaxed">
              Chức năng thêm vào bộ sưu tập (giỏ hàng) và đặt mua tác phẩm chỉ dành riêng cho tài khoản Khách hàng (Patron).
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {product.isLimited && selectedVariant && (
            <Link
              to={`/limited/${selectedVariant.id}`}
              className="w-full bg-[#A58548] text-[#FAF8F3] py-4 px-6 text-center font-sans text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#8F723C] transition-all duration-300 shadow-md flex items-center justify-center gap-2 rounded-[2px]"
            >
              <span>★ Mua bản Limited Edition (Đánh số độc bản)</span>
            </Link>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onAddToBag}
              className="flex-1 bg-[#271E18] text-[#FAF8F3] py-4 px-6 text-center font-sans text-xs font-semibold uppercase tracking-[0.18em] hover:bg-[#0D0703] transition-all duration-300 shadow-md active:translate-y-0.5 flex items-center justify-center gap-2 rounded-[2px]"
            >
              <svg className="w-4 h-4 text-[#A58548]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>
                Đưa vào bộ sưu tập • {selectedVariant ? formatVND(selectedVariant.price) : ''}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenViewingModal}
              className="bg-[#FAF8F3] hover:bg-[#F0EEE8] text-[#0D0703] border border-[#D2C8BA] py-4 px-6 font-sans text-xs font-semibold uppercase tracking-[0.16em] transition-colors flex items-center justify-center gap-2 rounded-[2px]"
            >
              <svg className="w-4 h-4 text-[#A58548]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Trải nghiệm riêng</span>
            </button>
          </div>
        </div>
      )}

      {/* Trust Badges */}
      <div className="flex items-center justify-between text-[#7B6E64] pt-1 text-[10px] uppercase tracking-wider">
        <div className="flex items-center gap-1.5">
          <span className="text-[#A58548]">✓</span>
          <span>Bảo hành kết cấu trọn đời</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[#A58548]">✓</span>
          <span>Lắp đặt White-Glove</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[#A58548]">✓</span>
          <span>Thanh toán ký quỹ</span>
        </div>
      </div>
    </div>
  );
};
