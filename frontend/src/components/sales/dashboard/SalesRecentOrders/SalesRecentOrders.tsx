import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import type { SalesOrderQueueItem } from '../../../../types';
import { formatVND } from '../../../../utils/formatVND';

export interface SalesRecentOrdersProps {
  loading: boolean;
  recentUnassigned: SalesOrderQueueItem[];
  totalPendingCount: number;
  actionLoading: number | null;
  onClaim: (orderId: number) => void;
}

export const SalesRecentOrders: React.FC<SalesRecentOrdersProps> = ({
  loading,
  recentUnassigned,
  totalPendingCount,
  actionLoading,
  onClaim,
}) => {
  return (
    <section className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#D2C8BA]/40">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A7824B] font-bold">
            Action Required
          </span>
          <h3 className="font-serif text-2xl text-[#0D0703] mt-1">
            Đơn Hàng Mới Chờ Nhân Viên Tiếp Nhận
          </h3>
          <p className="font-sans text-xs text-[#7B6E64]">
            Nhân viên Sales tiếp nhận để xác nhận đơn, khóa đơn và bắt đầu lập lịch điều phối White-Glove.
          </p>
        </div>

        <Link
          to="/sales/orders?tab=unassigned"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-[#0D0703] hover:underline whitespace-nowrap"
        >
          <span>Xem toàn bộ hàng đợi ({totalPendingCount})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-[#7B6E64]">Đang tải danh sách đơn hàng...</div>
      ) : recentUnassigned.length === 0 ? (
        <div className="py-12 text-center">
          <CheckCircle2 className="w-8 h-8 text-[#246A38] mx-auto mb-2 opacity-80" />
          <p className="font-serif text-lg text-[#0D0703]">Không có đơn hàng nào đang chờ tiếp nhận</p>
          <p className="font-sans text-xs text-[#7B6E64] mt-1">
            Toàn bộ đơn hàng đã được phân công nhân viên phụ trách.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#D2C8BA] text-[10px] font-mono uppercase tracking-widest text-[#7B6E64]">
                <th className="py-3 px-4">Mã Đơn</th>
                <th className="py-3 px-4">Thời Gian Đặt</th>
                <th className="py-3 px-4">Khách Hàng</th>
                <th className="py-3 px-4">Số Dòng Hàng</th>
                <th className="py-3 px-4 text-right">Tổng Giá Trị</th>
                <th className="py-3 px-4 text-center">Tác Vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D2C8BA]/30 font-sans text-xs">
              {recentUnassigned.map((order) => (
                <tr key={order.id} className="hover:bg-white/60 transition-colors">
                  <td className="py-4 px-4 font-mono font-semibold text-[#0D0703]">
                    #AUR-2026-{String(order.id).padStart(4, '0')}
                  </td>
                  <td className="py-4 px-4 text-[#7B6E64]">
                    {new Date(order.orderDate).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-semibold text-[#0D0703] block">{order.customerName}</span>
                    <span className="text-[11px] text-[#7B6E64]">{order.customerEmail}</span>
                  </td>
                  <td className="py-4 px-4 text-[#7B6E64]">{order.itemCount} tác phẩm</td>
                  <td className="py-4 px-4 text-right font-serif font-medium text-sm text-[#0D0703]">
                    {formatVND(order.total)}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => onClaim(order.id)}
                      disabled={actionLoading === order.id}
                      className="px-3.5 py-1.5 bg-[#271E18] hover:bg-[#0D0703] text-[#FAF8F3] text-[10px] uppercase tracking-wider font-semibold rounded-[2px] transition-all disabled:opacity-50"
                    >
                      {actionLoading === order.id ? 'Đang nhận...' : 'Tiếp Nhận Đơn'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
