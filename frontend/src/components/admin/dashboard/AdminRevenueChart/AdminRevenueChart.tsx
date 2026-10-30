import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatVND } from '../../../../utils/formatVND';

export interface AdminRevenueChartProps {
  revenueByMonth?: Array<{ month: string; revenue: number }>;
  loading: boolean;
}

export const AdminRevenueChart: React.FC<AdminRevenueChartProps> = ({
  revenueByMonth,
  loading,
}) => {
  return (
    <div className="p-6 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#A7824B] font-bold">
            [Query Loại h: AGGREGATE]
          </span>
          <h3 className="font-serif text-xl text-[#0D0703] font-medium">
            Xu hướng Doanh thu theo Tháng (Delivered Orders)
          </h3>
        </div>
        <Link
          to="/admin/reports/revenue"
          className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[#503625] hover:text-[#0D0703]"
        >
          <span>Xem báo cáo chi tiết</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="h-[320px] w-full">
        {loading ? (
          <div className="h-full flex items-center justify-center text-xs text-[#7B6E64]">
            Đang vẽ biểu đồ thống kê...
          </div>
        ) : !revenueByMonth || revenueByMonth.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-[#7B6E64]">
            Chưa có dữ liệu doanh thu đơn hàng hoàn tất.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueByMonth} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A7824B" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#A7824B" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#D2C8BA" opacity={0.5} />
              <XAxis dataKey="month" stroke="#7B6E64" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#7B6E64"
                fontSize={11}
                tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                tickLine={false}
              />
              <Tooltip
                formatter={(val: any) => [formatVND(Number(val)), 'Doanh thu']}
                labelFormatter={(label) => `Tháng: ${label}`}
                contentStyle={{
                  backgroundColor: '#FAF8F3',
                  borderColor: '#D2C8BA',
                  fontSize: '12px',
                  borderRadius: '2px',
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#503625"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
