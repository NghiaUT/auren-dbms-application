// ============================================================================
// File: frontend/src/pages/admin/A01_AdminDashboardPage.tsx
// Mã màn hình: A01 | Route: /admin | FR: FR15a
// Vai trò: Bảng điều khiển Quản trị viên Tối cao — Thống kê KPI kinh doanh tổng quan
//          và biểu đồ tăng trưởng doanh thu theo tháng (Recharts).
// Refactored: Container page composing modular components from components/admin/dashboard
// ============================================================================

import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { getSummaryReportApi } from '../../api/admin.api';
import type { ReportSummary } from '../../types';
import {
  AdminKpiCards,
  AdminRevenueChart,
  AdminQuickActions,
} from '../../components/admin/dashboard';

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
        <AdminKpiCards summary={summary} loading={loading} />

        {/* Biểu đồ Doanh thu Recharts AreaChart */}
        <AdminRevenueChart revenueByMonth={summary?.revenueByMonth} loading={loading} />

        {/* Lối tắt quản trị nhanh */}
        <AdminQuickActions />
      </div>
    </AdminLayout>
  );
};

export default A01_AdminDashboardPage;
