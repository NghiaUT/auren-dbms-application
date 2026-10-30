import React from 'react';
import { Link } from 'react-router-dom';

export const CartEmptyState: React.FC = () => {
  return (
    <div className="text-center py-24 px-6 bg-[#FAF8F3] border border-[#D2C8BA]/60 rounded-[2px] max-w-2xl mx-auto space-y-4">
      <div className="w-14 h-14 mx-auto rounded-full bg-[#EAE4D9] flex items-center justify-center text-[#7B6E64]">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
      </div>
      <h3 className="font-serif text-3xl text-[#0D0703]">Túi hàng của quý khách đang trống</h3>
      <p className="font-sans text-xs text-[#7B6E64] max-w-md mx-auto leading-relaxed">
        Chưa có tác phẩm nội thất nào được lưu giữ trong phiên hiện tại. Mời quý khách khám phá các bộ sưu tập kinh điển của chúng tôi.
      </p>
      <div className="pt-4">
        <Link
          to="/products"
          className="inline-block px-8 py-3.5 bg-[#271E18] text-[#FAF8F3] font-sans text-xs uppercase tracking-widest hover:bg-[#0D0703] transition-colors rounded-[2px]"
        >
          Khám phá Bộ sưu tập →
        </Link>
      </div>
    </div>
  );
};
