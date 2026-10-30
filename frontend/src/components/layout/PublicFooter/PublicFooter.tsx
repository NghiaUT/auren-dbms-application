// ============================================================================
// File: frontend/src/components/layout/PublicFooter/PublicFooter.tsx
// Vai trò: Bố cục chân trang (Footer) phong cách kiến trúc AUREN:
//          - Tông màu đảo ngược (Espresso nền tối, chữ kem ngà)
//          - Đăng ký nhận bản tin Studio Dispatch
//          - Thông tin bản quyền, chứng nhận FSC và các điều khoản pháp lý
// ============================================================================

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export interface PublicFooterProps {
  readonly className?: string;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({ className = '' }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className={`bg-[#271E18] text-[#FAF8F3] pt-16 pb-12 ${className}`}>
      <div className="max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 pb-14 border-b border-[#FAF8F3]/15">
          {/* Brand Col (4 cols) */}
          <div className="md:col-span-4 flex flex-col gap-4">
            <Link
              to="/"
              className="font-serif text-2xl tracking-[0.2em] uppercase text-[#FAF8F3] select-none inline-block"
            >
              AUREN
            </Link>
            <p className="font-sans text-[13px] leading-relaxed text-[#FAF8F3]/75 max-w-sm">
              Nội thất kiến trúc đương đại định hình bởi chất liệu, tỷ lệ và thời gian. Thiết kế tại
              Stockholm, chế tác thủ công chuẩn xác tại Bắc Âu.
            </p>
            <span className="eyebrow eyebrow-light text-[10px] mt-2 opacity-50">
              Stockholm Studio — Skeppargatan 24
            </span>
          </div>

          {/* Navigation Col 1: Collection (2 cols) */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <h4 className="font-sans text-[11px] font-semibold tracking-[0.18em] uppercase text-[#FAF8F3]/60 mb-2">
              Bộ sưu tập
            </h4>
            <Link
              to="/products?categoryId=1"
              className="font-sans text-xs text-[#FAF8F3]/80 hover:text-[#FAF8F3] transition-colors"
            >
              Ghế đơn &amp; Sofa
            </Link>
            <Link
              to="/products?categoryId=2"
              className="font-sans text-xs text-[#FAF8F3]/80 hover:text-[#FAF8F3] transition-colors"
            >
              Bàn ăn &amp; Bàn trà
            </Link>
            <Link
              to="/products?categoryId=3"
              className="font-sans text-xs text-[#FAF8F3]/80 hover:text-[#FAF8F3] transition-colors"
            >
              Hệ tủ &amp; Kệ lưu trữ
            </Link>
            <Link
              to="/products?isLimited=true"
              className="font-sans text-xs text-[#A58548] hover:text-[#FAF8F3] transition-colors font-medium"
            >
              ★ Bản giới hạn (Limited)
            </Link>
          </div>

          {/* Navigation Col 2: Service (3 cols) */}
          <div className="md:col-span-3 flex flex-col gap-3">
            <h4 className="font-sans text-[11px] font-semibold tracking-[0.18em] uppercase text-[#FAF8F3]/60 mb-2">
              Dịch vụ Giám tuyển
            </h4>
            <p className="font-sans text-xs text-[#FAF8F3]/80">
              Chế tác tùy biến riêng (Made-to-order)
            </p>
            <p className="font-sans text-xs text-[#FAF8F3]/80">
              Vận chuyển White-Glove tận phòng
            </p>
            <p className="font-sans text-xs text-[#FAF8F3]/80">
              Bảo hành kết cấu trọn đời
            </p>
            <p className="font-sans text-xs text-[#FAF8F3]/80">
              Trải nghiệm Salon riêng tại Showroom
            </p>
          </div>

          {/* Newsletter Col (3 cols) */}
          <div className="md:col-span-3 flex flex-col gap-3">
            <h4 className="font-sans text-[11px] font-semibold tracking-[0.18em] uppercase text-[#FAF8F3]/60 mb-2">
              Bản tin Giám tuyển
            </h4>
            <p className="font-sans text-xs text-[#FAF8F3]/75 leading-relaxed">
              Nhận thông báo độc quyền về các đợt phát hành tác phẩm giới hạn và hồ sơ chuyên khảo kiến trúc.
            </p>

            {subscribed ? (
              <div className="bg-[#FAF8F3]/10 border border-[#FAF8F3]/20 p-3 rounded-[2px] text-xs text-[#FAF8F3]">
                Cảm ơn bạn đã đăng ký nhận bản tin Studio Dispatch.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col gap-2 mt-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Địa chỉ thư điện tử..."
                  required
                  className="bg-[#FAF8F3]/10 border border-[#FAF8F3]/25 px-3 py-2 text-xs text-[#FAF8F3] placeholder:text-[#FAF8F3]/40 focus:outline-none focus:border-[#A58548] rounded-[2px] transition-colors"
                />
                <button
                  type="submit"
                  className="w-full bg-[#FAF8F3] hover:bg-[#FAF8F3]/90 text-[#0D0703] py-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors rounded-[2px]"
                >
                  Đăng ký nhận tin
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Line: Copyright, Certifications */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[#FAF8F3]/50 text-xs font-sans">
          <div>
            © {new Date().getFullYear()} AUREN Architecture &amp; Atelier. Bản quyền thuộc về AUREN.
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-[#FAF8F3] transition-colors">
              Gỗ sấy FSC-STD-40-004
            </span>
            <span>•</span>
            <span className="hover:text-[#FAF8F3] transition-colors">
              Da thuộc thảo mộc REACH
            </span>
            <span>•</span>
            <span className="hover:text-[#FAF8F3] transition-colors">
              Chính sách bảo mật
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
