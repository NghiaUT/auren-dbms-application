// ============================================================================
// File: frontend/src/components/common/DataTable/DataTable.tsx
// Vai trò: Component bảng chuẩn hóa phong cách kiến trúc AUREN
// ============================================================================

import React from 'react';

export interface Column<T> {
  header: string;
  accessor?: keyof T;
  render?: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyMessage = 'Không có dữ liệu hiển thị.',
  className = '',
}: DataTableProps<T>): React.ReactElement {
  return (
    <div className={`overflow-x-auto border border-[#D2C8BA] rounded-[2px] bg-[#FAF8F3] ${className}`}>
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-[#D2C8BA] bg-[#F4EFE6]/70 text-[#7B6E64] font-sans uppercase tracking-wider text-[10px]">
            {columns.map((col, idx) => (
              <th key={idx} className={`py-3.5 px-4 font-semibold ${col.headerClassName || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#D2C8BA]/40 font-sans">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-[#7B6E64]">
                Đang nạp dữ liệu...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-[#7B6E64]">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={keyExtractor(row)} className="hover:bg-white/60 transition-colors">
                {columns.map((col, idx) => (
                  <td key={idx} className={`py-3.5 px-4 ${col.className || ''}`}>
                    {col.render ? col.render(row) : (col.accessor ? String(row[col.accessor] ?? '') : null)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
