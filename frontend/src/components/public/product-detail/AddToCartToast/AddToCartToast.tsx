import React from 'react';
import { Link } from 'react-router-dom';

export interface AddToCartToastProps {
  message: string | null;
}

export const AddToCartToast: React.FC<AddToCartToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-[#271E18] text-[#FAF8F3] px-6 py-4 shadow-2xl flex items-center gap-4 rounded-[2px] border border-[#A58548]/40 animate-slide-up">
      <span className="text-[#A58548] text-xl">✓</span>
      <div>
        <p className="font-sans text-xs font-medium text-[#FAF8F3]">{message}</p>
        <p className="font-sans text-[10px] text-[#FAF8F3]/70">Đã cập nhật vị thế đặt phòng White-Glove.</p>
      </div>
      <Link
        to="/cart"
        className="ml-4 font-sans text-[11px] font-semibold uppercase tracking-widest underline underline-offset-4 text-[#FFDDB1] hover:text-[#FAF8F3] whitespace-nowrap"
      >
        Xem Giỏ Hàng →
      </Link>
    </div>
  );
};
