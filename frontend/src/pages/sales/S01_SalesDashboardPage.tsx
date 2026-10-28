// ============================================================================
// File: frontend/src/pages/sales/S01_SalesDashboardPage.tsx
// Mã màn hình: S01 | Route: /sales | FR: FR11-13
// Vai trò: Bảng điều khiển Sales — Tổng hợp số đơn chờ nhận, biến thể sắp hết, công nợ.
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle, Clock, FileText } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';

export const S01_SalesDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen pt-28 pb-20 bg-[#FCF9F3]">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
        <div className="p-8 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
          <div>
            <span className="eyebrow">Cổng tác nghiệp Bán hàng & Xử lý đơn</span>
            <h1 className="font-serif text-3xl text-[#0D0703] mt-1">
              Bảng điều khiển Sales: {user?.fullName}
            </h1>
            <p className="font-sans text-xs text-[#7B6E64] mt-1">Vai trò hệ thống: Nhân viên Sales ({user?.email})</p>
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

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px]">
            <div className="flex items-center justify-between text-[#7B6E64] mb-2">
              <span className="eyebrow text-[9px]">Đơn chờ tiếp nhận</span>
              <Clock className="w-4 h-4 text-[#A7824B]" />
            </div>
            <span className="font-serif text-3xl text-[#0D0703]">3</span>
            <p className="font-sans text-[11px] text-[#7B6E64] mt-2">Cần nhân viên nhận xử lý</p>
          </div>

          <div className="p-6 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px]">
            <div className="flex items-center justify-between text-[#7B6E64] mb-2">
              <span className="eyebrow text-[9px]">Đang phụ trách</span>
              <FileText className="w-4 h-4 text-[#503625]" />
            </div>
            <span className="font-serif text-3xl text-[#0D0703]">7</span>
            <p className="font-sans text-[11px] text-[#7B6E64] mt-2">Đang trong tiến trình giao</p>
          </div>

          <div className="p-6 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px]">
            <div className="flex items-center justify-between text-[#7B6E64] mb-2">
              <span className="eyebrow text-[9px]">Biến thể sắp hết</span>
              <AlertCircle className="w-4 h-4 text-[#BA1A1A]" />
            </div>
            <span className="font-serif text-3xl text-[#BA1A1A]">2</span>
            <p className="font-sans text-[11px] text-[#7B6E64] mt-2">Tồn kho dưới ngưỡng an toàn</p>
          </div>
        </div>
      </div>
    </div>
  );
};
