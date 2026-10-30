// ============================================================================
// File: frontend/src/components/common/ChartCard/ChartCard.tsx
// Vai trò: Component khung biểu đồ (bọc Recharts) phục vụ hiển thị biểu đồ cột,
//          biểu đồ đường doanh thu và thống kê trên các màn hình báo cáo Admin (A01-A04).
// ============================================================================

import React from 'react';

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  className = '',
  action,
}) => {
  return (
    <div className={`bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] p-6 shadow-xs ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-serif text-lg font-medium text-[#0D0703]">{title}</h3>
          {subtitle && <p className="font-sans text-xs text-[#7B6E64] mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="w-full">{children}</div>
    </div>
  );
};
