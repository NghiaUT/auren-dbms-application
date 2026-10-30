import React from 'react';

export interface SpatialAccessSectionProps {
  recipientName: string;
  onRecipientNameChange: (val: string) => void;
  streetAddress: string;
  onStreetAddressChange: (val: string) => void;
  residenceDetails: string;
  onResidenceDetailsChange: (val: string) => void;
  city: string;
  onCityChange: (val: string) => void;
  elevatorDimension: boolean;
  onElevatorDimensionChange: (val: boolean) => void;
  freightElevator: boolean;
  onFreightElevatorChange: (val: boolean) => void;
  historicStairs: boolean;
  onHistoricStairsChange: (val: boolean) => void;
  stoneCourtyard: boolean;
  onStoneCourtyardChange: (val: boolean) => void;
  deliveryHorizon: string;
  onDeliveryHorizonChange: (val: string) => void;
}

export const SpatialAccessSection: React.FC<SpatialAccessSectionProps> = ({
  recipientName,
  onRecipientNameChange,
  streetAddress,
  onStreetAddressChange,
  residenceDetails,
  onResidenceDetailsChange,
  city,
  onCityChange,
  elevatorDimension,
  onElevatorDimensionChange,
  freightElevator,
  onFreightElevatorChange,
  historicStairs,
  onHistoricStairsChange,
  stoneCourtyard,
  onStoneCourtyardChange,
  deliveryHorizon,
  onDeliveryHorizonChange,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between border-b border-[#D2C8BA]/50 pb-3">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-xs text-[#A7824B]">02.0</span>
          <h2 className="font-serif text-2xl text-[#0D0703]">Địa Điểm &amp; Điều Kiện Không Gian</h2>
        </div>
        <span className="font-sans text-[10px] text-[#A58548] font-semibold uppercase tracking-wider">
          ✦ Curated Placement
        </span>
      </div>

      <div className="space-y-4">
        <div className="bg-[#FAF8F3] border border-[#D2C8BA] p-3.5 rounded-[2px]">
          <label
            className="block font-sans text-[10px] uppercase font-semibold text-[#7B6E64] tracking-wider mb-1"
            htmlFor="recipient-name"
          >
            Họ &amp; Tên Người Tiếp Nhận
          </label>
          <input
            id="recipient-name"
            type="text"
            required
            value={recipientName}
            onChange={(e) => onRecipientNameChange(e.target.value)}
            placeholder="Nguyễn Văn A"
            className="w-full bg-transparent font-sans text-xs text-[#0D0703] focus:outline-none"
          />
        </div>

        <div className="bg-[#FAF8F3] border border-[#D2C8BA] p-3.5 rounded-[2px]">
          <label
            className="block font-sans text-[10px] uppercase font-semibold text-[#7B6E64] tracking-wider mb-1"
            htmlFor="dest-address"
          >
            Địa Chỉ Tòa Nhà / Biệt Thự / Khu Đô Thị
          </label>
          <input
            id="dest-address"
            type="text"
            required
            value={streetAddress}
            onChange={(e) => onStreetAddressChange(e.target.value)}
            placeholder="Số 12 Lê Lợi, Phường Bến Nghé"
            className="w-full bg-transparent font-sans text-xs text-[#0D0703] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#FAF8F3] border border-[#D2C8BA] p-3.5 rounded-[2px]">
            <label
              className="block font-sans text-[10px] uppercase font-semibold text-[#7B6E64] tracking-wider mb-1"
              htmlFor="dest-suite"
            >
              Căn Hộ / Penthouse / Tầng
            </label>
            <input
              id="dest-suite"
              type="text"
              value={residenceDetails}
              onChange={(e) => onResidenceDetailsChange(e.target.value)}
              placeholder="Penthouse 4B (Tháp Sapphire)"
              className="w-full bg-transparent font-sans text-xs text-[#0D0703] focus:outline-none"
            />
          </div>

          <div className="bg-[#FAF8F3] border border-[#D2C8BA] p-3.5 rounded-[2px]">
            <label
              className="block font-sans text-[10px] uppercase font-semibold text-[#7B6E64] tracking-wider mb-1"
              htmlFor="dest-city"
            >
              Tỉnh / Thành Phố
            </label>
            <input
              id="dest-city"
              type="text"
              required
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              placeholder="TP. Hồ Chí Minh"
              className="w-full bg-transparent font-sans text-xs text-[#0D0703] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Bảng trắc nghiệm tiếp cận kiến trúc (Architectural Building Access) */}
      <div className="bg-[#F6F3ED] p-5 rounded-[2px] border border-[#D2C8BA]/60 space-y-3">
        <div className="space-y-1">
          <h4 className="font-serif text-base text-[#0D0703]">Khảo Sát Lối Vào &amp; Tiếp Cận Kiến Trúc</h4>
          <p className="font-sans text-[11px] text-[#7B6E64] leading-relaxed">
            Chuyên viên AUREN White-Glove trang bị đệm mút bảo vệ sàn gỗ, găng tay lụa và dụng cụ lắp mộng gỗ chuyên dụng. Vui lòng xác định điều kiện tiếp cận:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <label className="flex items-center gap-2.5 p-3 bg-[#FCF9F3] border border-[#D2C8BA]/60 rounded-[2px] cursor-pointer hover:bg-white transition-colors text-xs text-[#0D0703]">
            <input
              type="checkbox"
              checked={elevatorDimension}
              onChange={(e) => onElevatorDimensionChange(e.target.checked)}
              className="rounded-[1px] accent-[#271E18]"
            />
            <span>Kích thước thang máy lọt lòng &ge; 220cm</span>
          </label>

          <label className="flex items-center gap-2.5 p-3 bg-[#FCF9F3] border border-[#D2C8BA]/60 rounded-[2px] cursor-pointer hover:bg-white transition-colors text-xs text-[#0D0703]">
            <input
              type="checkbox"
              checked={freightElevator}
              onChange={(e) => onFreightElevatorChange(e.target.checked)}
              className="rounded-[1px] accent-[#271E18]"
            />
            <span>Cần đăng ký thang máy hàng chuyên dụng</span>
          </label>

          <label className="flex items-center gap-2.5 p-3 bg-[#FCF9F3] border border-[#D2C8BA]/60 rounded-[2px] cursor-pointer hover:bg-white transition-colors text-xs text-[#0D0703]">
            <input
              type="checkbox"
              checked={historicStairs}
              onChange={(e) => onHistoricStairsChange(e.target.checked)}
              className="rounded-[1px] accent-[#271E18]"
            />
            <span>Cầu thang xoắn hoặc cầu thang bộ dốc</span>
          </label>

          <label className="flex items-center gap-2.5 p-3 bg-[#FCF9F3] border border-[#D2C8BA]/60 rounded-[2px] cursor-pointer hover:bg-white transition-colors text-xs text-[#0D0703]">
            <input
              type="checkbox"
              checked={stoneCourtyard}
              onChange={(e) => onStoneCourtyardChange(e.target.checked)}
              className="rounded-[1px] accent-[#271E18]"
            />
            <span>Sân trong lát đá hoặc lối đi sảnh lớn</span>
          </label>
        </div>

        {/* Delivery Horizon */}
        <div className="pt-3 space-y-2">
          <span className="font-sans text-[10px] font-semibold text-[#7B6E64] uppercase tracking-wider block">
            Khung giờ tiếp nhận bàn giao mong muốn
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => onDeliveryHorizonChange('morning')}
              className={`p-3 text-center border rounded-[2px] transition-all text-xs ${
                deliveryHorizon === 'morning'
                  ? 'bg-[#271E18] text-[#FAF8F3] border-[#271E18]'
                  : 'bg-[#FCF9F3] border-[#D2C8BA] text-[#0D0703]'
              }`}
            >
              <strong className="block font-serif text-sm">Buổi Sáng</strong>
              <span className="text-[10px] opacity-80">08:00 — 12:00</span>
            </button>

            <button
              type="button"
              onClick={() => onDeliveryHorizonChange('afternoon')}
              className={`p-3 text-center border rounded-[2px] transition-all text-xs ${
                deliveryHorizon === 'afternoon'
                  ? 'bg-[#271E18] text-[#FAF8F3] border-[#271E18]'
                  : 'bg-[#FCF9F3] border-[#D2C8BA] text-[#0D0703]'
              }`}
            >
              <strong className="block font-serif text-sm">Buổi Chiều</strong>
              <span className="text-[10px] opacity-80">13:00 — 17:00</span>
            </button>

            <button
              type="button"
              onClick={() => onDeliveryHorizonChange('weekend')}
              className={`p-3 text-center border rounded-[2px] transition-all text-xs ${
                deliveryHorizon === 'weekend'
                  ? 'bg-[#271E18] text-[#FAF8F3] border-[#271E18]'
                  : 'bg-[#FCF9F3] border-[#D2C8BA] text-[#0D0703]'
              }`}
            >
              <strong className="block font-serif text-sm">Thứ Bảy Atelier</strong>
              <span className="text-[10px] opacity-80">09:00 — 14:00</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
