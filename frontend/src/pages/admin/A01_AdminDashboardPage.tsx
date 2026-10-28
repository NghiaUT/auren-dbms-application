// ============================================================================
// File: frontend/src/pages/admin/A01_AdminDashboardPage.tsx
// Mã màn hình: A01 | Route: /admin | FR: FR15a
// Vai trò: Dashboard Quản trị viên — Thống kê doanh thu, số đơn, khách hàng mới.
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { formatVND } from '../../utils/formatVND';

export const A01_AdminDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen pt-28 pb-20 bg-[#FCF9F3]">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
        <div className="p-8 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
          <div>
            <span className="eyebrow">Cổng Quản trị Tối cao (System Administration)</span>
            <h1 className="font-serif text-3xl text-[#0D0703] mt-1">
              Bảng điều khiển Quản trị: {user?.fullName}
            </h1>
            <p className="font-sans text-xs text-[#7B6E64] mt-1">Vai trò hệ thống: Administrator ({user?.email})</p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="btn-auren-outline text-[11px] py-2 px-4">
              Về trang chủ
            </Link>
            <button
              onClick={() => logout()}
              className="text-xs uppercase tracking-wider font-semibold text-[#BA1A1A] hover:underline"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Admin KPI Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
          <div className="p-6 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px]">
            <div className="flex items-center justify-between text-[#7B6E64] mb-2">
              <span className="eyebrow text-[9px]">Tổng doanh thu</span>
              <DollarSign className="w-4 h-4 text-[#A7824B]" />
            </div>
            <span className="font-serif text-2xl text-[#0D0703] tabular-nums">
              {formatVND(1420500000)}
            </span>
            <p className="font-sans text-[11px] text-green-700 mt-2 font-medium">↑ +14.8% so với tháng trước</p>
          </div>

          <div className="p-6 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px]">
            <div className="flex items-center justify-between text-[#7B6E64] mb-2">
              <span className="eyebrow text-[9px]">Tổng số đơn</span>
              <BarChart3 className="w-4 h-4 text-[#503625]" />
            </div>
            <span className="font-serif text-3xl text-[#0D0703]">42</span>
            <p className="font-sans text-[11px] text-[#7B6E64] mt-2">Đơn hàng trong tháng</p>
          </div>

          <div className="p-6 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px]">
            <div className="flex items-center justify-between text-[#7B6E64] mb-2">
              <span className="eyebrow text-[9px]">Khách hàng mới</span>
              <Users className="w-4 h-4 text-[#271E18]" />
            </div>
            <span className="font-serif text-3xl text-[#0D0703]">18</span>
            <p className="font-sans text-[11px] text-[#7B6E64] mt-2">Đăng ký mới</p>
          </div>

          <div className="p-6 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px]">
            <div className="flex items-center justify-between text-[#7B6E64] mb-2">
              <span className="eyebrow text-[9px]">Hạng cao nhất</span>
              <TrendingUp className="w-4 h-4 text-[#A7824B]" />
            </div>
            <span className="font-serif text-2xl text-[#A7824B]">Diamond</span>
            <p className="font-sans text-[11px] text-[#7B6E64] mt-2">5 khách VIP</p>
          </div>
        </div>
      </div>
    </div>
  );
};
