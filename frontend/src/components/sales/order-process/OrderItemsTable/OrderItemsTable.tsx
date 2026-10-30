import React from 'react';
import type { OrderItemDetail } from '../../../../types';
import { formatVND } from '../../../../utils/formatVND';

export interface OrderItemsTableProps {
  items: OrderItemDetail[];
}

export const OrderItemsTable: React.FC<OrderItemsTableProps> = ({ items }) => {
  return (
    <section className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] p-6">
      <h3 className="font-serif text-xl text-[#0D0703] mb-4 pb-3 border-b border-[#D2C8BA]/40">
        Tác Phẩm Kiến Trúc May Đo ({items?.length || 0})
      </h3>

      <div className="divide-y divide-[#D2C8BA]/30">
        {items?.map((item) => (
          <div
            key={item.id}
            className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-base font-medium text-[#0D0703]">
                  {item.productName}
                </span>
                {item.serialNo && (
                  <span className="font-mono text-[9px] uppercase px-2 py-0.5 bg-[#A7824B] text-[#FAF8F3] font-bold rounded-[1px]">
                    {item.serialNo}
                  </span>
                )}
              </div>

              <div className="text-[11px] text-[#7B6E64] space-y-0.5 mt-1 font-sans">
                <p>
                  SKU: <span className="font-mono font-semibold">{item.sku}</span> | Lớp phủ:{' '}
                  {item.finish} | Kích thước: {item.size}
                </p>
                {item.locationName && (
                  <p>
                    Showroom xuất: <strong className="text-[#0D0703]">{item.locationName}</strong>
                  </p>
                )}
                {item.customization &&
                  (item.customization.plaque || item.customization.monogram) && (
                    <div className="p-2 bg-white border border-[#D2C8BA] rounded-[2px] inline-block mt-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#A7824B] font-bold block">
                        Khắc Biển Đồng Atelier Plaque:
                      </span>
                      <span className="font-serif italic text-xs text-[#0D0703]">
                        "{item.customization.plaque || item.customization.monogram}"
                      </span>
                    </div>
                  )}
              </div>
            </div>

            <div className="text-right whitespace-nowrap">
              <span className="text-xs text-[#7B6E64] block">Số lượng: {item.quantity}</span>
              <span className="font-serif font-medium text-base text-[#0D0703] block mt-0.5">
                {formatVND(item.unitPrice * item.quantity)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
