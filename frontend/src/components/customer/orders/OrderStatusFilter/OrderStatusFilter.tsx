import React from 'react';

const FILTER_TABS = [
  { label: 'Tất cả đơn', value: '' },
  { label: 'Chờ duyệt', value: 'pending' },
  { label: 'Đã xác nhận', value: 'confirmed' },
  { label: 'Đang chế tác', value: 'in_production' },
  { label: 'Đang vận chuyển', value: 'shipped' },
  { label: 'Đã bàn giao', value: 'delivered' },
  { label: 'Đã hủy', value: 'cancelled' },
];

export interface OrderStatusFilterProps {
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
}

export const OrderStatusFilter: React.FC<OrderStatusFilterProps> = ({
  selectedStatus,
  onSelectStatus,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-[#D2C8BA]/50 pb-4">
      {FILTER_TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onSelectStatus(tab.value)}
          className={`px-3.5 py-1.5 font-sans text-xs uppercase tracking-wider rounded-[2px] transition-colors ${
            selectedStatus === tab.value
              ? 'bg-[#271E18] text-[#FAF8F3] font-semibold'
              : 'bg-[#FAF8F3] text-[#7B6E64] hover:text-[#0D0703] border border-[#D2C8BA]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
