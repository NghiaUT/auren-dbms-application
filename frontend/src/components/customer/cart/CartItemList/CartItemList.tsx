import React from 'react';
import { Link } from 'react-router-dom';
import type { CartItem } from '../../../../utils/cartStorage';
import { formatVND } from '../../../../utils/formatVND';

export interface CartItemListProps {
  cartItems: CartItem[];
  onUpdateQuantity: (variantId: number, quantity: number) => void;
  onRemoveItem: (variantId: number) => void;
  onUpdateCustomization: (variantId: number, customization: { monogram?: string }) => void;
}

export const CartItemList: React.FC<CartItemListProps> = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateCustomization,
}) => {
  return (
    <div className="bg-[#FAF8F3] p-6 md:p-8 rounded-[2px] border border-[#D2C8BA]/60 shadow-sm space-y-8">
      {/* Table Header Meta */}
      <div className="hidden md:grid grid-cols-12 text-[#7B6E64] font-sans text-[10px] font-semibold uppercase tracking-widest pb-4 border-b border-[#D2C8BA]/40">
        <span className="col-span-6">Tác phẩm kiến trúc</span>
        <span className="col-span-3 text-center">Số lượng</span>
        <span className="col-span-3 text-right">Định giá</span>
      </div>

      {/* Items List */}
      <div className="divide-y divide-[#D2C8BA]/40 space-y-6">
        {cartItems.map((item) => (
          <div key={item.variantId} className="pt-6 first:pt-0 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Item Image (4:5) */}
            <div className="md:col-span-3 aspect-[4/5] bg-[#EAE4D9] overflow-hidden rounded-[2px] relative group">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.productName}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#7B6E64] text-xs uppercase tracking-widest">
                  AUREN
                </div>
              )}
              <span className="absolute top-2 left-2 bg-[#0D0703]/85 backdrop-blur-sm text-[#FAF8F3] font-sans text-[9px] uppercase px-2 py-0.5 tracking-widest rounded-[1px]">
                Archival Piece
              </span>
            </div>

            {/* Item Details */}
            <div className="md:col-span-5 flex flex-col justify-between h-full space-y-3">
              <div>
                <span className="font-mono text-[10px] text-[#A7824B] uppercase tracking-widest block">
                  Ref. {item.sku}
                </span>
                <h3 className="font-serif text-2xl text-[#0D0703] mt-1 leading-snug">
                  <Link to={`/products/${item.productId}`} className="hover:text-[#503625] transition-colors">
                    {item.productName}
                  </Link>
                </h3>
                <p className="font-sans text-xs text-[#4E4540] mt-1">
                  Quy cách: <strong>{item.variantFinish}</strong> • Kích thước: {item.variantSize}
                </p>
                <p className="font-sans text-[10px] text-[#7B6E64] mt-0.5">
                  Thời gian hoàn thiện dự kiến: 5–7 ngày làm việc
                </p>
              </div>

              {/* Custom Inscription / Brass Plaque Accordion */}
              <div className="pt-2">
                <details className="group cursor-pointer">
                  <summary className="font-sans text-[11px] font-semibold uppercase tracking-widest text-[#A58548] flex items-center gap-1 list-none focus:outline-none">
                    <span className="transition-transform group-open:rotate-90">▸</span>
                    <span>Khắc biển đồng lưu niệm cá nhân (+Miễn phí)</span>
                  </summary>
                  <div className="pt-3 pl-3 space-y-1">
                    <input
                      type="text"
                      maxLength={28}
                      placeholder="VD: VILLA SOL / ARCHIVE 2026"
                      value={item.customization?.monogram || ''}
                      onChange={(e) =>
                        onUpdateCustomization(item.variantId, { monogram: e.target.value })
                      }
                      className="w-full bg-[#FCF9F3] border border-[#D2C8BA] text-[#0D0703] font-sans text-xs px-3 py-2 rounded-[2px] focus:outline-none focus:border-[#0D0703]"
                    />
                    <p className="font-sans text-[10px] text-[#7B6E64]">
                      Biển đồng phay xước âm bản gắn dưới gầm khung chịu lực của tác phẩm.
                    </p>
                  </div>
                </details>
              </div>

              {/* Action: Remove */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.variantId)}
                  className="font-sans text-[10px] font-semibold text-[#7B6E64] hover:text-[#BA1A1A] transition-colors uppercase tracking-widest flex items-center gap-1"
                >
                  <span>✕ Gỡ khỏi bộ sưu tập</span>
                </button>
              </div>
            </div>

            {/* Quantity Controls */}
            <div className="md:col-span-2 flex md:justify-center items-center">
              <div className="inline-flex items-center bg-[#FCF9F3] border border-[#D2C8BA] px-2 py-1 gap-2 rounded-[2px]">
                <button
                  type="button"
                  aria-label="Giảm số lượng"
                  onClick={() => onUpdateQuantity(item.variantId, item.quantity - 1)}
                  className="w-6 h-6 flex items-center justify-center text-[#0D0703] hover:bg-[#EAE4D9] transition-colors text-sm font-semibold rounded-[1px]"
                >
                  −
                </button>
                <span className="font-sans text-xs font-semibold px-2 text-[#0D0703] tabular-nums">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  aria-label="Tăng số lượng"
                  onClick={() => onUpdateQuantity(item.variantId, item.quantity + 1)}
                  className="w-6 h-6 flex items-center justify-center text-[#0D0703] hover:bg-[#EAE4D9] transition-colors text-sm font-semibold rounded-[1px]"
                >
                  +
                </button>
              </div>
            </div>

            {/* Item Pricing */}
            <div className="md:col-span-2 text-right">
              <span className="font-serif text-lg font-medium text-[#0D0703] tabular-nums block">
                {formatVND(item.price * item.quantity)}
              </span>
              {item.quantity > 1 && (
                <span className="font-sans text-[10px] text-[#7B6E64] tabular-nums block">
                  {formatVND(item.price)} / chiếc
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
