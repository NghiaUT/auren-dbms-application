// ============================================================================
// File: frontend/src/pages/customer/C02_CheckoutPage.tsx
// Mã màn hình: C02 | Route: /checkout | FR: FR5, FR7
// Vai trò: Thanh toán & Giao nhận White-Glove — Chuyển thể trung thực từ bản thiết kế
//          Stitch .stitch/designs/c02-checkout.html
// Refactored: Container page composing modular components from components/customer/checkout
// ============================================================================

import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { getCartItems, clearCart, type CartItem } from '../../utils/cartStorage';
import { createOrderApi } from '../../api/order.api';
import { useToast } from '../../context/ToastContext';
import {
  CheckoutStepper,
  CorrespondenceSection,
  SpatialAccessSection,
  SettlementMethodSection,
  CheckoutOrderSummary,
} from '../../components/customer/checkout';

export const C02_CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
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
      toast.success("Đơn hàng đã được đặt thành công");

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
      toast.error(err, message);
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
      {/* Top Subtle Architectural Header Stepper */}
      <CheckoutStepper />

      {/* Main Architectural Form (7 / 5 cols) */}
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

              {/* BƯỚC 1: THƯ TÍN BẢO MẬT */}
              <CorrespondenceSection
                correspondenceEmail={correspondenceEmail}
                onCorrespondenceEmailChange={setCorrespondenceEmail}
                correspondencePhone={correspondencePhone}
                onCorrespondencePhoneChange={setCorrespondencePhone}
              />

              {/* BƯỚC 2: TIẾP CẬN KIẾN TRÚC & ĐỊA CHỈ GIAO NHẬN */}
              <SpatialAccessSection
                recipientName={recipientName}
                onRecipientNameChange={setRecipientName}
                streetAddress={streetAddress}
                onStreetAddressChange={setStreetAddress}
                residenceDetails={residenceDetails}
                onResidenceDetailsChange={setResidenceDetails}
                city={city}
                onCityChange={setCity}
                elevatorDimension={elevatorDimension}
                onElevatorDimensionChange={setElevatorDimension}
                freightElevator={freightElevator}
                onFreightElevatorChange={setFreightElevator}
                historicStairs={historicStairs}
                onHistoricStairsChange={setHistoricStairs}
                stoneCourtyard={stoneCourtyard}
                onStoneCourtyardChange={setStoneCourtyard}
                deliveryHorizon={deliveryHorizon}
                onDeliveryHorizonChange={setDeliveryHorizon}
              />

              {/* BƯỚC 3: GIAO THỨC THANH TOÁN */}
              <SettlementMethodSection
                settlementMethod={settlementMethod}
                onSettlementMethodChange={setSettlementMethod}
              />
            </div>

            {/* CỘT PHẢI (5 Cols): Sticky Summary & Action */}
            <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6">
              <CheckoutOrderSummary
                cartItems={cartItems}
                subtotal={subtotal}
                discountAmount={discountAmount}
                discountPct={discountPct}
                finalTotal={finalTotal}
                depositDue={depositDue}
                finalDue={finalDue}
                loading={loading}
              />
            </div>
          </div>
        </form>
      </section>
    </div>
  );
};

export default C02_CheckoutPage;
