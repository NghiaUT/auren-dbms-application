// ============================================================================
// File: frontend/src/pages/customer/C01_CartPage.tsx
// Mã màn hình: C01 | Route: /cart | FR: FR5
// Vai trò: Giỏ hàng kiến trúc (Shopping Bag) — Chuyển thể trung thực từ bản thiết kế
//          Stitch .stitch/designs/c01-cart.html
// Refactored: Container page composing modular components from components/customer/cart
// ============================================================================

import React, { useEffect, useState, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  getCartItems,
  updateQuantity,
  removeFromCart,
  updateCustomization,
  type CartItem,
} from '../../utils/cartStorage';
import { useAuth } from '../../auth/useAuth';
import {
  CartNotificationBar,
  CartStepper,
  CartItemList,
  CartSummary,
  CartEmptyState,
} from '../../components/customer/cart';

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

  // Bảo vệ cấp trang: Nhân sự nội bộ (sales / admin) không được truy cập giỏ hàng
  if (user && (user.role === 'sales' || user.role === 'admin')) {
    return <Navigate to="/403" replace />;
  }

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
      {/* Contextual Notification Bar */}
      <CartNotificationBar />

      {/* Bag Hero / Stepper Header */}
      <CartStepper />

      {/* Cart Content Area (Asymmetric 12-Column Grid) */}
      <section className="w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16">
        {cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* CỘT TRÁI (8 Cols): Danh sách sản phẩm trong giỏ */}
            <div className="lg:col-span-8 space-y-6">
              <CartItemList
                cartItems={cartItems}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeFromCart}
                onUpdateCustomization={(variantId, data) => updateCustomization(variantId, data)}
              />

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
              <CartSummary
                subtotal={subtotal}
                discountAmount={discountAmount}
                discountPct={discountPct}
                tierName={user?.customer?.tier?.name}
                estimatedTotal={estimatedTotal}
                totalItemCount={totalItemCount}
                isAuthenticated={isAuthenticated}
                onProceedToCheckout={handleProceedToCheckout}
              />
            </div>
          </div>
        ) : (
          <CartEmptyState />
        )}
      </section>
    </div>
  );
};

export default C01_CartPage;
