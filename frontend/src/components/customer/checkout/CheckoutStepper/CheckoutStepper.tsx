import React from 'react';
import { Link } from 'react-router-dom';

export const CheckoutStepper: React.FC = () => {
  return (
    <section className="w-full bg-[#F6F3ED] py-8 px-6 md:px-12 lg:px-16 border-b border-[#D2C8BA]/40 mb-10">
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <span className="font-sans text-[10px] font-semibold text-[#A58548] uppercase tracking-[0.2em] block">
            Curated Acquisition
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#0D0703] tracking-tight font-normal">
            Giao Nhận &amp; Điều Phối White-Glove
          </h1>
        </div>

        {/* Stepper Indicator */}
        <nav
          aria-label="Acquisition Progress"
          className="flex items-center gap-3 sm:gap-6 font-sans text-xs uppercase tracking-widest text-[#7B6E64]"
        >
          <Link to="/cart" className="flex items-center gap-2 hover:text-[#0D0703] transition-colors">
            <span className="w-5 h-5 rounded-full bg-[#EAE4D9] flex items-center justify-center font-mono text-[9px]">
              01
            </span>
            <span>Túi hàng</span>
          </Link>
          <span className="text-[#D2C8BA]">—</span>
          <div className="flex items-center gap-2 text-[#0D0703] font-semibold">
            <span className="w-5 h-5 rounded-full bg-[#0D0703] text-[#FAF8F3] flex items-center justify-center font-mono text-[9px]">
              02
            </span>
            <span className="border-b-2 border-[#0D0703] pb-0.5">Địa chỉ &amp; Điều phối</span>
          </div>
          <span className="text-[#D2C8BA]">—</span>
          <div className="flex items-center gap-2 text-[#7B6E64] opacity-60">
            <span className="w-5 h-5 rounded-full bg-[#EAE4D9] flex items-center justify-center font-mono text-[9px]">
              03
            </span>
            <span>Niêm phong</span>
          </div>
        </nav>
      </div>
    </section>
  );
};
