// ============================================================================
// File: frontend/src/components/PublicFooter.tsx
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
            <span className="eyebrow eyebrow-light text-[10px] pb-1">Bộ sưu tập</span>
            <ul className="flex flex-col gap-2.5 font-sans text-[12px] text-[#FAF8F3]/75">
              <li>
                <a href="/#collection" className="hover:text-white transition-colors link-line">
                  Ghế bành & Sofa
                </a>
              </li>
              <li>
                <a href="/#collection" className="hover:text-white transition-colors link-line">
                  Bàn ăn & Bàn làm việc
                </a>
              </li>
              <li>
                <a href="/#collection" className="hover:text-white transition-colors link-line">
                  Giường & Hệ tủ lưu trữ
                </a>
              </li>
              <li>
                <a href="/#collection" className="hover:text-white transition-colors link-line">
                  Đèn kiến trúc
                </a>
              </li>
              <li>
                <a href="/#materials" className="hover:text-white transition-colors link-line">
                  Bảng mẫu vật liệu
                </a>
              </li>
            </ul>
          </div>

          {/* Navigation Col 2: Studio (2 cols) */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <span className="eyebrow eyebrow-light text-[10px] pb-1">Xưởng thiết kế</span>
            <ul className="flex flex-col gap-2.5 font-sans text-[12px] text-[#FAF8F3]/75">
              <li>
                <a href="/#craft" className="hover:text-white transition-colors link-line">
                  Triết lý chế tác
                </a>
              </li>
              <li>
                <a href="/#journal" className="hover:text-white transition-colors link-line">
                  Tạp chí Studio
                </a>
              </li>
              <li>
                <a href="/#showroom" className="hover:text-white transition-colors link-line">
                  Hệ thống Showroom
                </a>
              </li>
              <li>
                <a href="/#showroom" className="hover:text-white transition-colors link-line">
                  Dành cho Kiến trúc sư
                </a>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors link-line">
                  Cổng thành viên
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Col (4 cols) */}
          <div className="md:col-span-4 flex flex-col gap-3">
            <span className="eyebrow eyebrow-light text-[10px] pb-1">Studio Dispatch</span>
            <p className="font-sans text-[12px] leading-relaxed text-[#FAF8F3]/75">
              Những ghi chép tĩnh lặng về các bản phát hành giới hạn, nghiên cứu kiến trúc và nguồn gốc
              gỗ đá. Phát hành hàng tháng, không tiếp thị ồn ào.
            </p>

            {subscribed ? (
              <div className="py-3 px-4 bg-[#503625] text-[#FAF8F3] text-xs font-sans rounded-[2px] border border-white/20">
                ✓ Cảm ơn bạn. Bạn đã được thêm vào danh sách Studio Dispatch của AUREN.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex items-center mt-2 border-b border-white/30 focus-within:border-white transition-colors">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập địa chỉ email của bạn"
                  required
                  autoComplete="email"
                  aria-label="Email nhận bản tin"
                  className="w-full bg-transparent border-none py-2.5 text-xs text-white placeholder-white/40 focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Đăng ký nhận tin"
                  className="text-white px-2 py-1 hover:translate-x-1 transition-transform font-serif text-lg"
                >
                  →
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-sans text-[11px] text-[#FAF8F3]/50">
          <span>© 2026 AUREN Studio AB. Bảo lưu mọi quyền. Thương hiệu kiến trúc đã đăng ký.</span>
          <div className="flex flex-wrap items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">
              Chính sách bảo mật
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Điều khoản dịch vụ
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Minh bạch vật liệu
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Chứng nhận rừng FSC®
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
