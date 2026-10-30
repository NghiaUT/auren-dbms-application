import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle,
  Truck,
  Hammer,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import type { OrderDetail, OrderStatus } from '../../../../types';

const STATUS_STEPS: Array<{ key: OrderStatus; label: string; icon: any }> = [
  { key: 'pending', label: 'Chờ duyệt', icon: Clock },
  { key: 'confirmed', label: 'Đã xác nhận', icon: CheckCircle },
  { key: 'in_production', label: 'Đang chế tác', icon: Hammer },
  { key: 'shipped', label: 'Đang vận chuyển', icon: Truck },
  { key: 'delivered', label: 'Đã bàn giao', icon: ShieldCheck },
];

export interface OrderStatusWorkflowProps {
  order: OrderDetail;
  actionLoading: boolean;
  onUpdateStatus: (targetStatus: OrderStatus, deliveryDate?: string | null) => void;
  onCancelOrder: (reason: string) => void;
  showCancelModal: boolean;
  onCloseCancelModal: () => void;
}

export const OrderStatusWorkflow: React.FC<OrderStatusWorkflowProps> = ({
  order,
  actionLoading,
  onUpdateStatus,
  onCancelOrder,
  showCancelModal,
  onCloseCancelModal,
}) => {
  const [showProductionModal, setShowProductionModal] = useState<boolean>(false);
  const [deliveryDateInput, setDeliveryDateInput] = useState<string>(
    order.deliveryDate ? order.deliveryDate.split('T')[0] : ''
  );
  const [cancelReason, setCancelReason] = useState<string>('');

  const getStepIndex = (status: OrderStatus) => {
    if (status === 'cancelled') return -1;
    return STATUS_STEPS.findIndex((s) => s.key === status);
  };

  const currentStepIdx = getStepIndex(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <>
      <section className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] p-6 md:p-8 mb-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#D2C8BA]/40">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-serif text-3xl font-medium text-[#0D0703]">
                Đơn Hàng #AUR-2026-{String(order.id).padStart(4, '0')}
              </h2>
              <span className="font-mono text-xs uppercase tracking-wider px-2.5 py-1 bg-[#271E18] text-[#FAF8F3] rounded-[1px]">
                {order.status}
              </span>
            </div>
            <p className="font-sans text-xs text-[#7B6E64] mt-1.5">
              Ngày đặt:{' '}
              {new Date(order.orderDate).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          {/* Khối Thao tác chuyển trạng thái kế tiếp */}
          {!isCancelled && order.status !== 'delivered' && (
            <div className="flex flex-wrap items-center gap-3">
              {order.status === 'confirmed' && (
                <button
                  onClick={() => setShowProductionModal(true)}
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-[#271E18] hover:bg-[#0D0703] text-[#FAF8F3] text-xs font-semibold uppercase tracking-wider rounded-[2px] transition-all shadow-sm"
                >
                  1. Chuyển Sang Chế Tác (In Production) →
                </button>
              )}

              {order.status === 'in_production' && (
                <button
                  onClick={() => onUpdateStatus('shipped')}
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-[#271E18] hover:bg-[#0D0703] text-[#FAF8F3] text-xs font-semibold uppercase tracking-wider rounded-[2px] transition-all shadow-sm"
                >
                  2. Xuất Kho Vận Chuyển White-Glove (Shipped) →
                </button>
              )}

              {order.status === 'shipped' && (
                <button
                  onClick={() => onUpdateStatus('delivered')}
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-[#246A38] hover:bg-[#1C532C] text-[#FAF8F3] text-xs font-semibold uppercase tracking-wider rounded-[2px] transition-all shadow-sm"
                >
                  3. Xác Nhận Bàn Giao Thành Công (Delivered) ✓
                </button>
              )}
            </div>
          )}
        </div>

        {/* Stepper Quy trình điều phối */}
        {!isCancelled ? (
          <div className="pt-6">
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#7B6E64] block mb-4">
              Tiến Trình Chế Tác &amp; Bàn Giao White-Glove
            </span>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {STATUS_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isDone = currentStepIdx >= idx;
                const isCurrent = currentStepIdx === idx;

                return (
                  <div
                    key={step.key}
                    className={`p-3 rounded-[2px] border transition-all ${
                      isCurrent
                        ? 'bg-[#271E18] text-[#FAF8F3] border-[#271E18]'
                        : isDone
                        ? 'bg-white text-[#0D0703] border-[#246A38]/40'
                        : 'bg-white/40 text-[#7B6E64]/60 border-[#D2C8BA]/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon
                        className={`w-3.5 h-3.5 ${
                          isCurrent
                            ? 'text-[#A7824B]'
                            : isDone
                            ? 'text-[#246A38]'
                            : 'text-[#7B6E64]/60'
                        }`}
                      />
                      <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
                        0{idx + 1}
                      </span>
                    </div>
                    <span className="text-xs font-medium block truncate">{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="pt-6 flex items-center gap-3 text-[#BA1A1A]">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold text-xs uppercase tracking-wider">
              Đơn hàng này đã bị huỷ bỏ. Toàn bộ tồn kho đã được hoàn trả.
            </span>
          </div>
        )}
      </section>

      {/* Modal: Chuyển sang In Production */}
      {showProductionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] max-w-md w-full p-6 shadow-xl">
            <h4 className="font-serif text-xl text-[#0D0703] mb-2">Chuyển Sang Chế Tác Atelier</h4>
            <p className="font-sans text-xs text-[#7B6E64] mb-4">
              Vui lòng chỉ định ngày bàn giao dự kiến hoàn thành mộng gỗ và lắp đặt White-Glove.
            </p>

            <div className="mb-4">
              <label className="block text-xs uppercase font-mono tracking-wider text-[#7B6E64] mb-1">
                Ngày bàn giao dự kiến (Estimated Delivery Date)
              </label>
              <input
                type="date"
                value={deliveryDateInput}
                onChange={(e) => setDeliveryDateInput(e.target.value)}
                className="w-full p-2.5 bg-white border border-[#D2C8BA] rounded-[2px] text-xs font-sans text-[#0D0703] focus:outline-none focus:border-[#271E18]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowProductionModal(false)}
                className="px-4 py-2 border border-[#D2C8BA] text-xs uppercase tracking-wider rounded-[2px] text-[#7B6E64] hover:text-[#0D0703]"
              >
                Huỷ bỏ
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => onUpdateStatus('in_production', deliveryDateInput || null)}
                className="px-4 py-2 bg-[#271E18] text-[#FAF8F3] text-xs uppercase tracking-wider font-semibold rounded-[2px] hover:bg-[#0D0703] transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Đang cập nhật...' : 'Xác Nhận Bắt Đầu Chế Tác'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Huỷ đơn hàng */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[#FAF8F3] border border-[#BA1A1A]/30 rounded-[2px] max-w-md w-full p-6 shadow-xl">
            <h4 className="font-serif text-xl text-[#BA1A1A] mb-2">Xác Nhận Huỷ Đơn Hàng</h4>
            <p className="font-sans text-xs text-[#7B6E64] mb-4">
              Hành động này sẽ giải phóng toàn bộ số serial giới hạn và hoàn trả số lượng tồn kho
              trở lại kho hàng.
            </p>

            <div className="mb-4">
              <label className="block text-xs uppercase font-mono tracking-wider text-[#7B6E64] mb-1">
                Lý do huỷ đơn hàng
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="VD: Khách hàng đổi ý, không phù hợp không gian..."
                className="w-full p-2.5 bg-white border border-[#D2C8BA] rounded-[2px] text-xs font-sans text-[#0D0703] focus:outline-none focus:border-[#BA1A1A]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onCloseCancelModal}
                className="px-4 py-2 border border-[#D2C8BA] text-xs uppercase tracking-wider rounded-[2px] text-[#7B6E64] hover:text-[#0D0703]"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => onCancelOrder(cancelReason)}
                className="px-4 py-2 bg-[#BA1A1A] text-[#FAF8F3] text-xs uppercase tracking-wider font-semibold rounded-[2px] hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Đang huỷ...' : 'Chấp Nhận Huỷ Đơn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
