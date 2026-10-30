import React from 'react';

export interface CorrespondenceSectionProps {
  correspondenceEmail: string;
  onCorrespondenceEmailChange: (val: string) => void;
  correspondencePhone: string;
  onCorrespondencePhoneChange: (val: string) => void;
}

export const CorrespondenceSection: React.FC<CorrespondenceSectionProps> = ({
  correspondenceEmail,
  onCorrespondenceEmailChange,
  correspondencePhone,
  onCorrespondencePhoneChange,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between border-b border-[#D2C8BA]/50 pb-3">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-xs text-[#A7824B]">01.0</span>
          <h2 className="font-serif text-2xl text-[#0D0703]">Thư Tín &amp; Liên Lạc Điều Phối</h2>
        </div>
        <span className="font-sans text-[10px] text-[#7B6E64] uppercase tracking-widest">
          Confidential Protocol
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#FAF8F3] border border-[#D2C8BA] p-3.5 rounded-[2px]">
          <label
            className="block font-sans text-[10px] uppercase font-semibold text-[#7B6E64] tracking-wider mb-1"
            htmlFor="contact-email"
          >
            Email Liên Lạc Chính Thức
          </label>
          <input
            id="contact-email"
            type="email"
            required
            value={correspondenceEmail}
            onChange={(e) => onCorrespondenceEmailChange(e.target.value)}
            placeholder="patron@domain.com"
            className="w-full bg-transparent font-sans text-xs text-[#0D0703] focus:outline-none"
          />
        </div>

        <div className="bg-[#FAF8F3] border border-[#D2C8BA] p-3.5 rounded-[2px]">
          <label
            className="block font-sans text-[10px] uppercase font-semibold text-[#7B6E64] tracking-wider mb-1"
            htmlFor="contact-phone"
          >
            Số Điện Thoại Nhận Thông Báo Giao Hàng
          </label>
          <input
            id="contact-phone"
            type="tel"
            required
            value={correspondencePhone}
            onChange={(e) => onCorrespondencePhoneChange(e.target.value)}
            placeholder="0901 234 567"
            className="w-full bg-transparent font-sans text-xs text-[#0D0703] focus:outline-none"
          />
        </div>
      </div>

      <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#4E4540]">
        <input
          type="checkbox"
          defaultChecked
          className="mt-0.5 rounded-[1px] border-[#D2C8BA] text-[#0D0703] focus:ring-0 accent-[#271E18]"
        />
        <span>
          Gửi thông báo mã hóa SMS trước 60 phút khi chuyên viên White-Glove đến vị trí bàn giao.
        </span>
      </label>
    </div>
  );
};
