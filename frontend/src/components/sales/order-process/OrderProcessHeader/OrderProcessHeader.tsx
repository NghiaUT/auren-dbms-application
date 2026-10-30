import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Ban } from 'lucide-react';
import type { OrderDetail } from '../../../../types';

export interface OrderProcessHeaderProps {
  order: OrderDetail;
  feedback: { text: string; type: 'success' | 'error' } | null;
  onClearFeedback: () => void;
  onOpenCancelModal: () => void;
}

export const OrderProcessHeader: React.FC<OrderProcessHeaderProps> = ({
  order,
  feedback,
  onClearFeedback,
  onOpenCancelModal,
}) => {
  return (
    <>
      {/* Navigation Breadcrumb */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/sales/orders?tab=my_orders"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-[#7B6E64] hover:text-[#0D0703] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại hàng đợi đơn</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to={`/sales/orders/${order.id}/payments`}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#D2C8BA] hover:border-[#271E18] text-[#0D0703] text-xs uppercase tracking-wider font-semibold rounded-[2px] transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5 text-[#A7824B]" />
            <span>Quản lý lịch thanh toán ({order.payments?.length || 0} đợt)</span>
          </Link>

          {(order.status === 'pending' || order.status === 'confirmed') && (
            <button
              type="button"
              onClick={onOpenCancelModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#BA1A1A]/30 text-[#BA1A1A] hover:bg-[#BA1A1A]/10 text-xs uppercase tracking-wider font-semibold rounded-[2px] transition-colors"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Huỷ đơn hàng</span>
            </button>
          )}
        </div>
      </div>

      {/* Thông báo thao tác */}
      {feedback && (
        <div
          className={`p-4 mb-6 text-xs uppercase tracking-wider font-semibold rounded-[2px] flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-[#EBF3ED] text-[#246A38] border-[#246A38]/30'
              : 'bg-[#FDF2F2] text-[#BA1A1A] border-[#BA1A1A]/30'
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={onClearFeedback} className="text-xs font-bold hover:opacity-75">
            ✕
          </button>
        </div>
      )}
    </>
  );
};
