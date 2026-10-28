// ============================================================================
// File: frontend/src/pages/customer/C01_CartPage.tsx
// Mã màn hình: C01 | Route: /cart | FR: FR5
// Vai trò: Giỏ hàng kiến trúc (Shopping Bag) — Chuyển thể trung thực từ bản thiết kế
//          Stitch .stitch/designs/c01-cart.html:
//          - Quản lý danh sách tác phẩm lưu ở localStorage qua cartStorage
//          - Stepper 3 bước (01 Shopping Bag -> 02 White-Glove Delivery -> 03 Settlement)
//          - Tăng/giảm số lượng, gỡ bỏ tác phẩm
//          - Đính kèm khắc biển đồng Atelier (Monogram Plaque)
//          - Xem trước chiết khấu thành viên Patron và tổng giá trị
// ============================================================================

import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getCartItems,
  updateQuantity,
  removeFromCart,
  updateCustomization,
  type CartItem,
} from '../../utils/cartStorage';
import { useAuth } from '../../auth/useAuth';
import { formatVND } from '../../utils/formatVND';

export const C01_CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>(getCartItems());

  // Lắng nghe sự kiện đồng bộ giỏ hàng
  useEffect(() => {
    const handleUpdate = () => setCartItems(getCartItems());
    window.addEventListener('cart_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('cart_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Tính toán số liệu thương mại
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  const discountPct = user?.customer?.tier?.discountPct || 0;
  const discountAmount = Math.round(subtotal * (discountPct / 100));
  const estimatedTotal = Math.max(0, subtotal - discountAmount);
  const totalItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Điều hướng sang bước thanh toán
  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) return;
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className="w-full pt-28 pb-24">
      {/* ============================================================ */}
      {/* Contextual Notification Bar                                  */}
      {/* ============================================================ */}
      <section className="w-full bg-[#EAE4D9]/60 py-3 px-6 md:px-12 lg:px-16 border-b border-[#D2C8BA]/40 mb-8">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between text-[#4E4540] gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#A58548] animate-pulse"></span>
            <p className="font-sans text-[11px] font-semibold uppercase tracking-widest text-[#0D0703]">
              Lưu trữ tác phẩm Atelier · Hỗ trợ vận chuyển &amp; lắp đặt White-Glove toàn quốc
            </p>
          </div>
          <p className="font-sans text-[10px] text-[#7B6E64] uppercase tracking-wider hidden md:block">
            Bảo chứng chất lượng bởi Xưởng chế tác AUREN
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Bag Hero / Stepper Header                                    */}
      {/* ============================================================ */}
      <section className="w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16 pb-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#D2C8BA]/50">
          <div>
            <span className="font-sans text-[10px] font-semibold text-[#A58548] uppercase tracking-[0.2em] block mb-2">
              Order Review • White-Glove Logistics
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl text-[#0D0703] tracking-tight font-normal">
              Túi Hàng Bộ Sưu Tập
            </h1>
          </div>

          {/* Architectural Stepper */}
          <div className="flex items-center gap-4 font-sans text-xs uppercase tracking-widest">
            <div className="flex items-center gap-2 text-[#0D0703]">
              <span className="w-5 h-5 rounded-full bg-[#0D0703] text-[#FAF8F3] flex items-center justify-center text-[10px] font-semibold">
                01
              </span>
              <span className="border-b-2 border-[#0D0703] pb-0.5 font-semibold">Túi hàng</span>
            </div>
            <span className="text-[#D2C8BA]">—</span>
            <div className="flex items-center gap-2 text-[#7B6E64]">
              <span className="w-5 h-5 rounded-full bg-[#EAE4D9] text-[#7B6E64] flex items-center justify-center text-[10px]">
                02
              </span>
              <span>Giao nhận White-Glove</span>
            </div>
            <span className="text-[#D2C8BA]">—</span>
            <div className="flex items-center gap-2 text-[#7B6E64]">
              <span className="w-5 h-5 rounded-full bg-[#EAE4D9] text-[#7B6E64] flex items-center justify-center text-[10px]">
                03
              </span>
              <span>Quyết toán ký quỹ</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Cart Content Area (Asymmetric 12-Column Grid)                */}
      {/* ============================================================ */}
      <section className="w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16">
        {cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* CỘT TRÁI (8 Cols): Danh sách sản phẩm trong giỏ */}
            <div className="lg:col-span-8 space-y-6">
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
                                  updateCustomization(item.variantId, { monogram: e.target.value })
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
                            onClick={() => removeFromCart(item.variantId)}
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
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
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
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
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

              {/* Delivery Logistics Consultation Notice */}
              <div className="bg-[#FAF8F3] p-6 rounded-[2px] border border-[#D2C8BA]/60 flex items-start gap-4">
                <span className="text-xl text-[#A58548]">❖</span>
                <div className="space-y-1">
                  <h4 className="font-serif text-base text-[#0D0703]">Quy cách Giao nhận White-Glove</h4>
                  <p className="font-sans text-xs text-[#4E4540] leading-relaxed">
                    Đội ngũ chuyên viên AUREN sẽ phối hợp trực tiếp với ban quản lý tòa nhà, kiểm tra lối vào kiến trúc, thang máy và lắp đặt hoàn chỉnh tác phẩm tại vị trí quý khách chỉ định.
                  </p>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI (4 Cols): Tóm tắt thương mại Sticky */}
            <div className="lg:col-span-4">
              <div className="sticky top-28 space-y-6">
                
                {/* Commercial Summary Box */}
                <div className="bg-[#271E18] text-[#FAF8F3] p-8 rounded-[2px] shadow-xl space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-[#FAF8F3]/15">
                    <h2 className="font-serif text-2xl tracking-wide">Tóm Tắt Đơn Hàng</h2>
                    <span className="font-sans text-[10px] uppercase tracking-widest text-[#FFDDB1]">
                      {totalItemCount} Tác phẩm
                    </span>
                  </div>

                  {/* Price Lines */}
                  <div className="space-y-3 font-sans text-xs">
                    <div className="flex justify-between text-[#FAF8F3]/80">
                      <span>Tạm tính tác phẩm</span>
                      <span className="font-semibold tabular-nums text-[#FAF8F3]">{formatVND(subtotal)}</span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-[#FFDDB1]">
                        <span>Ưu đãi thành viên ({user?.customer?.tier?.name} -{discountPct}%)</span>
                        <span className="font-semibold tabular-nums">-{formatVND(discountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-[#FAF8F3]/80">
                      <div>
                        <span>Dịch vụ lắp đặt White-Glove</span>
                        <span className="block text-[10px] text-[#FAF8F3]/50">Đóng thùng gỗ thông &amp; vận chuyển tận phòng</span>
                      </div>
                      <span className="font-semibold uppercase text-[#FFDDB1] text-[11px]">Miễn phí</span>
                    </div>

                    <div className="flex justify-between text-[#FAF8F3]/80">
                      <span>Thuế &amp; Phí bảo hiểm lưu kho</span>
                      <span className="font-semibold text-[#FFDDB1] text-[11px] uppercase">Đã bao gồm</span>
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="w-full h-[1px] bg-[#FAF8F3]/15"></div>

                  {/* Grand Total */}
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="font-serif text-xl text-[#FAF8F3]">Tổng thanh toán:</span>
                    <div className="text-right">
                      <span className="font-serif text-3xl font-medium text-[#FAF8F3] tabular-nums block">
                        {formatVND(estimatedTotal)}
                      </span>
                      <span className="font-sans text-[10px] text-[#FFDDB1] uppercase tracking-widest">
                        Ký quỹ 50% khi đặt hàng
                      </span>
                    </div>
                  </div>

                  {/* Checkout CTA */}
                  <div className="pt-2 space-y-3">
                    <button
                      type="button"
                      onClick={handleProceedToCheckout}
                      className="w-full py-4 px-6 bg-[#FAF8F3] text-[#271E18] hover:bg-white font-sans text-xs font-semibold uppercase tracking-[0.18em] rounded-[2px] flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 text-center shadow-md"
                    >
                      <span>Tiến hành Giao nhận White-Glove</span>
                      <span>→</span>
                    </button>

                    <Link
                      to="/products"
                      className="w-full py-3 px-6 bg-transparent text-[#FAF8F3]/80 hover:text-[#FAF8F3] font-sans text-xs uppercase tracking-widest rounded-[2px] flex items-center justify-center transition-colors text-center"
                    >
                      Tiếp tục thưởng lãm Bộ sưu tập
                    </Link>
                  </div>

                  {/* Trust Assurances inside Summary */}
                  <div className="pt-6 border-t border-[#FAF8F3]/15 space-y-3 text-[#FAF8F3]/80 text-xs">
                    <div className="flex items-start gap-2.5">
                      <span className="text-[#A58548] text-sm">✓</span>
                      <div>
                        <p className="font-semibold text-[#FAF8F3]">Bảo hành kết cấu 10 năm</p>
                        <p className="text-[10px] text-[#FAF8F3]/60">Cam kết bảo tồn mộng gỗ và bề mặt hoàn thiện.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="text-[#A58548] text-sm">✓</span>
                      <div>
                        <p className="font-semibold text-[#FAF8F3]">Gỗ bền vững chứng nhận FSC</p>
                        <p className="text-[10px] text-[#FAF8F3]/60">100% gỗ tự nhiên, không sử dụng keo hóa chất tổng hợp.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="text-[#A58548] text-sm">✓</span>
                      <div>
                        <p className="font-semibold text-[#FAF8F3]">Ký quỹ an toàn tuyệt đối</p>
                        <p className="text-[10px] text-[#FAF8F3]/60">Tài khoản bảo chứng chỉ tất toán sau khi nghiệm thu.</p>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Patron Member Notice */}
                {!isAuthenticated && (
                  <div className="bg-[#FAF8F3] p-5 rounded-[2px] border border-[#D2C8BA]/60 space-y-2">
                    <span className="font-sans text-[10px] font-semibold text-[#A58548] uppercase tracking-widest block">
                      Đặc quyền Thành viên AUREN
                    </span>
                    <p className="font-sans text-xs text-[#4E4540] leading-relaxed">
                      Đăng nhập tài khoản Patron để kích hoạt chiết khấu tự động từ 5% đến 15% theo hạng thành viên của quý khách.
                    </p>
                    <Link
                      to="/login?redirect=/cart"
                      className="inline-block font-sans text-xs font-semibold uppercase tracking-wider text-[#0D0703] underline underline-offset-4 hover:text-[#A58548] pt-1"
                    >
                      Đăng nhập ngay →
                    </Link>
                  </div>
                )}

              </div>
            </div>

          </div>
        ) : (
          /* Empty Bag State */
          <div className="text-center py-24 px-6 bg-[#FAF8F3] border border-[#D2C8BA]/60 rounded-[2px] max-w-2xl mx-auto space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#EAE4D9] flex items-center justify-center text-[#7B6E64]">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="font-serif text-3xl text-[#0D0703]">Túi hàng của quý khách đang trống</h3>
            <p className="font-sans text-xs text-[#7B6E64] max-w-md mx-auto leading-relaxed">
              Chưa có tác phẩm nội thất nào được lưu giữ trong phiên hiện tại. Mời quý khách khám phá các bộ sưu tập kinh điển của chúng tôi.
            </p>
            <div className="pt-4">
              <Link
                to="/products"
                className="inline-block px-8 py-3.5 bg-[#271E18] text-[#FAF8F3] font-sans text-xs uppercase tracking-widest hover:bg-[#0D0703] transition-colors rounded-[2px]"
              >
                Khám phá Bộ sưu tập →
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
export default C01_CartPage;
