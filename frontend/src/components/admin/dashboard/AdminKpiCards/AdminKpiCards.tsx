import React from 'react';
import { DollarSign, ShoppingBag, Users, TrendingUp } from 'lucide-react';
import type { ReportSummary } from '../../../../types';
import { formatVND } from '../../../../utils/formatVND';

export interface AdminKpiCardsProps {
  summary: ReportSummary | null;
  loading: boolean;
}

export const AdminKpiCards: React.FC<AdminKpiCardsProps> = ({ summary, loading }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* KPI 1: Doanh thu thực nhận */}
      <div className="p-5 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] relative overflow-hidden group">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#7B6E64]">
            Tổng Doanh thu (Delivered)
          </span>
          <DollarSign className="w-4 h-4 text-[#A7824B]" />
        </div>
        <div className="font-serif text-2xl text-[#0D0703] font-medium tabular-nums">
          {loading ? '...' : formatVND(summary?.revenue || 0)}
        </div>
        <p className="font-sans text-[11px] text-[#7B6E64] mt-2">
          Chỉ ghi nhận đơn hàng đã giao thành công
        </p>
      </div>

      {/* KPI 2: Số đơn hàng */}
      <div className="p-5 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#7B6E64]">
            Tổng Đơn hàng (Hợp lệ)
          </span>
          <ShoppingBag className="w-4 h-4 text-[#503625]" />
        </div>
        <div className="font-serif text-3xl text-[#0D0703] font-medium tabular-nums">
          {loading ? '...' : summary?.orderCount || 0}
        </div>
        <p className="font-sans text-[11px] text-[#7B6E64] mt-2">
          Không tính các đơn bị khách hàng huỷ
        </p>
      </div>

      {/* KPI 3: Khách hàng mới */}
      <div className="p-5 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#7B6E64]">
            Khách hàng Thành viên
          </span>
          <Users className="w-4 h-4 text-[#271E18]" />
        </div>
        <div className="font-serif text-3xl text-[#0D0703] font-medium tabular-nums">
          {loading ? '...' : summary?.newCustomers || 0}
        </div>
        <p className="font-sans text-[11px] text-[#7B6E64] mt-2">
          Tài khoản khách hàng trong hệ thống
        </p>
      </div>

      {/* KPI 4: Giá trị đơn TB (AOV) */}
      <div className="p-5 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#7B6E64]">
            Giá trị Đơn TB (AOV)
          </span>
          <TrendingUp className="w-4 h-4 text-[#A7824B]" />
        </div>
        <div className="font-serif text-2xl text-[#0D0703] font-medium tabular-nums">
          {loading ? '...' : formatVND(summary?.avgOrderValue || 0)}
        </div>
        <p className="font-sans text-[11px] text-[#7B6E64] mt-2">
          Mức chi tiêu bình quân trên mỗi đơn
        </p>
      </div>
    </div>
  );
};
