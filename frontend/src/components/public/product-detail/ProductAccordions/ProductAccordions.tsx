import React from 'react';
import type { ProductDetail, Variant } from '../../../../types';

export interface ProductAccordionsProps {
  product: ProductDetail;
  selectedVariant: Variant | null;
  activeAccordion: string | null;
  onToggleAccordion: (key: string) => void;
}

export const ProductAccordions: React.FC<ProductAccordionsProps> = ({
  product,
  selectedVariant,
  activeAccordion,
  onToggleAccordion,
}) => {
  return (
    <div className="space-y-2 pt-4">
      {/* Item 1: Dimensions */}
      <div className="bg-[#F6F3ED] rounded-[2px] border border-[#D2C8BA]/40">
        <button
          type="button"
          onClick={() => onToggleAccordion('acc-dims')}
          className="w-full p-4 flex items-center justify-between text-left group"
        >
          <span className="font-sans text-xs font-semibold uppercase tracking-widest text-[#0D0703] group-hover:text-[#A58548] transition-colors">
            Kích thước • Trọng lượng kiến trúc
          </span>
          <span
            className={`text-[#0D0703] transform transition-transform duration-300 ${
              activeAccordion === 'acc-dims' ? 'rotate-180' : ''
            }`}
          >
            ▼
          </span>
        </button>
        {activeAccordion === 'acc-dims' && (
          <div className="px-4 pb-6 space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#FCF9F3] p-3 border border-[#D2C8BA]/30 rounded-[1px]">
                <span className="font-sans text-[10px] uppercase tracking-widest text-[#7B6E64]">
                  Quy cách kích thước
                </span>
                <p className="font-serif text-lg text-[#0D0703] mt-0.5">
                  {product.dimensions || selectedVariant?.size || 'Tiêu chuẩn'}
                </p>
              </div>
              <div className="bg-[#FCF9F3] p-3 border border-[#D2C8BA]/30 rounded-[1px]">
                <span className="font-sans text-[10px] uppercase tracking-widest text-[#7B6E64]">
                  Khoảng lọt lòng tối thiểu
                </span>
                <p className="font-serif text-lg text-[#0D0703] mt-0.5">45 cm từ vách tĩnh</p>
              </div>
            </div>
            <p className="font-sans text-xs text-[#4E4540] leading-relaxed">
              Các thông số được hiệu chuẩn chính xác để đảm bảo lưu thông khí và ánh sáng tự nhiên trong phòng khách hoặc phòng làm việc.
            </p>
          </div>
        )}
      </div>

      {/* Item 2: Materials & Provenance */}
      <div className="bg-[#F6F3ED] rounded-[2px] border border-[#D2C8BA]/40">
        <button
          type="button"
          onClick={() => onToggleAccordion('acc-mats')}
          className="w-full p-4 flex items-center justify-between text-left group"
        >
          <span className="font-sans text-xs font-semibold uppercase tracking-widest text-[#0D0703] group-hover:text-[#A58548] transition-colors">
            Nguồn gốc vật liệu • Chứng chỉ khai thác
          </span>
          <span
            className={`text-[#0D0703] transform transition-transform duration-300 ${
              activeAccordion === 'acc-mats' ? 'rotate-180' : ''
            }`}
          >
            ▼
          </span>
        </button>
        {activeAccordion === 'acc-mats' && (
          <div className="px-4 pb-6 space-y-3 pt-1 font-sans text-xs text-[#4E4540] leading-relaxed">
            <p>
              <strong>Gỗ óc chó đen Bắc Mỹ (Juglans nigra):</strong> Khai thác từ các khu rừng trồng tái sinh có kiểm soát tại Pennsylvania. Sấy lò hơn 40 ngày để đạt độ ẩm cân bằng 7%, triệt tiêu co ngót trước điều kiện khí hậu nhiệt đới.
            </p>
            <p>
              <strong>Da thuộc thảo mộc:</strong> Da bò nguyên tấm từ xưởng thuộc truyền thống tại Scandinavia, sử dụng tannin chiết xuất từ vỏ cây keo (mimosa) và hạt dẻ, không sử dụng muối crom độc hại.
            </p>
          </div>
        )}
      </div>

      {/* Item 3: Delivery */}
      <div className="bg-[#F6F3ED] rounded-[2px] border border-[#D2C8BA]/40">
        <button
          type="button"
          onClick={() => onToggleAccordion('acc-ship')}
          className="w-full p-4 flex items-center justify-between text-left group"
        >
          <span className="font-sans text-xs font-semibold uppercase tracking-widest text-[#0D0703] group-hover:text-[#A58548] transition-colors">
            Giao nhận &amp; Lắp đặt White-Glove
          </span>
          <span
            className={`text-[#0D0703] transform transition-transform duration-300 ${
              activeAccordion === 'acc-ship' ? 'rotate-180' : ''
            }`}
          >
            ▼
          </span>
        </button>
        {activeAccordion === 'acc-ship' && (
          <div className="px-4 pb-6 space-y-3 pt-1 font-sans text-xs text-[#4E4540] leading-relaxed">
            <p>
              Mỗi tác phẩm được bao bọc trong thùng gỗ thông bảo vệ tái sử dụng. Đội ngũ chuyên viên AUREN White-Glove sẽ vận chuyển tận phòng, tháo dỡ, kiểm tra kết cấu cân bằng và thu dọn toàn bộ vật liệu đóng gói.
            </p>
          </div>
        )}
      </div>

      {/* Item 4: Care & Longevity */}
      <div className="bg-[#F6F3ED] rounded-[2px] border border-[#D2C8BA]/40">
        <button
          type="button"
          onClick={() => onToggleAccordion('acc-care')}
          className="w-full p-4 flex items-center justify-between text-left group"
        >
          <span className="font-sans text-xs font-semibold uppercase tracking-widest text-[#0D0703] group-hover:text-[#A58548] transition-colors">
            Bảo dưỡng &amp; Quá trình hình thành Patina
          </span>
          <span
            className={`text-[#0D0703] transform transition-transform duration-300 ${
              activeAccordion === 'acc-care' ? 'rotate-180' : ''
            }`}
          >
            ▼
          </span>
        </button>
        {activeAccordion === 'acc-care' && (
          <div className="px-4 pb-6 space-y-3 pt-1 font-sans text-xs text-[#4E4540] leading-relaxed">
            <p>
              Bề mặt được hoàn thiện bằng hai lớp dầu lanh ép lạnh và sáp ong tự nhiên. Khuyến nghị quét lại sáp dưỡng chuyên dụng mỗi 18 tháng để nuôi dưỡng thớ gỗ.
            </p>
            <p>
              Chất da thuộc thảo mộc sẽ tự nhiên sẫm màu và phát triển lớp ánh mật ong (patina) tuyệt đẹp qua từng năm tháng sử dụng.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
