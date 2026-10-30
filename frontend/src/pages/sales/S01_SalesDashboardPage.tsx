// ============================================================================
// File: frontend/src/pages/sales/S01_SalesDashboardPage.tsx
// Mã màn hình: S01 | Route: /sales | FR: FR11-13
// Vai trò: Bảng điều khiển Sales — Tổng hợp số đơn chờ nhận, biến thể sắp hết,
//          tổng nợ quá hạn và danh sách các đơn hàng cần hành động gấp.
// Refactored: Container page composing modular components from components/sales/dashboard
// ============================================================================

import React, { useEffect, useState } from 'react';
import { SalesHeaderNav } from '../../components/layout';
import { getSalesSummaryApi, getSalesOrderQueueApi, claimOrderApi } from '../../api/sales.api';
import type { SalesDashboardSummary, SalesOrderQueueItem } from '../../types';
import { SalesKpiCards, SalesRecentOrders } from '../../components/sales/dashboard';

export const S01_SalesDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<SalesDashboardSummary | null>(null);
  const [recentUnassigned, setRecentUnassigned] = useState<SalesOrderQueueItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, queueRes] = await Promise.all([
        getSalesSummaryApi(),
        getSalesOrderQueueApi({ tab: 'unassigned', limit: 5 }),
      ]);
      setSummary(sumRes);
      setRecentUnassigned(queueRes.data);
    } catch (err: any) {
      console.error('Lỗi khi nạp dữ liệu Sales Dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleClaim = async (orderId: number) => {
    try {
      setActionLoading(orderId);
      setActionMessage(null);
      await claimOrderApi(orderId);
      setActionMessage({ text: `Đã tiếp nhận thành công đơn hàng #AUR-2026-${orderId}!`, type: 'success' });
      await fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Không thể nhận đơn hàng này.';
      setActionMessage({ text: msg, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#FCF9F3]">
      <SalesHeaderNav />

      <main className="max-w-[1600px] mx-auto px-6 md:px-12">
        {/* Banner thông báo thao tác */}
        {actionMessage && (
          <div
            className={`p-4 mb-6 text-xs uppercase tracking-wider font-semibold rounded-[2px] flex items-center justify-between border ${
              actionMessage.type === 'success'
                ? 'bg-[#EBF3ED] text-[#246A38] border-[#246A38]/30'
                : 'bg-[#FDF2F2] text-[#BA1A1A] border-[#BA1A1A]/30'
            }`}
          >
            <span>{actionMessage.text}</span>
            <button
              onClick={() => setActionMessage(null)}
              className="text-xs font-bold hover:opacity-75"
            >
              ✕
            </button>
          </div>
        )}

        {/* 4 THẺ KPI TỔNG HỢP */}
        <SalesKpiCards summary={summary} loading={loading} onRefresh={fetchData} />

        {/* DANH SÁCH ĐƠN HÀNG CHỜ TIẾP NHẬN GẤP */}
        <SalesRecentOrders
          loading={loading}
          recentUnassigned={recentUnassigned}
          totalPendingCount={summary?.pendingUnassignedCount || 0}
          actionLoading={actionLoading}
          onClaim={handleClaim}
        />
      </main>
    </div>
  );
};

export default S01_SalesDashboardPage;
