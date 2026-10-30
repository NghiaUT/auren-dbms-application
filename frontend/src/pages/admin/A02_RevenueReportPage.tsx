// ============================================================================
// File: frontend/src/pages/admin/A02_RevenueReportPage.tsx
// Mã màn hình: A02 | Route: /admin/reports/revenue | FR: FR15a
// Vai trò: Báo cáo Doanh thu theo tháng — Biểu đồ cột Recharts, bộ lọc khoảng ngày
//          và tính năng xuất dữ liệu báo cáo sang CSV.
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Download, Filter, RefreshCw, Calendar } from 'lucide-react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { getRevenueReportApi } from '../../api/admin.api';
import type { RevenueReportItem } from '../../types';
import { formatVND } from '../../utils/formatVND';
import { getTodayDateString } from '../../utils/formatDate';

export const A02_RevenueReportPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<RevenueReportItem[]>([]);
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await getRevenueReportApi({
        from: from || undefined,
        to: to || undefined,
      });
      setData(items);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải báo cáo doanh thu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
  }, []);

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = data.reduce((sum, item) => sum + item.orderCount, 0);

  // Xuất file CSV
  const handleExportCSV = () => {
    if (data.length === 0) return;
    const headers = ['Tháng', 'Doanh thu (VND)', 'Số đơn hàng', 'Doanh thu TB / Đơn (VND)'];
    const rows = data.map((d) => [
      d.month,
      d.revenue,
      d.orderCount,
      d.orderCount > 0 ? Math.round(d.revenue / d.orderCount) : 0,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Auren_Revenue_Report_${getTodayDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#D2C8BA]/60">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A7824B] font-bold">
              [FR15a] Financial Reporting
            </span>
            <h2 className="font-serif text-3xl text-[#0D0703] font-medium tracking-tight mt-1">
              Báo cáo Doanh thu theo Tháng
            </h2>
            <p className="font-sans text-xs text-[#7B6E64] mt-0.5">
              Phân tích số liệu doanh thu và lưu lượng đơn hàng hoàn tất (`orders.status = delivered`).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportCSV}
              disabled={data.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs uppercase tracking-wider font-semibold border border-[#D2C8BA] bg-[#FAF8F3] hover:bg-white rounded-[2px] transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-[#503625]" />
              <span>Xuất CSV</span>
            </button>

            <button
              onClick={fetchRevenue}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs uppercase tracking-wider font-semibold bg-[#0D0703] text-white rounded-[2px] transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Cập nhật</span>
            </button>
          </div>
        </div>

        {/* Bộ lọc khoảng thời gian */}
        <div className="p-4 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-[#0D0703]">
            <Filter className="w-4 h-4 text-[#A7824B]" />
            <span>Bộ lọc ngày:</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#7B6E64]">Từ ngày:</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-[#D2C8BA] rounded-[2px] focus:outline-none focus:border-[#0D0703]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#7B6E64]">Đến ngày:</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-[#D2C8BA] rounded-[2px] focus:outline-none focus:border-[#0D0703]"
            />
          </div>

          <button
            onClick={fetchRevenue}
            className="px-3 py-1.5 bg-[#503625] text-white font-medium rounded-[2px] hover:bg-[#271E18] transition-colors"
          >
            Áp dụng lọc
          </button>

          {(from || to) && (
            <button
              onClick={() => {
                setFrom('');
                setTo('');
              }}
              className="text-[#BA1A1A] hover:underline"
            >
              Đặt lại
            </button>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-[2px]">
            {error}
          </div>
        )}

        {/* Tổng quan chỉ số lọc */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px]">
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#7B6E64]">
              Doanh thu trong kỳ
            </span>
            <div className="font-serif text-2xl text-[#0D0703] font-medium mt-1 tabular-nums">
              {formatVND(totalRevenue)}
            </div>
          </div>

          <div className="p-4 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px]">
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#7B6E64]">
              Số đơn hàng hoàn tất
            </span>
            <div className="font-serif text-2xl text-[#0D0703] font-medium mt-1 tabular-nums">
              {totalOrders} đơn
            </div>
          </div>

          <div className="p-4 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px]">
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#7B6E64]">
              Giá trị Đơn trung bình
            </span>
            <div className="font-serif text-2xl text-[#0D0703] font-medium mt-1 tabular-nums">
              {formatVND(totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0)}
            </div>
          </div>
        </div>

        {/* Biểu đồ Doanh thu Recharts BarChart */}
        <div className="p-6 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px]">
          <div className="mb-4">
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#A7824B] font-bold">
              [Query Loại h: GROUP BY & SUM]
            </span>
            <h3 className="font-serif text-xl text-[#0D0703] font-medium">
              Biểu đồ Cột Phân bổ Doanh số theo Tháng
            </h3>
          </div>

          <div className="h-[300px] w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-[#7B6E64]">
                Đang xử lý dữ liệu...
              </div>
            ) : data.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#7B6E64]">
                Không có dữ liệu trong khoảng thời gian đã chọn.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
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
                  <Bar dataKey="revenue" fill="#503625" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bảng dữ liệu chi tiết Hairline Table */}
        <div className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] overflow-hidden">
          <div className="p-4 border-b border-[#D2C8BA]/60 flex items-center justify-between">
            <h3 className="font-serif text-lg text-[#0D0703] font-medium">
              Bảng Số liệu Chi tiết theo Tháng
            </h3>
            <span className="font-mono text-xs text-[#7B6E64]">
              Tổng: {data.length} tháng ghi nhận
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#D2C8BA] bg-[#EAE4D9]/40 text-[#503625] font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4">Tháng</th>
                  <th className="py-3 px-4 text-right">Doanh thu</th>
                  <th className="py-3 px-4 text-right">Số đơn giao thành công</th>
                  <th className="py-3 px-4 text-right">Giá trị Đơn trung bình</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D2C8BA]/40 font-sans text-xs">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[#7B6E64]">
                      Không có số liệu.
                    </td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr key={item.month} className="hover:bg-[#FAF8F3]/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-[#0D0703]">
                        {item.month}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-[#0D0703] tabular-nums">
                        {formatVND(item.revenue)}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-[#503625]">
                        {item.orderCount} đơn
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-[#7B6E64]">
                        {formatVND(item.orderCount > 0 ? Math.round(item.revenue / item.orderCount) : 0)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
