import React from 'react';

export const CartNotificationBar: React.FC = () => {
  return (
    <section className="w-full bg-[#EAE4D9]/60 py-3 px-6 md:px-12 lg:px-16 border-b border-[#D2C8BA]/40 mb-8">
      <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between text-[#4E4540] gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#A58548] animate-pulse" />
          <p className="font-sans text-[11px] font-semibold uppercase tracking-widest text-[#0D0703]">
            Lưu trữ tác phẩm Atelier · Hỗ trợ vận chuyển &amp; lắp đặt White-Glove toàn quốc
          </p>
        </div>
        <p className="font-sans text-[10px] text-[#7B6E64] uppercase tracking-wider hidden md:block">
          Bảo chứng chất lượng bởi Xưởng chế tác AUREN
        </p>
      </div>
    </section>
  );
};
