import React from 'react';

export const CartStepper: React.FC = () => {
  return (
    <section className="w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#D2C8BA]/50">
        <div>
          <span className="font-sans text-[10px] font-semibold text-[#A58548] uppercase tracking-[0.2em] block mb-2">
            Order Review • White-Glove Logistics
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#0D0703] tracking-tight font-normal">
            Túi Hàng Bộ Sưu Tập
          </h1>
        </div>

        {/* Architectural Stepper */}
        <div className="flex items-center gap-4 font-sans text-xs uppercase tracking-widest">
          <div className="flex items-center gap-2 text-[#0D0703]">
            <span className="w-5 h-5 rounded-full bg-[#0D0703] text-[#FAF8F3] flex items-center justify-center text-[10px] font-semibold">
              01
            </span>
            <span className="border-b-2 border-[#0D0703] pb-0.5 font-semibold">Túi hàng</span>
          </div>
          <span className="text-[#D2C8BA]">—</span>
          <div className="flex items-center gap-2 text-[#7B6E64]">
            <span className="w-5 h-5 rounded-full bg-[#EAE4D9] text-[#7B6E64] flex items-center justify-center text-[10px]">
              02
            </span>
            <span>Giao nhận White-Glove</span>
          </div>
          <span className="text-[#D2C8BA]">—</span>
          <div className="flex items-center gap-2 text-[#7B6E64]">
            <span className="w-5 h-5 rounded-full bg-[#EAE4D9] text-[#7B6E64] flex items-center justify-center text-[10px]">
              03
            </span>
            <span>Quyết toán ký quỹ</span>
          </div>
        </div>
      </div>
    </section>
  );
};
