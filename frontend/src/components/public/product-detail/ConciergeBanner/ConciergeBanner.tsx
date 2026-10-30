import React from 'react';

export interface ConciergeBannerProps {
  onOpenViewingModal: () => void;
}

export const ConciergeBanner: React.FC<ConciergeBannerProps> = ({ onOpenViewingModal }) => {
  return (
    <section className="w-full bg-[#F0EEE8] py-16 border-t border-[#D2C8BA]/40">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16">
        <div className="bg-[#FAF8F3] p-8 md:p-14 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 shadow-sm rounded-[2px] border border-[#D2C8BA]/40">
          <div className="max-w-xl space-y-3">
            <span className="font-sans text-[10px] font-semibold text-[#A58548] uppercase tracking-[0.2em] block">
              Architectural Support
            </span>
            <h3 className="font-serif text-3xl text-[#0D0703]">
              Đặt Hàng Tùy Biến Riêng &amp; Dự Án Thiết Kế
            </h3>
            <p className="font-sans text-xs text-[#4E4540] leading-relaxed">
              Đối với các dự án biệt thự, penthouse hoặc chỉ định quy cách gỗ/vải đặc biệt cho khách sạn hạng sang, quý khách có thể làm việc trực tiếp với đội ngũ giám tuyển AUREN.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <button
              type="button"
              onClick={onOpenViewingModal}
              className="w-full sm:w-auto bg-[#271E18] text-[#FAF8F3] px-8 py-4 font-sans text-xs font-semibold uppercase tracking-[0.18em] hover:bg-[#0D0703] transition-colors flex items-center justify-center gap-2 rounded-[2px]"
            >
              <span>Đặt Lịch Trải Nghiệm Showroom</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
