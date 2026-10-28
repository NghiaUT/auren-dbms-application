// ============================================================================
// File: frontend/src/pages/customer/C05_ConfirmationPage.tsx
// Mã màn hình: C05 | Route: /checkout/success | FR: FR5, FR8
// Vai trò: Xác nhận đơn hàng & Đăng ký hồ sơ kiến trúc — Chuyển thể trung thực
//          từ bản thiết kế Stitch .stitch/designs/c05-confirmation.html:
//          - Thông báo niêm phong đơn hàng thành công (Commission Sealed)
//          - Hiển thị mã số lưu trữ AUR-2026-XXXX và Registry Key
//          - Tiến trình 4 giai đoạn chế tác thủ công & bàn giao White-Glove
// ============================================================================

import React from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import type { OrderDetail } from '../../types';
import { formatVND } from '../../utils/formatVND';

export const C05_ConfirmationPage: React.FC = () => {
  const location = useLocation();
  const order = (location.state as any)?.order as OrderDetail | undefined;
  const paymentMethod = (location.state as any)?.paymentMethod as string || 'wire';

  if (!order) {
    return <Navigate to="/account/orders" replace />;
  }

  const orderCode = `AUR-2026-${String(order.id).padStart(4, '0')}`;
  const depositPayment = order.payments?.find((p) => p.type === 'deposit');

  return (
    <div className="w-full pt-28 pb-24">
      {/* ============================================================ */}
      {/* Status Stepper Bar                                           */}
      {/* ============================================================ */}
      <section className="w-full bg-[#F6F3ED] py-4 border-b border-[#D2C8BA]/40 mb-10">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16">
          <nav aria-label="Acquisition Progress" className="flex flex-wrap items-center justify-between gap-y-2 text-xs uppercase tracking-widest text-[#7B6E64]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D2C8BA]"></span>
              <span>01 Túi hàng</span>
            </div>
            <span className="hidden md:inline text-[#D2C8BA]">—</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D2C8BA]"></span>
              <span>02 Giao nhận White-Glove</span>
            </div>
            <span className="hidden md:inline text-[#D2C8BA]">—</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D2C8BA]"></span>
              <span>03 Quyết toán</span>
            </div>
            <span className="hidden md:inline text-[#D2C8BA]">—</span>
            <div className="flex items-center gap-2 text-[#0D0703] font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#A58548] animate-pulse"></span>
              <span className="tracking-[0.2em]">04 Xác nhận Niêm phong [Sealed]</span>
            </div>
          </nav>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Hero / Success Announcement Header                           */}
      {/* ============================================================ */}
      <section className="w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16 pb-12">
        <div className="max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-[#A58548]"></span>
            <p className="font-sans text-[11px] font-semibold text-[#A58548] tracking-[0.24em] uppercase">
              Commission Confirmed · Architectural Provenance Registered
            </p>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#0D0703] font-normal tracking-tight">
            Tác Phẩm Của Quý Khách Đã Được Niêm Phong.
          </h1>

          <p className="font-sans text-sm sm:text-base text-[#4E4540] max-w-2xl leading-relaxed">
            Mã hiệu hồ sơ ủy thác <strong className="text-[#0D0703] font-semibold">{orderCode}</strong> đã được ghi nhận cho quý khách <strong className="text-[#0D0703] font-semibold">{order.customerName}</strong>. Xưởng chế tác của chúng tôi đã chính thức khắc ghi tác phẩm vào sổ lưu trữ mùa vụ.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-[#7B6E64] font-mono">
            <span className="flex items-center gap-1.5 text-[#0D0703]">
              <span className="text-[#A58548]">✓</span>
              <span>Registry Key: 8820-CPH-WALNUT</span>
            </span>
            <span className="text-[#D2C8BA]">•</span>
            <span>Địa chỉ giao nhận: {order.shippingAddress}</span>
            <span className="text-[#D2C8BA]">•</span>
            <span className="text-emerald-700 font-semibold">Chứng thư số đã kích hoạt</span>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Commission Overview Grid                                     */}
      {/* ============================================================ */}
      <section className="w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* CỘT TRÁI (8 Cols): Chi tiết tác phẩm & Tiến trình */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Danh sách tác phẩm đã được niêm phong */}
            <div className="bg-[#FAF8F3] p-6 md:p-8 rounded-[2px] border border-[#D2C8BA]/60 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#D2C8BA]/40">
                <h3 className="font-serif text-2xl text-[#0D0703]">Danh Sách Tác Phẩm Ủy Thác</h3>
                <span className="font-sans text-xs uppercase tracking-wider text-[#A7824B]">
                  {order.items.length} Tác phẩm
                </span>
              </div>

              <div className="divide-y divide-[#D2C8BA]/40 space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="pt-4 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-[#A7824B] uppercase tracking-widest">
                          Ref. {item.sku}
                        </span>
                        {item.serialNo && (
                          <span className="bg-[#EAE4D9] px-2 py-0.5 text-[#0D0703] font-mono text-[10px] font-bold rounded-[1px]">
                            Bản khắc số: {item.serialNo}
                          </span>
                        )}
                      </div>
                      <h4 className="font-serif text-xl text-[#0D0703]">{item.productName}</h4>
                      <p className="font-sans text-xs text-[#7B6E64]">
                        Quy cách: {item.finish} • Kích thước: {item.size} • SL: {item.quantity}
                      </p>
                      {item.customization?.monogram && (
                        <p className="font-sans text-[11px] text-[#A58548] italic">
                          Khắc biển đồng lưu niệm: "{item.customization.monogram}"
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="font-serif text-lg font-medium text-[#0D0703] tabular-nums">
                        {formatVND(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tiến trình 4 giai đoạn chế tác & bàn giao */}
            <div className="bg-[#F6F3ED] p-6 md:p-8 rounded-[2px] border border-[#D2C8BA]/60 space-y-6">
              <h3 className="font-serif text-2xl text-[#0D0703]">Lộ Trình Bàn Giao Không Gian</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                <div className="p-4 bg-[#FCF9F3] border-l-2 border-[#A58548] rounded-[1px] space-y-1">
                  <span className="font-mono text-[10px] text-[#A58548] uppercase tracking-wider block">Giai đoạn 01</span>
                  <p className="font-serif text-base font-medium text-[#0D0703]">Khắc Ghi Hồ Sơ</p>
                  <p className="font-sans text-[10px] text-emerald-700 font-semibold">✓ Đã hoàn tất</p>
                </div>

                <div className="p-4 bg-[#FCF9F3] border-l-2 border-[#D2C8BA] rounded-[1px] space-y-1">
                  <span className="font-mono text-[10px] text-[#7B6E64] uppercase tracking-wider block">Giai đoạn 02</span>
                  <p className="font-serif text-base font-medium text-[#0D0703]">Kiểm Tra Tồn &amp; Phôi Gỗ</p>
                  <p className="font-sans text-[10px] text-[#A58548] font-semibold">Đang điều phối xưởng</p>
                </div>

                <div className="p-4 bg-[#FCF9F3] border-l-2 border-[#D2C8BA] rounded-[1px] space-y-1 opacity-70">
                  <span className="font-mono text-[10px] text-[#7B6E64] uppercase tracking-wider block">Giai đoạn 03</span>
                  <p className="font-serif text-base font-medium text-[#0D0703]">Đánh Bóng &amp; Đóng Thùng</p>
                  <p className="font-sans text-[10px] text-[#7B6E64]">Dự kiến 3-5 ngày</p>
                </div>

                <div className="p-4 bg-[#FCF9F3] border-l-2 border-[#D2C8BA] rounded-[1px] space-y-1 opacity-70">
                  <span className="font-mono text-[10px] text-[#7B6E64] uppercase tracking-wider block">Giai đoạn 04</span>
                  <p className="font-serif text-base font-medium text-[#0D0703]">Bàn Giao White-Glove</p>
                  <p className="font-sans text-[10px] text-[#7B6E64]">Quyết toán tất toán</p>
                </div>
              </div>
            </div>

          </div>

          {/* CỘT PHẢI (4 Cols): Hướng dẫn thanh toán & Điều hướng */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Thông tin đặt cọc */}
            <div className="bg-[#271E18] text-[#FAF8F3] p-8 rounded-[2px] shadow-xl space-y-6">
              <div className="space-y-2">
                <span className="font-sans text-[10px] uppercase tracking-widest text-[#FFDDB1] block">
                  Phương thức thanh toán đã chọn: {paymentMethod === 'wire' ? 'Chuyển khoản ký quỹ (Wire)' : 'Thẻ tín dụng'}
                </span>
                <h3 className="font-serif text-2xl">Đặt Cọc Đợt 1 (50%)</h3>
                <p className="font-serif text-3xl font-medium text-[#FFDDB1] tabular-nums">
                  {depositPayment ? formatVND(depositPayment.amount) : formatVND(Math.round(order.total * 0.5))}
                </p>
              </div>

              {paymentMethod === 'wire' && (
                <div className="pt-4 border-t border-[#FAF8F3]/15 space-y-2.5 font-sans text-xs text-[#FAF8F3]/80">
                  <p className="font-semibold text-[#FAF8F3]">Thông tin tài khoản ký quỹ AUREN:</p>
                  <div className="p-3 bg-[#FAF8F3]/10 rounded-[1px] space-y-1 font-mono text-[11px] text-[#FFDDB1]">
                    <p>Ngân hàng: Techcombank - Chi nhánh Thảo Điền</p>
                    <p>Số tài khoản: 1903 8888 9999 01</p>
                    <p>Chủ tài khoản: CTY TNHH NOITHAT KIEN TRUC AUREN</p>
                    <p>Cú pháp: {orderCode} DEPOSIT</p>
                  </div>
                  <p className="text-[10px] text-[#FAF8F3]/60 leading-relaxed pt-1">
                    Sau khi nhận được khoản ký quỹ, điều phối viên AUREN sẽ gọi điện thoại xác nhận lịch bàn giao.
                  </p>
                </div>
              )}

              <div className="pt-4 space-y-3">
                <Link
                  to="/account/orders"
                  className="w-full py-4 px-6 bg-[#FAF8F3] hover:bg-white text-[#271E18] font-sans text-xs font-semibold uppercase tracking-[0.18em] rounded-[2px] block text-center shadow-md transition-all"
                >
                  Theo Dõi Đơn Hàng Tại Hồ Sơ →
                </Link>

                <Link
                  to="/products"
                  className="w-full py-3 px-6 bg-transparent text-[#FAF8F3]/80 hover:text-[#FAF8F3] font-sans text-xs uppercase tracking-widest rounded-[2px] block text-center transition-colors"
                >
                  Tiếp Tục Khám Phá Bộ Sưu Tập
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>
    </div>
  );
};
export default C05_ConfirmationPage;
