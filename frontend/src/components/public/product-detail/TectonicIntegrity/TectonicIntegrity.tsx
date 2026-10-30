import React from 'react';

export const TectonicIntegrity: React.FC = () => {
  return (
    <section className="w-full bg-[#503625] text-[#FAF8F3] py-20 lg:py-28 my-12">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16">
        <div className="max-w-2xl space-y-4 mb-16">
          <span className="font-sans text-[10px] font-semibold text-[#FFDDB1] tracking-[0.25em] uppercase">
            Tectonic Integrity
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl text-[#FAF8F3] tracking-tight">
            Giải Phẫu Sự Trường Tồn
          </h2>
          <p className="font-sans text-sm text-[#FAF8F3]/80 leading-relaxed">
            Mọi điểm giao nhau trong khung kết cấu AUREN đều được tính toán để triệt tiêu lực xé ngang bằng hình học vật lý thay vì keo dán hóa học.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pillar 1 */}
          <div className="space-y-6 bg-[#271E18]/50 p-8 rounded-[2px]">
            <div className="aspect-[4/3] bg-[#271E18]/80 overflow-hidden rounded-[1px]">
              <img
                src="https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=800&q=80&auto=format&fit=crop"
                alt="Mộng chốt cơ học"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-sans text-[10px] text-[#FFDDB1] uppercase tracking-widest block">
              01 // Mộng ghép truyền thống
            </span>
            <h3 className="font-serif text-2xl text-[#FAF8F3]">Khớp Mộng Âm Dương Khóa Nêm</h3>
            <p className="font-sans text-xs text-[#FAF8F3]/70 leading-relaxed">
              Đầu mộng xuyên suốt qua chân chịu lực, cố định bằng các nêm gỗ óc chó vát góc. Khi thời tiết giao mùa làm thớ gỗ co giãn, khớp mộng tự động siết chặt lại.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="space-y-6 bg-[#271E18]/50 p-8 rounded-[2px]">
            <div className="aspect-[4/3] bg-[#271E18]/80 overflow-hidden rounded-[1px]">
              <img
                src="https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&q=80&auto=format&fit=crop"
                alt="Thuộc da thảo mộc"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-sans text-[10px] text-[#FFDDB1] uppercase tracking-widest block">
              02 // Chiết xuất vỏ cây tự nhiên
            </span>
            <h3 className="font-serif text-2xl text-[#FAF8F3]">Ngâm Thuộc 180 Ngày</h3>
            <p className="font-sans text-xs text-[#FAF8F3]/70 leading-relaxed">
              Da được ngâm trong bể dung dịch vỏ cây mimosa và hạt dẻ trong 6 tháng liên tục. Cho ra lớp da có độ thở tự nhiên, thơm mùi mộc và thân thiện với làn da.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="space-y-6 bg-[#271E18]/50 p-8 rounded-[2px]">
            <div className="aspect-[4/3] bg-[#271E18]/80 overflow-hidden rounded-[1px]">
              <img
                src="https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=800&q=80&auto=format&fit=crop"
                alt="Đánh bóng sáp thủ công"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-sans text-[10px] text-[#FFDDB1] uppercase tracking-widest block">
              03 // Đánh bóng ma sát
            </span>
            <h3 className="font-serif text-2xl text-[#FAF8F3]">Hoàn Thiện Dầu Lanh &amp; Sáp Ong</h3>
            <p className="font-sans text-xs text-[#FAF8F3]/70 leading-relaxed">
              Không phủ bóng công nghiệp polyurethane. Bề mặt được lau 5 lần dầu lanh nguyên chất, đánh bóng bằng giẻ len khô để mang lại cảm giác mềm mượt tự nhiên.
            </p>
          </div>
        </div>

        {/* Metric Strip */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 border-t border-[#FAF8F3]/10">
          <div>
            <span className="font-serif text-3xl sm:text-4xl text-[#FFDDB1] font-light">42 Giờ</span>
            <p className="font-sans text-[10px] uppercase tracking-widest text-[#FAF8F3]/60 mt-1">
              Nghệ nhân gia công thủ công
            </p>
          </div>
          <div>
            <span className="font-serif text-3xl sm:text-4xl text-[#FFDDB1] font-light">100 Năm</span>
            <p className="font-sans text-[10px] uppercase tracking-widest text-[#FAF8F3]/60 mt-1">
              Vòng đời kết cấu kiến trúc
            </p>
          </div>
          <div>
            <span className="font-serif text-3xl sm:text-4xl text-[#FFDDB1] font-light">0%</span>
            <p className="font-sans text-[10px] uppercase tracking-widest text-[#FAF8F3]/60 mt-1">
              Keo dán hoá chất tổng hợp
            </p>
          </div>
          <div>
            <span className="font-serif text-3xl sm:text-4xl text-[#FFDDB1] font-light">3.2 kg</span>
            <p className="font-sans text-[10px] uppercase tracking-widest text-[#FAF8F3]/60 mt-1">
              Gỗ tái chế từ mỗi thân cây
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
