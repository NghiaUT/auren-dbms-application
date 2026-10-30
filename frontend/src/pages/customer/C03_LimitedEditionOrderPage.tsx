// ============================================================================
// File: frontend/src/pages/customer/C03_LimitedEditionOrderPage.tsx
// Mã màn hình: C03 | Route: /limited/:variantId | FR: FR6
// Vai trò: Màn hình Đặt mua bản Limited Edition — Hiển thị ma trận số hiệu bản khắc,
//          nhận diện bản số tiếp theo, thực hiện đặt mua với cơ chế khoá dòng
//          Pessimistic Locking (SELECT ... FOR UPDATE) và xử lý thông báo xung đột
//          khi có Patron khác vừa mua trước (HTTP 409 EDITION_SOLD_OUT).
// ============================================================================

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { getLimitedVariantUnitsApi, type VariantEditionData } from '../../api/limited.api';
import { createOrderApi } from '../../api/order.api';
import { formatVND } from '../../utils/formatVND';

export const C03_LimitedEditionOrderPage: React.FC = () => {
  const { variantId } = useParams<{ variantId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<VariantEditionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [shippingAddress, setShippingAddress] = useState('');
  const [plaqueText, setPlaqueText] = useState('');
  const [paymentOption, setPaymentOption] = useState<'deposit' | 'full'>('deposit');
  const [soldOutConflictModal, setSoldOutConflictModal] = useState(false);

  // Load variant & edition units data
  const fetchData = async () => {
    if (!variantId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getLimitedVariantUnitsApi(parseInt(variantId, 10));
      setData(res);
      // Điền sẵn địa chỉ từ hồ sơ Patron nếu có
      if (user?.customer?.address && !shippingAddress) {
        const fullAddr = [user.customer.address, user.customer.city].filter(Boolean).join(', ');
        setShippingAddress(fullAddr);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải thông tin ấn bản giới hạn:', err);
      setError(err.response?.data?.error?.message || 'Không thể tải thông tin tác phẩm giới hạn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [variantId]);

  // Tính toán giá trị chiết khấu Patron
  const pricing = useMemo(() => {
    if (!data) return { rawPrice: 0, discountPct: 0, discountAmount: 0, finalPrice: 0, depositAmount: 0 };
    const rawPrice = Number(data.variant.price);
    const discountPct = user?.customer?.tier?.discountPct || 0;
    const discountAmount = Math.round(rawPrice * (discountPct / 100));
    const finalPrice = rawPrice - discountAmount;
    const depositAmount = Math.round(finalPrice * 0.3); // 30% cọc
    return { rawPrice, discountPct, discountAmount, finalPrice, depositAmount };
  }, [data, user]);

  // Xử lý gửi đơn đặt mua
  const handleAcquire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: `/limited/${variantId}` } });
      return;
    }

    if (!shippingAddress.trim() || shippingAddress.trim().length < 5) {
      alert('Vui lòng cung cấp địa chỉ dinh thự nhận bàn giao tác phẩm (tối thiểu 5 ký tự).');
      return;
    }

    if (!data?.edition.nextAvailableSerial) {
      alert('Tác phẩm hiện đã hết ấn bản khả dụng.');
      return;
    }

    setSubmitting(true);
    try {
      const order = await createOrderApi({
        shippingAddress: shippingAddress.trim(),
        items: [
          {
            variantId: data.variant.variantId,
            locationId: 1, // Kho tổng Atelier mặc định
            quantity: 1,
            customization: plaqueText.trim()
              ? { plaqueText: plaqueText.trim(), limitedRequest: true, paymentOption }
              : { limitedRequest: true, paymentOption },
          },
        ],
      });

      // Điều hướng sang trang xác nhận thành công C05
      navigate('/checkout/success', {
        state: {
          order,
          paymentMethod: 'wire',
        },
      });
    } catch (err: any) {
      console.error('Lỗi đặt mua Limited Edition:', err);
      const code = err.response?.data?.error?.code;
      if (code === 'EDITION_SOLD_OUT' || err.response?.status === 409) {
        // Bắt lỗi xung đột đồng thời khi có người mua trước
        setSoldOutConflictModal(true);
        fetchData(); // Làm mới lại danh sách serial
      } else {
        alert(err.response?.data?.error?.message || 'Có lỗi xảy ra trong quá trình niêm phong tác phẩm.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center pt-24 bg-[#FAF8F3]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#A58548] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-serif text-sm text-[#7B6E64] uppercase tracking-widest">Đang tải hồ sơ ấn bản độc bản...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full pt-28 pb-20 bg-[#FAF8F3]">
        <div className="max-w-2xl mx-auto px-6 text-center space-y-6">
          <h1 className="font-serif text-3xl text-[#0D0703]">Không tìm thấy tác phẩm giới hạn</h1>
          <p className="font-sans text-sm text-[#7B6E64]">{error || 'Tác phẩm không tồn tại hoặc đã ngừng cung cấp.'}</p>
          <Link
            to="/products"
            className="inline-block bg-[#271E18] text-[#FAF8F3] px-8 py-3 text-xs uppercase tracking-widest font-semibold rounded-[2px]"
          >
            Khám phá bộ sưu tập
          </Link>
        </div>
      </div>
    );
  }

  const { variant, edition } = data;

  return (
    <div className="w-full pt-28 pb-24 bg-[#FAF8F3] min-h-screen text-[#0D0703]">
      <div className="max-w-[1500px] mx-auto px-6 md:px-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-sans text-[#7B6E64] mb-8">
          <Link to="/" className="hover:text-[#0D0703] transition-colors">Trang chủ</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-[#0D0703] transition-colors">Bộ sưu tập</Link>
          <span>/</span>
          <Link to={`/products/${variant.productId}`} className="hover:text-[#0D0703] transition-colors">{variant.productName}</Link>
          <span>/</span>
          <span className="text-[#A58548] font-medium">Bản giới hạn độc bản</span>
        </nav>

        {/* Layout 2 cột */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          {/* ============================================================ */}
          {/* CỘT TRÁI (7 CỘT): VISUAL & MA TRẬN SERIAL                    */}
          {/* ============================================================ */}
          <div className="lg:col-span-7 space-y-8">
            {/* Visual Hero Box */}
            <div className="relative bg-[#F6F3ED] border border-[#D2C8BA]/60 p-8 rounded-[2px] shadow-sm overflow-hidden">
              <div className="flex items-center justify-between pb-6 border-b border-[#D2C8BA]/40">
                <div>
                  <span className="inline-block text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-[#A58548] bg-[#FAF8F3] px-3 py-1 border border-[#A58548]/30 rounded-[1px] mb-2">
                    Numbered Atelier Release
                  </span>
                  <h1 className="font-serif text-3xl md:text-4xl text-[#0D0703] font-normal tracking-tight">
                    {variant.productName}
                  </h1>
                  <p className="font-sans text-xs text-[#7B6E64] uppercase tracking-wider mt-1">
                    {variant.collectionName} • {variant.finish || 'Chế tác nguyên bản'} • Kích thước: {variant.size || 'Tiêu chuẩn'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-sans text-[10px] uppercase tracking-widest text-[#7B6E64] block">Số hiệu SKU</span>
                  <span className="font-mono text-xs font-bold text-[#0D0703]">{variant.sku}</span>
                </div>
              </div>

              {/* Tóm tắt tình trạng ấn bản */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 text-center border-b border-[#D2C8BA]/40">
                <div className="p-3 bg-[#FAF8F3] rounded-[1px] border border-[#D2C8BA]/30">
                  <span className="block text-[10px] font-sans text-[#7B6E64] uppercase tracking-widest">Tổng phát hành</span>
                  <span className="font-serif text-2xl font-bold text-[#0D0703]">{edition.total} bản</span>
                </div>
                <div className="p-3 bg-[#FAF8F3] rounded-[1px] border border-[#D2C8BA]/30">
                  <span className="block text-[10px] font-sans text-[#7B6E64] uppercase tracking-widest">Đã sở hữu</span>
                  <span className="font-serif text-2xl font-bold text-[#7B6E64]">{edition.sold + edition.reserved} bản</span>
                </div>
                <div className="p-3 bg-[#FAF8F3] rounded-[1px] border border-[#A58548]/40">
                  <span className="block text-[10px] font-sans text-[#A58548] uppercase tracking-widest font-bold">Còn khả dụng</span>
                  <span className="font-serif text-2xl font-bold text-emerald-800">{edition.available} bản</span>
                </div>
                <div className="p-3 bg-[#271E18] text-[#FAF8F3] rounded-[1px] shadow-sm">
                  <span className="block text-[9px] font-sans text-[#D2C8BA] uppercase tracking-widest">Bản số kế tiếp</span>
                  <span className="font-mono text-lg font-bold text-[#FAF8F3] truncate block">
                    {edition.nextAvailableSerial || 'Đã hết'}
                  </span>
                </div>
              </div>

              {/* MA TRẬN SỐ HIỆU BẢN KHẮC (SERIAL MATRIX) */}
              <div className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg text-[#0D0703] flex items-center gap-2">
                    <span>Ma trận số hiệu bản khắc</span>
                    <span className="font-sans text-[11px] text-[#7B6E64] font-normal">
                      (Độc bản đánh số cố định theo thứ tự nghệ nhân chế tác)
                    </span>
                  </h3>
                  <div className="flex items-center gap-4 text-[10px] font-sans uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Khả dụng
                    </span>
                    <span className="flex items-center gap-1.5 text-[#A58548] font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#A58548] animate-ping"></span> Kế tiếp
                    </span>
                    <span className="flex items-center gap-1.5 text-[#7B6E64]">
                      <span className="w-2 h-2 rounded-full bg-[#D2C8BA]"></span> Đã sở hữu
                    </span>
                  </div>
                </div>

                {/* Grid các số serial */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {edition.units.map((unit) => {
                    const isNext = unit.serialNo === edition.nextAvailableSerial;
                    const isSold = unit.status === 'sold';
                    const isReserved = unit.status === 'reserved';

                    return (
                      <div
                        key={unit.id}
                        className={`p-3 rounded-[2px] text-center border transition-all duration-300 ${
                          isNext
                            ? 'bg-[#FAF8F3] border-[#A58548] shadow-md ring-2 ring-[#A58548]/30 scale-[1.02]'
                            : isSold
                            ? 'bg-[#ECE8E1]/60 border-[#D2C8BA]/30 opacity-60'
                            : isReserved
                            ? 'bg-[#FAF8F3]/80 border-dashed border-[#A58548]/50'
                            : 'bg-[#FAF8F3] border-[#D2C8BA]/50 hover:border-[#A58548]/60'
                        }`}
                      >
                        <span
                          className={`font-mono text-xs font-bold block ${
                            isNext ? 'text-[#0D0703] text-sm' : isSold ? 'line-through text-[#7B6E64]' : 'text-[#0D0703]'
                          }`}
                        >
                          {unit.serialNo}
                        </span>
                        <span
                          className={`text-[9px] uppercase tracking-wider block mt-1 font-sans ${
                            isNext
                              ? 'text-[#A58548] font-bold'
                              : isSold
                              ? 'text-[#7B6E64]'
                              : isReserved
                              ? 'text-amber-700'
                              : 'text-emerald-700 font-medium'
                          }`}
                        >
                          {isNext ? '✦ Cấp cho bạn' : isSold ? 'Đã sở hữu' : isReserved ? 'Đang giữ' : 'Sẵn sàng'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cam kết độc bản */}
              <div className="mt-8 pt-6 border-t border-[#D2C8BA]/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7B6E64] font-sans">
                <div className="flex items-center gap-2">
                  <span className="text-[#A58548] text-base">🛡️</span>
                  <span>Bảo chứng độc bản: Mỗi số serial chỉ tồn tại duy nhất một chiếc trên toàn cầu.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#A58548] text-base">🏷️</span>
                  <span>Đi kèm thẻ nhôm khắc laser & chip NFC chứng thực.</span>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* CỘT PHẢI (5 CỘT): FORM NIÊM PHONG & BÀN GIAO                */}
          {/* ============================================================ */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#FAF8F3] border border-[#D2C8BA] p-8 rounded-[2px] shadow-sm space-y-6">

              {/* Bảng giá & Chiết khấu Patron */}
              <div>
                <span className="text-[10px] font-sans uppercase tracking-widest text-[#7B6E64] block">
                  Giá niêm yết tác phẩm
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="font-serif text-3xl font-normal text-[#0D0703]">
                    {formatVND(pricing.finalPrice)}
                  </span>
                  {pricing.discountPct > 0 && (
                    <span className="font-sans text-xs text-[#7B6E64] line-through">
                      {formatVND(pricing.rawPrice)}
                    </span>
                  )}
                </div>

                {pricing.discountPct > 0 && (
                  <div className="mt-2 py-1 px-3 bg-[#EAE4D9]/80 rounded-[1px] inline-flex items-center gap-2 text-[11px] font-sans text-[#503625]">
                    <span>⭐ Đặc quyền {user?.customer?.tier?.name || 'Patron'}:</span>
                    <strong>Giảm {pricing.discountPct}% ({formatVND(pricing.discountAmount)})</strong>
                  </div>
                )}
              </div>

              <div className="h-px bg-[#D2C8BA]/60" />

              {/* Form đặt mua */}
              <form onSubmit={handleAcquire} className="space-y-5">
                {/* Lựa chọn phương án thanh toán */}
                <div className="space-y-2">
                  <label className="block text-xs font-sans uppercase tracking-wider text-[#0D0703] font-semibold">
                    Phương án thanh toán
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentOption('deposit')}
                      className={`p-3 text-left rounded-[2px] border transition-all ${
                        paymentOption === 'deposit'
                          ? 'bg-[#271E18] text-[#FAF8F3] border-[#271E18] shadow-sm'
                          : 'bg-[#FAF8F3] text-[#0D0703] border-[#D2C8BA] hover:bg-[#F6F3ED]'
                      }`}
                    >
                      <span className="block text-[11px] font-bold uppercase tracking-wider">Đặt cọc 30%</span>
                      <span className={`block text-xs mt-1 font-mono font-semibold ${paymentOption === 'deposit' ? 'text-[#A58548]' : 'text-[#7B6E64]'}`}>
                        {formatVND(pricing.depositAmount)}
                      </span>
                      <span className={`block text-[9px] mt-0.5 ${paymentOption === 'deposit' ? 'text-[#D2C8BA]' : 'text-[#7B6E64]'}`}>
                        Ký quỹ xác nhận chế tác
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentOption('full')}
                      className={`p-3 text-left rounded-[2px] border transition-all ${
                        paymentOption === 'full'
                          ? 'bg-[#271E18] text-[#FAF8F3] border-[#271E18] shadow-sm'
                          : 'bg-[#FAF8F3] text-[#0D0703] border-[#D2C8BA] hover:bg-[#F6F3ED]'
                      }`}
                    >
                      <span className="block text-[11px] font-bold uppercase tracking-wider">Thanh toán 100%</span>
                      <span className={`block text-xs mt-1 font-mono font-semibold ${paymentOption === 'full' ? 'text-[#A58548]' : 'text-[#7B6E64]'}`}>
                        {formatVND(pricing.finalPrice)}
                      </span>
                      <span className={`block text-[9px] mt-0.5 ${paymentOption === 'full' ? 'text-[#D2C8BA]' : 'text-[#7B6E64]'}`}>
                        Tất toán trọn gói
                      </span>
                    </button>
                  </div>
                </div>

                {/* Địa chỉ dinh thự bàn giao */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-sans uppercase tracking-wider text-[#0D0703] font-semibold">
                    Địa chỉ bàn giao White-Glove <span className="text-red-700">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Ví dụ: Biệt thự The Rivus, Phường Long Phước, TP. Thủ Đức, TP. HCM"
                    className="w-full bg-[#FAF8F3] border border-[#D2C8BA] px-3.5 py-2.5 text-xs text-[#0D0703] placeholder-[#7B6E64]/60 rounded-[1px] focus:outline-none focus:border-[#A58548]"
                  />
                  <p className="text-[10px] text-[#7B6E64]">
                    Chuyên gia Atelier sẽ liên hệ xác nhận lộ trình vận chuyển trước ngày bàn giao.
                  </p>
                </div>

                {/* Yêu cầu khắc tên kỷ niệm (Customization JSON) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-sans uppercase tracking-wider text-[#0D0703] font-semibold">
                    Khắc tên kỷ niệm lên đế tác phẩm (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    maxLength={60}
                    value={plaqueText}
                    onChange={(e) => setPlaqueText(e.target.value)}
                    placeholder="Ví dụ: Chế tác riêng cho Gia tộc Nguyễn • 2026"
                    className="w-full bg-[#FAF8F3] border border-[#D2C8BA] px-3.5 py-2 text-xs text-[#0D0703] placeholder-[#7B6E64]/60 rounded-[1px] focus:outline-none focus:border-[#A58548]"
                  />
                  <p className="text-[10px] text-[#7B6E64]">
                    Nghệ nhân sẽ khắc laser tinh xảo lên tấm đồng đính kèm dưới chân đế tác phẩm.
                  </p>
                </div>

                {/* Thông báo bản số sắp cấp */}
                <div className="p-3.5 bg-[#FAF8F3] border border-[#A58548]/40 rounded-[2px] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#7B6E64] block">Số hiệu độc bản sẽ cấp:</span>
                    <span className="font-mono text-base font-bold text-[#A58548]">
                      {edition.nextAvailableSerial || 'ĐÃ HẾT HÀNG'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-[#7B6E64] block">Thời gian chế tác:</span>
                    <span className="font-sans text-xs font-semibold text-[#0D0703]">
                      {variant.leadTimeDays ? `${variant.leadTimeDays} ngày` : '3-4 tuần'}
                    </span>
                  </div>
                </div>

                {/* Nút Submit CTA */}
                <button
                  type="submit"
                  disabled={submitting || edition.available === 0}
                  className={`w-full py-4 px-6 text-center font-sans text-xs font-bold uppercase tracking-[0.2em] rounded-[2px] transition-all duration-300 shadow-md ${
                    edition.available === 0
                      ? 'bg-[#D2C8BA] text-[#7B6E64] cursor-not-allowed'
                      : submitting
                      ? 'bg-[#503625] text-[#FAF8F3] cursor-wait'
                      : 'bg-[#271E18] text-[#FAF8F3] hover:bg-[#0D0703] active:translate-y-0.5'
                  }`}
                >
                  {edition.available === 0
                    ? 'Tác phẩm đã hết ấn bản'
                    : submitting
                    ? 'Đang kiểm tra và niêm phong độc bản...'
                    : `Niêm phong bản số ${edition.nextAvailableSerial} • ${
                        paymentOption === 'deposit'
                          ? formatVND(pricing.depositAmount)
                          : formatVND(pricing.finalPrice)
                      }`}
                </button>
              </form>

              {/* Thông tin hỗ trợ */}
              <div className="pt-2 text-center text-[10px] font-sans text-[#7B6E64] uppercase tracking-wider">
                Cần tư vấn trực tiếp từ Chuyên gia Giám tuyển?{' '}
                <a href="tel:18006868" className="text-[#A58548] underline font-semibold">
                  Hotline Private Client: 1800 6868
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL CẢNH BÁO TRANH CHẤP ĐỒNG THỜI (CONCURRENCY MODAL)      */}
      {/* ============================================================ */}
      {soldOutConflictModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#FAF8F3] border border-[#D2C8BA] max-w-md w-full p-8 rounded-[2px] shadow-2xl space-y-6 text-center">
            <div className="w-14 h-14 rounded-full bg-amber-100 border border-[#A58548] text-[#A58548] flex items-center justify-center mx-auto text-2xl font-bold">
              ⚡
            </div>
            <div className="space-y-2">
              <h3 className="font-serif text-2xl text-[#0D0703]">Bản số vừa được sở hữu!</h3>
              <p className="font-sans text-xs text-[#7B6E64] leading-relaxed">
                Hệ thống kiểm soát đồng thời (Pessimistic Locking) vừa ghi nhận một Patron khác hoàn tất niêm phong bản số trước bạn vài mili-giây.
              </p>
              <p className="font-sans text-xs text-[#0D0703] font-medium pt-1">
                Ma trận số hiệu đã được cập nhật tự động sang bản số tiếp theo khả dụng.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSoldOutConflictModal(false)}
              className="w-full bg-[#271E18] text-[#FAF8F3] py-3 text-xs uppercase tracking-widest font-semibold rounded-[2px] hover:bg-[#0D0703] transition-colors"
            >
              Tiếp tục với bản số mới
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
