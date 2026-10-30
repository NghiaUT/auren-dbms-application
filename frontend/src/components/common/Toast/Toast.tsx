// ============================================================================
// File: frontend/src/components/common/Toast/Toast.tsx
// Vai trò: Component hiển thị thông báo nổi (thành công, cảnh báo, lỗi)
// ============================================================================

import React from 'react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  onClose,
  className = '',
}) => {
  const icon = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  }[type];

  const colors = {
    success: 'border-[#2E7D32]/40 text-[#FAF8F3] bg-[#271E18]',
    error: 'border-[#C62828]/40 text-[#FAF8F3] bg-[#271E18]',
    warning: 'border-[#F57F17]/40 text-[#FAF8F3] bg-[#271E18]',
    info: 'border-[#A58548]/40 text-[#FAF8F3] bg-[#271E18]',
  }[type];

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 px-6 py-4 shadow-2xl flex items-center gap-4 rounded-[2px] border animate-slide-up ${colors} ${className}`}
    >
      <span className="text-[#A58548] text-xl font-bold">{icon}</span>
      <p className="font-sans text-xs font-medium">{message}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-3 text-xs text-[#FAF8F3]/60 hover:text-white"
        >
          ✕
        </button>
      )}
    </div>
  );
};
