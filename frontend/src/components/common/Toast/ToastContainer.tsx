// ============================================================================
// File: frontend/src/components/common/Toast/ToastContainer.tsx
// Vai trò: Khung chứa danh sách các Toast thông báo (Viewport Container)
//          - Cố định ở góc trên bên phải màn hình (fixed top-6 right-6 z-[9999])
//          - Cho phép click xuyên qua vùng trống (pointer-events-none)
//          - Giới hạn hiển thị tối đa 5 thông báo mới nhất để tránh tràn màn hình
// ============================================================================

import React from 'react';
import { ToastItem, ToastData } from './ToastItem';

interface ToastContainerProps {
  toasts: ToastData[];
  onClose: (id: string) => void;
  maxVisible?: number;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onClose,
  maxVisible = 5,
}) => {
  // Chỉ hiển thị tối đa `maxVisible` thông báo gần nhất
  const visibleToasts = toasts.slice(-maxVisible);

  if (visibleToasts.length === 0) {
    return null;
  }

  return (
    <aside
      aria-label="Thông báo hệ thống"
      className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-[calc(100vw-3rem)]"
    >
      {visibleToasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </aside>
  );
};
