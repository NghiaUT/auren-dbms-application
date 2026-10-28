// ============================================================================
// File: frontend/src/pages/customer/C04_MyOrdersPage.tsx
// Mã màn hình: C04 | Route: /account/orders | FR: FR8
// Vai trò: Màn hình Đơn hàng của tôi (Customer Dashboard) — Hiển thị hồ sơ khách hàng,
//          hạng thành viên và danh sách đơn hàng.
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import { Package, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { formatVND } from '../../utils/formatVND';

export const C04_MyOrdersPage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen pt-28 pb-20 bg-[#FCF9F3]">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
        {/* Header Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-sans text-[#7B6E64] mb-4">
          <Link to="/" className="hover:text-[#0D0703]">
            Trang chủ
          </Link>
          <span>/</span>
          <span className="text-[#0D0703] font-medium">Tài khoản khách hàng</span>
        </div>

        {/* Customer Profile Banner */}
        <div className="p-8 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#271E18] text-[#FAF8F3] flex items-center justify-center font-serif text-2xl font-bold">
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-serif text-2xl sm:text-3xl text-[#0D0703]">{user?.fullName}</h1>
                <span className="px-2.5 py-0.5 bg-[#503625] text-[#FAF8F3] text-[10px] font-sans font-bold uppercase tracking-widest rounded-[1px]">
                  {user?.customer?.tier?.name || 'Classic'}
                </span>
              </div>
              <p className="font-sans text-xs text-[#7B6E64] mt-1">{user?.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-sans border-t md:border-t-0 md:border-l border-[#D2C8BA]/60 pt-4 md:pt-0 md:pl-8">
            <div>
              <span className="text-[#7B6E64] block text-[10px] uppercase tracking-wider">
                Tổng chi tiêu tích lũy
              </span>
              <span className="font-bold text-base text-[#0D0703] tabular-nums">
                {formatVND(user?.customer?.totalSpent || 0)}
              </span>
            </div>
            {user?.customer?.tier && (
              <div>
                <span className="text-[#7B6E64] block text-[10px] uppercase tracking-wider">
                  Mức giảm giá hiện tại
                </span>
                <span className="font-bold text-base text-[#A7824B]">
                  {user.customer.tier.discountPct}%
                </span>
              </div>
            )}
            <button
              onClick={() => logout()}
              className="text-xs uppercase tracking-wider font-semibold text-[#BA1A1A] hover:underline"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Orders Queue Section */}
        <div className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] p-8">
          <div className="flex items-center justify-between pb-6 border-b border-[#D2C8BA]/60">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-[#271E18]" />
              <h2 className="font-serif text-2xl text-[#0D0703]">Đơn hàng của tôi</h2>
            </div>
            <Link to="/products" className="arrow-link text-[11px]">
              Tiếp tục khám phá sản phẩm →
            </Link>
          </div>

          <div className="py-16 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-[#EAE4D9] flex items-center justify-center text-[#7B6E64] mb-3">
              <Package className="w-6 h-6 stroke-[1.5]" />
            </div>
            <h3 className="font-serif text-xl text-[#0D0703] mb-1">Chưa có đơn hàng nào</h3>
            <p className="font-sans text-xs text-[#7B6E64] max-w-sm leading-relaxed mb-6">
              Bạn chưa thực hiện đơn đặt hàng nào tại AUREN Studio. Các đơn hàng sau khi đặt sẽ được theo dõi tiến độ chi tiết tại đây.
            </p>
            <Link to="/" className="btn-auren-solid">
              Khám phá bộ sưu tập AUREN
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
