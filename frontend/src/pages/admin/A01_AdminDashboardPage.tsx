// ============================================================================
// File: frontend/src/pages/admin/A01_AdminDashboardPage.tsx
// Mã màn hình: A01 | Route: /admin | FR: FR15a
// Vai trò: Bảng điều khiển Quản trị viên Tối cao — Thống kê KPI kinh doanh tổng quan
//          và biểu đồ tăng trưởng doanh thu theo tháng (Recharts).
// ============================================================================

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  Users,
  TrendingUp,
  Package,
  ShieldCheck,
  BarChart3,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { AdminLayout } from '../../layouts/AdminLayout';
import { getSummaryReportApi } from '../../api/admin.api';
import type { ReportSummary } from '../../types';
import { formatVND } from '../../utils/formatVND';

export const A01_AdminDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSummaryReportApi();
      setSummary(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải số liệu thống kê Dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Tiêu đề & Nút làm mới */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A7824B] font-bold">
              [FR15a] Executive Business Intelligence
            </span>
            <h2 className="font-serif text-3xl text-[#0D0703] font-medium tracking-tight mt-1">
              Tổng quan Hoạt động Kinh doanh
            </h2>
            <p className="font-sans text-xs text-[#7B6E64] mt-0.5">
              Số liệu tổng hợp thời gian thực từ cơ sở dữ liệu MySQL InnoDB.
            </p>
          </div>

          <button
            onClick={fetchSummary}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs uppercase tracking-wider font-semibold border border-[#D2C8BA] bg-[#FAF8F3] hover:bg-white rounded-[2px] transition-colors self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới dữ liệu</span>
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-[2px]">
            {error}
          </div>
        )}

        {/* 4 Thẻ KPI Scorecards */}
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

        {/* Biểu đồ Doanh thu Recharts AreaChart */}
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
            ) : !summary?.revenueByMonth || summary.revenueByMonth.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#7B6E64]">
                Chưa có dữ liệu doanh thu đơn hàng hoàn tất.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={summary.revenueByMonth}
                  margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A7824B" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#A7824B" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D2C8BA" opacity={0.5} />
                  <XAxis
                    dataKey="month"
                    stroke="#7B6E64"
                    fontSize={11}
                    tickLine={false}
                  />
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

        {/* Lối tắt quản trị nhanh */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link
            to="/admin/products"
            className="p-5 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] hover:border-[#0D0703] transition-colors group flex items-start justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-[#503625]" />
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#A7824B] font-bold">
                  [FR14] Catalog
                </span>
              </div>
              <h4 className="font-serif text-lg text-[#0D0703] font-medium group-hover:underline">
                Quản lý Sản phẩm & Biến thể
              </h4>
              <p className="font-sans text-xs text-[#7B6E64] mt-1">
                Thêm sản phẩm mới, thiết lập biến thể, gắn chất liệu và xóa an toàn bằng NOT EXISTS.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#7B6E64] group-hover:translate-x-1 transition-transform mt-1" />
          </Link>

          <Link
            to="/admin/reports/brands"
            className="p-5 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] hover:border-[#0D0703] transition-colors group flex items-start justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-[#503625]" />
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#A7824B] font-bold">
                  [FR15a] Having Query
                </span>
              </div>
              <h4 className="font-serif text-lg text-[#0D0703] font-medium group-hover:underline">
                Doanh số theo Thương hiệu
              </h4>
              <p className="font-sans text-xs text-[#7B6E64] mt-1">
                Lọc doanh số các thương hiệu hàng đầu với ngưỡng tối thiểu (HAVING clause).
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#7B6E64] group-hover:translate-x-1 transition-transform mt-1" />
          </Link>

          <Link
            to="/admin/tiers"
            className="p-5 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] hover:border-[#0D0703] transition-colors group flex items-start justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-[#503625]" />
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#A7824B] font-bold">
                  [FR15b] Subquery & ACID
                </span>
              </div>
              <h4 className="font-serif text-lg text-[#0D0703] font-medium group-hover:underline">
                Hạng & Nâng hạng tự động
              </h4>
              <p className="font-sans text-xs text-[#7B6E64] mt-1">
                Cập nhật cấu hình hạng và chạy nâng hạng tự động cho khách hàng trong Transaction.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#7B6E64] group-hover:translate-x-1 transition-transform mt-1" />
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
};
