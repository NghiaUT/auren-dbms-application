import React from 'react';

export interface SettlementMethodSectionProps {
  settlementMethod: 'wire' | 'card';
  onSettlementMethodChange: (method: 'wire' | 'card') => void;
}

export const SettlementMethodSection: React.FC<SettlementMethodSectionProps> = ({
  settlementMethod,
  onSettlementMethodChange,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between border-b border-[#D2C8BA]/50 pb-3">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-xs text-[#A7824B]">03.0</span>
          <h2 className="font-serif text-2xl text-[#0D0703]">Giao Thức Thanh Toán Ký Quỹ</h2>
        </div>
        <span className="font-sans text-[10px] text-[#7B6E64] uppercase tracking-widest flex items-center gap-1">
          🔒 256-Bit TLS Vault
        </span>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-2 bg-[#EAE4D9]/60 p-1.5 rounded-[2px]">
        <button
          type="button"
          onClick={() => onSettlementMethodChange('wire')}
          className={`py-3 px-3 text-center rounded-[1px] font-sans text-xs uppercase tracking-wider transition-all ${
            settlementMethod === 'wire'
              ? 'bg-[#FCF9F3] text-[#0D0703] font-semibold shadow-sm'
              : 'text-[#7B6E64] hover:text-[#0D0703]'
          }`}
        >
          Chuyển Khoản Ngân Hàng Ký Quỹ (Escrow)
        </button>
        <button
          type="button"
          onClick={() => onSettlementMethodChange('card')}
          className={`py-3 px-3 text-center rounded-[1px] font-sans text-xs uppercase tracking-wider transition-all ${
            settlementMethod === 'card'
              ? 'bg-[#FCF9F3] text-[#0D0703] font-semibold shadow-sm'
              : 'text-[#7B6E64] hover:text-[#0D0703]'
          }`}
        >
          Thẻ Tín Dụng Quốc Tế (Visa / Master)
        </button>
      </div>

      {/* Active Panel Content */}
      {settlementMethod === 'wire' ? (
        <div className="p-6 bg-[#FAF8F3] border border-[#D2C8BA]/60 rounded-[2px] space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-sans text-[11px] text-[#A58548] uppercase tracking-widest font-semibold flex items-center gap-2">
              🏛 Khuyên dùng cho đơn hàng tác phẩm Atelier
            </span>
            <span className="font-mono text-[10px] text-[#7B6E64]">Direct Escrow Account</span>
          </div>
          <p className="font-sans text-xs text-[#4E4540] leading-relaxed">
            Khoản đặt cọc 50% sẽ được giữ trong tài khoản ký quỹ bảo chứng ngân hàng độc lập. Xưởng chế tác chỉ tiến hành giải ngân tất toán sau khi chuyên viên White-Glove cùng quý khách ký biên bản nghiệm thu sản phẩm tại tư gia.
          </p>
        </div>
      ) : (
        <div className="p-6 bg-[#FAF8F3] border border-[#D2C8BA]/60 rounded-[2px] space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-sans text-[10px] text-[#7B6E64] uppercase tracking-wider">
              Ủy quyền thẻ tín dụng trực tuyến
            </span>
            <div className="flex gap-2">
              <span className="text-[10px] font-mono bg-[#EAE4D9] px-2 py-0.5 rounded-[1px]">VISA</span>
              <span className="text-[10px] font-mono bg-[#EAE4D9] px-2 py-0.5 rounded-[1px]">MC</span>
              <span className="text-[10px] font-mono bg-[#EAE4D9] px-2 py-0.5 rounded-[1px]">AMEX</span>
            </div>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Số thẻ (VD: 4532 •••• •••• 8194)"
              defaultValue="4532 •••• •••• 8194"
              className="w-full bg-[#FCF9F3] border border-[#D2C8BA] p-3 text-xs text-[#0D0703] tracking-widest focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Hạn thẻ MM/YY"
                defaultValue="11/28"
                className="w-full bg-[#FCF9F3] border border-[#D2C8BA] p-3 text-xs text-[#0D0703] focus:outline-none"
              />
              <input
                type="password"
                placeholder="Mã bảo mật CVC"
                defaultValue="738"
                className="w-full bg-[#FCF9F3] border border-[#D2C8BA] p-3 text-xs text-[#0D0703] focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
