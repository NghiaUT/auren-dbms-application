import React from 'react';

export interface ViewingFormData {
  gallery: string;
  fullName: string;
  email: string;
  phone: string;
  note: string;
}

export interface PrivateViewingModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  viewingForm: ViewingFormData;
  onChangeForm: (form: ViewingFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const PrivateViewingModal: React.FC<PrivateViewingModalProps> = ({
  isOpen,
  onClose,
  productName,
  viewingForm,
  onChangeForm,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#271E18]/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#FCF9F3] max-w-lg w-full p-8 md:p-10 space-y-6 relative shadow-2xl rounded-[2px] border border-[#D2C8BA]">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 text-[#7B6E64] hover:text-[#0D0703] transition-colors"
          aria-label="Đóng hộp thoại"
        >
          ✕
        </button>

        <div className="space-y-2">
          <span className="font-sans text-[10px] font-semibold text-[#A58548] uppercase tracking-widest block">
            Concierge Reservation
          </span>
          <h3 className="font-serif text-2xl text-[#0D0703]">Yêu Cầu Trải Nghiệm Riêng</h3>
          <p className="font-sans text-xs text-[#4E4540] leading-relaxed">
            Trải nghiệm trực tiếp tác phẩm {productName} tại không gian salon riêng tư với sự hướng dẫn của nghệ nhân chế tác.
          </p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="font-sans text-[11px] font-semibold uppercase tracking-wider text-[#0D0703] block mb-1">
              Showroom Tiếp Đón
            </label>
            <select
              value={viewingForm.gallery}
              onChange={(e) => onChangeForm({ ...viewingForm, gallery: e.target.value })}
              className="w-full bg-[#FAF8F3] border border-[#D2C8BA] p-3 font-sans text-xs text-[#0D0703] focus:outline-none focus:border-[#0D0703] rounded-[2px]"
            >
              <option value="Showroom Flagship Tràng Tiền, Hoàn Kiếm, Hà Nội">
                Showroom Flagship Tràng Tiền, Hà Nội
              </option>
              <option value="Showroom Flagship Thảo Điền, TP. Hồ Chí Minh">
                Showroom Flagship Thảo Điền, TP. Hồ Chí Minh
              </option>
              <option value="Không gian Salon Atelier Đồng Khởi, Quận 1">
                Không gian Salon Atelier Đồng Khởi, Quận 1
              </option>
            </select>
          </div>

          <div>
            <label className="font-sans text-[11px] font-semibold uppercase tracking-wider text-[#0D0703] block mb-1">
              Họ &amp; Tên Quý Khách
            </label>
            <input
              type="text"
              required
              value={viewingForm.fullName}
              onChange={(e) => onChangeForm({ ...viewingForm, fullName: e.target.value })}
              placeholder="Nguyễn Văn A"
              className="w-full bg-[#FAF8F3] border border-[#D2C8BA] p-3 font-sans text-xs text-[#0D0703] focus:outline-none focus:border-[#0D0703] rounded-[2px]"
            />
          </div>

          <div>
            <label className="font-sans text-[11px] font-semibold uppercase tracking-wider text-[#0D0703] block mb-1">
              Email Liên Hệ
            </label>
            <input
              type="email"
              required
              value={viewingForm.email}
              onChange={(e) => onChangeForm({ ...viewingForm, email: e.target.value })}
              placeholder="patron@domain.com"
              className="w-full bg-[#FAF8F3] border border-[#D2C8BA] p-3 font-sans text-xs text-[#0D0703] focus:outline-none focus:border-[#0D0703] rounded-[2px]"
            />
          </div>

          <div>
            <label className="font-sans text-[11px] font-semibold uppercase tracking-wider text-[#0D0703] block mb-1">
              Số Điện Thoại
            </label>
            <input
              type="tel"
              value={viewingForm.phone}
              onChange={(e) => onChangeForm({ ...viewingForm, phone: e.target.value })}
              placeholder="0901 234 567"
              className="w-full bg-[#FAF8F3] border border-[#D2C8BA] p-3 font-sans text-xs text-[#0D0703] focus:outline-none focus:border-[#0D0703] rounded-[2px]"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#271E18] text-[#FAF8F3] py-4 font-sans text-xs font-semibold uppercase tracking-[0.18em] hover:bg-[#0D0703] transition-colors rounded-[2px]"
          >
            Xác Nhận Đặt Lịch Hẹn
          </button>
        </form>
      </div>
    </div>
  );
};
