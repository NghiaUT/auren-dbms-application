// ============================================================================
// File: frontend/src/components/common/ConfirmDialog/ConfirmDialog.tsx
// Vai trò: Hộp thoại xác nhận thao tác quan trọng (Huỷ đơn, Xoá sản phẩm/biến thể, Đánh dấu quá hạn)
// ============================================================================

import React from 'react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Huỷ',
  isDestructive = false,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#271E18]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF8F3] max-w-md w-full border border-[#D2C8BA] rounded-[2px] p-6 shadow-xl space-y-4">
        <h3 className="font-serif text-xl text-[#0D0703]">{title}</h3>
        <p className="font-sans text-xs text-[#4E4540] leading-relaxed">{message}</p>
        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 border border-[#D2C8BA] text-xs font-sans uppercase tracking-wider text-[#7B6E64] hover:bg-white transition-colors rounded-[2px]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-xs font-sans uppercase tracking-wider rounded-[2px] transition-colors ${
              isDestructive
                ? 'bg-[#A93226] text-white hover:bg-[#922B21]'
                : 'bg-[#271E18] text-[#FAF8F3] hover:bg-[#0D0703]'
            }`}
          >
            {loading ? 'Đang xử lý...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
