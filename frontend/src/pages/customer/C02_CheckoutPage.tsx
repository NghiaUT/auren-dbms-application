// ============================================================================
// File: frontend/src/pages/customer/C02_CheckoutPage.tsx
// Mã màn hình: C02 | Route: /checkout | FR: FR5, FR7
// Vai trò: Thanh toán & Giao nhận White-Glove — Chuyển thể trung thực từ bản thiết kế
//          Stitch .stitch/designs/c02-checkout.html:
//          - Khối 01.0: Thư tín bảo mật (Private Correspondence)
//          - Khối 02.0: Điểm đến & Khảo sát tiếp cận kiến trúc (Destination & Spatial Access)
//          - Khối 03.0: Giao thức thanh toán (Wire / Escrow hoặc Thẻ)
//          - Gọi API POST /api/orders tạo đơn hàng ACID
// ============================================================================

import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { getCartItems, clearCart, type CartItem } from '../../utils/cartStorage';
import { createOrderApi } from '../../api/order.api';
import { formatVND } from '../../utils/formatVND';

export const C02_CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const cartItems: CartItem[] = getCartItems();

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [correspondenceEmail, setCorrespondenceEmail] = useState<string>(user?.email || '');
  const [correspondencePhone, setCorrespondencePhone] = useState<string>(user?.customer?.phone || '');
  const [recipientName, setRecipientName] = useState<string>(user?.fullName || '');
  const [streetAddress, setStreetAddress] = useState<string>(user?.customer?.address || '');
  const [residenceDetails, setResidenceDetails] = useState<string>('');
  const [city, setCity] = useState<string>(user?.customer?.city || 'TP. Hồ Chí Minh');
  const [deliveryHorizon, setDeliveryHorizon] = useState<string>('morning');
  const [settlementMethod, setSettlementMethod] = useState<'wire' | 'card'>('wire');

  // Architectural Questionnaire
  const [elevatorDimension, setElevatorDimension] = useState<boolean>(true);
  const [freightElevator, setFreightElevator] = useState<boolean>(false);
  const [historicStairs, setHistoricStairs] = useState<boolean>(false);
  const [stoneCourtyard, setStoneCourtyard] = useState<boolean>(true);

  // Tính toán số liệu
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  const discountPct = user?.customer?.tier?.discountPct || 0;
  const discountAmount = Math.round(subtotal * (discountPct / 100));
  const finalTotal = Math.max(0, subtotal - discountAmount);
  const depositDue = Math.round(finalTotal * 0.5);
  const finalDue = finalTotal - depositDue;

  // Xử lý gửi đơn hàng
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      navigate('/cart');
      return;
    }

    if (!streetAddress || !city) {
      setErrorMsg('Vui lòng nhập đầy đủ địa chỉ giao nhận.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const fullAddress = `${streetAddress}${residenceDetails ? `, ${residenceDetails}` : ''}, ${city}`;

      const payload = {
        shippingAddress: fullAddress,
        items: cartItems.map((item) => ({
          variantId: item.variantId,
          locationId: item.locationId || 1, // Mặc định Showroom/Kho Flagship 1 nếu chưa gán
          quantity: item.quantity,
          customization: {
            ...item.customization,
            accessVerification: {
              elevatorDimension,
              freightElevator,
              historicStairs,
              stoneCourtyard,
              deliveryHorizon,
            },
          },
        })),
      };

      const createdOrder = await createOrderApi(payload);

      // Xóa giỏ hàng khi đặt thành công
      clearCart();

      // Điều hướng tới trang xác nhận
      navigate('/checkout/success', {
        state: { order: createdOrder, paymentMethod: settlementMethod },
      });
    } catch (err: any) {
      console.error('Lỗi khi đặt hàng:', err);
      const message =
        err.response?.data?.error?.message ||
        'Không thể hoàn tất đặt hàng. Vui lòng kiểm tra lại tồn kho hoặc thử lại.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="w-full pt-32 pb-24 max-w-xl mx-auto px-6 text-center space-y-4">
        <h2 className="font-serif text-3xl text-[#0D0703]">Túi hàng chưa có sản phẩm</h2>
        <p className="font-sans text-xs text-[#7B6E64]">
          Quý khách vui lòng chọn tác phẩm từ Bộ sưu tập trước khi thực hiện quy trình giao nhận.
        </p>
        <Link
          to="/products"
          className="inline-block px-8 py-3.5 bg-[#271E18] text-[#FAF8F3] font-sans text-xs uppercase tracking-widest rounded-[2px]"
        >
          Khám phá Bộ sưu tập
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full pt-28 pb-24">
      {/* ============================================================ */}
      {/* Top Subtle Architectural Header Stepper                      */}
      {/* ============================================================ */}
      <section className="w-full bg-[#F6F3ED] py-8 px-6 md:px-12 lg:px-16 border-b border-[#D2C8BA]/40 mb-10">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <span className="font-sans text-[10px] font-semibold text-[#A58548] uppercase tracking-[0.2em] block">
              Curated Acquisition
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#0D0703] tracking-tight font-normal">
              Giao Nhận &amp; Điều Phối White-Glove
            </h1>
          </div>

          {/* Stepper Indicator */}
          <nav aria-label="Acquisition Progress" className="flex items-center gap-3 sm:gap-6 font-sans text-xs uppercase tracking-widest text-[#7B6E64]">
            <Link to="/cart" className="flex items-center gap-2 hover:text-[#0D0703] transition-colors">
              <span className="w-5 h-5 rounded-full bg-[#EAE4D9] flex items-center justify-center font-mono text-[9px]">01</span>
              <span>Túi hàng</span>
            </Link>
            <span className="text-[#D2C8BA]">—</span>
            <div className="flex items-center gap-2 text-[#0D0703] font-semibold">
              <span className="w-5 h-5 rounded-full bg-[#0D0703] text-[#FAF8F3] flex items-center justify-center font-mono text-[9px]">02</span>
              <span className="border-b-2 border-[#0D0703] pb-0.5">Địa chỉ &amp; Điều phối</span>
            </div>
            <span className="text-[#D2C8BA]">—</span>
            <div className="flex items-center gap-2 text-[#7B6E64] opacity-60">
              <span className="w-5 h-5 rounded-full bg-[#EAE4D9] flex items-center justify-center font-mono text-[9px]">03</span>
              <span>Niêm phong</span>
            </div>
          </nav>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Main Architectural Form (7 / 5 cols)                         */}
      {/* ============================================================ */}
      <section className="w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16">
        <form onSubmit={handleSubmitOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* CỘT TRÁI (7 Cols): Các bước nhập thông tin */}
            <div className="lg:col-span-7 space-y-12">
              
              {/* Error Alert nếu có */}
              {errorMsg && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-sans rounded-[2px] flex items-start gap-3">
                  <span className="text-red-600 font-bold">⚠</span>
                  <p>{errorMsg}</p>
                </div>
              )}

              {/* ───────────────────────────────────────────────────────── */}
              {/* BƯỚC 1: THƯ TÍN BẢO MẬT (Private Correspondence)        */}
              {/* ───────────────────────────────────────────────────────── */}
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
                    <label className="block font-sans text-[10px] uppercase font-semibold text-[#7B6E64] tracking-wider mb-1" htmlFor="contact-email">
                      Email Liên Lạc Chính Thức
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={correspondenceEmail}
                      onChange={(e) => setCorrespondenceEmail(e.target.value)}
                      placeholder="patron@domain.com"
                      className="w-full bg-transparent font-sans text-xs text-[#0D0703] focus:outline-none"
                    />
                  </div>

                  <div className="bg-[#FAF8F3] border border-[#D2C8BA] p-3.5 rounded-[2px]">
                    <label className="block font-sans text-[10px] uppercase font-semibold text-[#7B6E64] tracking-wider mb-1" htmlFor="contact-phone">
                      Số Điện Thoại Nhận Thông Báo Giao Hàng
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      required
                      value={correspondencePhone}
                      onChange={(e) => setCorrespondencePhone(e.target.value)}
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

              {/* ───────────────────────────────────────────────────────── */}
              {/* BƯỚC 2: TIẾP CẬN KIẾN TRÚC & ĐỊA CHỈ GIAO NHẬN          */}
              {/* ───────────────────────────────────────────────────────── */}
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
                    <label className="block font-sans text-[10px] uppercase font-semibold text-[#7B6E64] tracking-wider mb-1" htmlFor="recipient-name">
                      Họ &amp; Tên Người Tiếp Nhận
                    </label>
                    <input
                      id="recipient-name"
                      type="text"
                      required
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full bg-transparent font-sans text-xs text-[#0D0703] focus:outline-none"
                    />
                  </div>

                  <div className="bg-[#FAF8F3] border border-[#D2C8BA] p-3.5 rounded-[2px]">
                    <label className="block font-sans text-[10px] uppercase font-semibold text-[#7B6E64] tracking-wider mb-1" htmlFor="dest-address">
                      Địa Chỉ Tòa Nhà / Biệt Thự / Khu Đô Thị
                    </label>
                    <input
                      id="dest-address"
                      type="text"
                      required
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      placeholder="Số 12 Lê Lợi, Phường Bến Nghé"
                      className="w-full bg-transparent font-sans text-xs text-[#0D0703] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#FAF8F3] border border-[#D2C8BA] p-3.5 rounded-[2px]">
                      <label className="block font-sans text-[10px] uppercase font-semibold text-[#7B6E64] tracking-wider mb-1" htmlFor="dest-suite">
                        Căn Hộ / Penthouse / Tầng
                      </label>
                      <input
                        id="dest-suite"
                        type="text"
                        value={residenceDetails}
                        onChange={(e) => setResidenceDetails(e.target.value)}
                        placeholder="Penthouse 4B (Tháp Sapphire)"
                        className="w-full bg-transparent font-sans text-xs text-[#0D0703] focus:outline-none"
                      />
                    </div>

                    <div className="bg-[#FAF8F3] border border-[#D2C8BA] p-3.5 rounded-[2px]">
                      <label className="block font-sans text-[10px] uppercase font-semibold text-[#7B6E64] tracking-wider mb-1" htmlFor="dest-city">
                        Tỉnh / Thành Phố
                      </label>
                      <input
                        id="dest-city"
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
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
                        onChange={(e) => setElevatorDimension(e.target.checked)}
                        className="rounded-[1px] accent-[#271E18]"
                      />
                      <span>Kích thước thang máy lọt lòng &ge; 220cm</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-3 bg-[#FCF9F3] border border-[#D2C8BA]/60 rounded-[2px] cursor-pointer hover:bg-white transition-colors text-xs text-[#0D0703]">
                      <input
                        type="checkbox"
                        checked={freightElevator}
                        onChange={(e) => setFreightElevator(e.target.checked)}
                        className="rounded-[1px] accent-[#271E18]"
                      />
                      <span>Cần đăng ký thang máy hàng chuyên dụng</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-3 bg-[#FCF9F3] border border-[#D2C8BA]/60 rounded-[2px] cursor-pointer hover:bg-white transition-colors text-xs text-[#0D0703]">
                      <input
                        type="checkbox"
                        checked={historicStairs}
                        onChange={(e) => setHistoricStairs(e.target.checked)}
                        className="rounded-[1px] accent-[#271E18]"
                      />
                      <span>Cầu thang xoắn hoặc cầu thang bộ dốc</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-3 bg-[#FCF9F3] border border-[#D2C8BA]/60 rounded-[2px] cursor-pointer hover:bg-white transition-colors text-xs text-[#0D0703]">
                      <input
                        type="checkbox"
                        checked={stoneCourtyard}
                        onChange={(e) => setStoneCourtyard(e.target.checked)}
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
                        onClick={() => setDeliveryHorizon('morning')}
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
                        onClick={() => setDeliveryHorizon('afternoon')}
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
                        onClick={() => setDeliveryHorizon('weekend')}
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

              {/* ───────────────────────────────────────────────────────── */}
              {/* BƯỚC 3: GIAO THỨC THANH TOÁN (Settlement Protocol)       */}
              {/* ───────────────────────────────────────────────────────── */}
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
                    onClick={() => setSettlementMethod('wire')}
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
                    onClick={() => setSettlementMethod('card')}
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

            </div>

            {/* CỘT PHẢI (5 Cols): Sticky Summary & Action */}
            <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6">
              
              <div className="bg-[#271E18] text-[#FAF8F3] p-8 rounded-[2px] shadow-xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#FAF8F3]/15">
                  <h3 className="font-serif text-2xl tracking-wide">Quy Hoạch Đơn Hàng</h3>
                  <span className="font-sans text-[10px] uppercase tracking-widest text-[#FFDDB1]">
                    {cartItems.length} Dòng tác phẩm
                  </span>
                </div>

                {/* Danh sách rút gọn các tác phẩm */}
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1 divide-y divide-[#FAF8F3]/10 text-xs">
                  {cartItems.map((item) => (
                    <div key={item.variantId} className="pt-2 first:pt-0 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-serif text-sm font-medium text-[#FAF8F3] truncate max-w-[200px]">
                          {item.productName}
                        </p>
                        <p className="text-[10px] text-[#FAF8F3]/60">
                          {item.variantFinish} • SL: {item.quantity}
                        </p>
                      </div>
                      <span className="tabular-nums font-semibold text-[#FFDDB1]">
                        {formatVND(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Phân rã giá trị */}
                <div className="pt-4 border-t border-[#FAF8F3]/15 space-y-2.5 font-sans text-xs">
                  <div className="flex justify-between text-[#FAF8F3]/80">
                    <span>Tổng nguyên giá:</span>
                    <span className="tabular-nums font-semibold">{formatVND(subtotal)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-[#FFDDB1]">
                      <span>Ưu đãi thành viên Patron (-{discountPct}%):</span>
                      <span className="tabular-nums font-semibold">-{formatVND(discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-[#FAF8F3]/80">
                    <span>Phí chuyên chở &amp; Lắp đặt White-Glove:</span>
                    <span className="text-[#FFDDB1] uppercase text-[11px] font-semibold">Miễn phí</span>
                  </div>
                </div>

                {/* Grand Total */}
                <div className="pt-4 border-t border-[#FAF8F3]/15 flex items-baseline justify-between">
                  <span className="font-serif text-lg">Tổng giá trị đơn:</span>
                  <div className="text-right">
                    <span className="font-serif text-3xl font-medium text-[#FAF8F3] tabular-nums block">
                      {formatVND(finalTotal)}
                    </span>
                  </div>
                </div>

                {/* Installment breakdown callout */}
                <div className="bg-[#FAF8F3]/10 p-4 rounded-[2px] space-y-2 font-sans text-xs">
                  <div className="flex justify-between items-center text-[#FFDDB1]">
                    <span>Đợt 1 (Đặt cọc 50% thanh toán hôm nay):</span>
                    <strong className="tabular-nums text-sm">{formatVND(depositDue)}</strong>
                  </div>
                  <div className="flex justify-between items-center text-[#FAF8F3]/70 text-[11px]">
                    <span>Đợt 2 (50% quyết toán khi bàn giao):</span>
                    <span className="tabular-nums">{formatVND(finalDue)}</span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 bg-[#FAF8F3] hover:bg-white text-[#271E18] font-sans text-xs font-semibold uppercase tracking-[0.18em] rounded-[2px] shadow-lg flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span>Đang khởi tạo giao dịch ACID...</span>
                  ) : (
                    <>
                      <span>Xác Nhận Đặt Hàng &amp; Niêm Phong Điều Phối</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>
        </form>
      </section>
    </div>
  );
};
export default C02_CheckoutPage;
