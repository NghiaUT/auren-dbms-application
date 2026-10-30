import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, FileText, AlertCircle, DollarSign, ChevronRight, RefreshCw } from 'lucide-react';
import type { SalesDashboardSummary } from '../../../../types';
import { formatVND } from '../../../../utils/formatVND';

export interface SalesKpiCardsProps {
  summary: SalesDashboardSummary | null;
  loading: boolean;
  onRefresh: () => void;
}

export const SalesKpiCards: React.FC<SalesKpiCardsProps> = ({
  summary,
  loading,
  onRefresh,
}) => {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl text-[#0D0703]">Chỉ Số Hoạt Động Trọng Yếu (KPIs)</h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs text-[#7B6E64] hover:text-[#0D0703] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Đơn chờ tiếp nhận */}
        <Link
          to="/sales/orders?tab=unassigned"
          className="p-6 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] hover:border-[#271E18] transition-all hover:shadow-md block group"
        >
          <div className="flex items-center justify-between text-[#7B6E64] mb-2">
            <span className="font-mono text-[10px] uppercase tracking-widest">Đơn chờ tiếp nhận</span>
            <Clock className="w-4 h-4 text-[#A7824B]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-medium text-[#0D0703]">
              {summary ? summary.pendingUnassignedCount : '—'}
            </span>
            <span className="text-xs text-[#7B6E64]">đơn chưa nhận</span>
          </div>
          <p className="font-sans text-[11px] text-[#A7824B] mt-3 group-hover:underline flex items-center gap-1 font-semibold">
            Xem hàng đợi chờ nhận <ChevronRight className="w-3.5 h-3.5" />
          </p>
        </Link>

        {/* Card 2: Đơn tôi đang xử lý */}
        <Link
          to="/sales/orders?tab=my_orders"
          className="p-6 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] hover:border-[#271E18] transition-all hover:shadow-md block group"
        >
          <div className="flex items-center justify-between text-[#7B6E64] mb-2">
            <span className="font-mono text-[10px] uppercase tracking-widest">Đang điều phối</span>
            <FileText className="w-4 h-4 text-[#503625]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-medium text-[#0D0703]">
              {summary ? summary.myProcessingOrdersCount : '—'}
            </span>
            <span className="text-xs text-[#7B6E64]">đơn phụ trách</span>
          </div>
          <p className="font-sans text-[11px] text-[#503625] mt-3 group-hover:underline flex items-center gap-1 font-semibold">
            Xem đơn tôi phụ trách <ChevronRight className="w-3.5 h-3.5" />
          </p>
        </Link>

        {/* Card 3: Biến thể sắp hết */}
        <Link
          to="/sales/inventory/low-stock"
          className="p-6 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] hover:border-[#271E18] transition-all hover:shadow-md block group"
        >
          <div className="flex items-center justify-between text-[#7B6E64] mb-2">
            <span className="font-mono text-[10px] uppercase tracking-widest">Cảnh báo tồn kho</span>
            <AlertCircle className="w-4 h-4 text-[#BA1A1A]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`font-serif text-3xl font-medium ${
                summary && summary.lowStockVariantsCount > 0 ? 'text-[#BA1A1A]' : 'text-[#0D0703]'
              }`}
            >
              {summary ? summary.lowStockVariantsCount : '—'}
            </span>
            <span className="text-xs text-[#7B6E64]">biến thể dưới ngưỡng</span>
          </div>
          <p className="font-sans text-[11px] text-[#BA1A1A] mt-3 group-hover:underline flex items-center gap-1 font-semibold">
            Kiểm tra &amp; Nhập kho <ChevronRight className="w-3.5 h-3.5" />
          </p>
        </Link>

        {/* Card 4: Công nợ quá hạn */}
        <Link
          to="/sales/receivables"
          className="p-6 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] hover:border-[#271E18] transition-all hover:shadow-md block group"
        >
          <div className="flex items-center justify-between text-[#7B6E64] mb-2">
            <span className="font-mono text-[10px] uppercase tracking-widest">Công nợ quá hạn</span>
            <DollarSign className="w-4 h-4 text-[#BA1A1A]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl font-medium text-[#BA1A1A]">
              {summary ? formatVND(summary.myOverdueReceivablesAmount) : '—'}
            </span>
          </div>
          <p className="font-sans text-[11px] text-[#7B6E64] mt-3 group-hover:underline flex items-center gap-1 font-semibold">
            Mở sổ theo dõi nợ <ChevronRight className="w-3.5 h-3.5" />
          </p>
        </Link>
      </div>
    </section>
  );
};
