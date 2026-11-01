// ============================================================================
// File: frontend/src/components/common/Toast/ToastItem.tsx
// Vai trò: Component hiển thị từng thông báo Toast đơn lẻ với phong cách Atelier Luxury:
//          - Tự động đóng theo thời gian (duration)
//          - Tạm dừng đếm ngược khi người dùng rê chuột vào (Pause on hover)
//          - Hỗ trợ hiển thị tiêu đề, nội dung chính và danh sách lỗi chi tiết (details)
// ============================================================================

import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  details?: string[];
  duration?: number;
}

interface ToastItemProps {
  toast: ToastData;
  onClose: (id: string) => void;
}

export const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const duration = toast.duration ?? 4500;
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(duration);

  useEffect(() => {
    if (duration <= 0) return;

    if (isPaused) {
      return;
    }

    startTimeRef.current = Date.now();
    const interval = 50; // Cập nhật progress mỗi 50ms

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newRemaining = Math.max(0, remainingTimeRef.current - elapsed);
      const pct = (newRemaining / duration) * 100;
      setProgress(pct);

      if (newRemaining <= 0) {
        clearInterval(timer);
        onClose(toast.id);
      }
    }, interval);

    return () => {
      clearInterval(timer);
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
    };
  }, [isPaused, duration, toast.id, onClose]);

  // Cấu hình bảng màu & Icon theo từng trạng thái
  const config = {
    success: {
      border: 'border-[#3D6946]/70',
      bg: 'bg-[#141A15]',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
      titleColor: 'text-emerald-300',
      progressBar: 'bg-emerald-500',
    },
    error: {
      border: 'border-[#BA1A1A]/70',
      bg: 'bg-[#221313]',
      icon: <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />,
      titleColor: 'text-red-300',
      progressBar: 'bg-red-500',
    },
    warning: {
      border: 'border-[#B47818]/70',
      bg: 'bg-[#1F1911]',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
      titleColor: 'text-amber-300',
      progressBar: 'bg-amber-500',
    },
    info: {
      border: 'border-[#A58548]/70',
      bg: 'bg-[#181614]',
      icon: <Info className="w-5 h-5 text-[#D4B272] shrink-0 mt-0.5" />,
      titleColor: 'text-[#E2C792]',
      progressBar: 'bg-[#A58548]',
    },
  }[toast.type];

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative w-full sm:w-[380px] p-4 rounded-[2px] shadow-2xl border ${config.border} ${config.bg} text-[#FAF8F3] overflow-hidden transition-all duration-300 hover:shadow-black/60`}
      style={{ animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      <div className="flex items-start gap-3">
        {config.icon}

        <div className="flex-1 min-w-0 pr-2">
          {toast.title && (
            <h4 className={`font-serif text-sm font-semibold tracking-wide ${config.titleColor} mb-0.5 truncate`}>
              {toast.title}
            </h4>
          )}
          <p className="font-sans text-xs text-[#FAF8F3]/90 leading-relaxed break-words">
            {toast.message}
          </p>

          {/* Chi tiết lỗi dạng danh sách (nếu có từ Zod) */}
          {toast.details && toast.details.length > 0 && (
            <ul className="mt-2 pl-3 border-l border-[#FAF8F3]/20 space-y-1">
              {toast.details.map((detail, idx) => (
                <li key={idx} className="font-mono text-[11px] text-[#FAF8F3]/75 break-words">
                  • {detail}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={() => onClose(toast.id)}
          className="text-[#FAF8F3]/50 hover:text-[#FAF8F3] p-1 rounded-[2px] transition-colors -mr-1 -mt-1"
          title="Đóng thông báo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Thanh tiến trình tự động đóng (Progress bar) */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10">
          <div
            className={`h-full ${config.progressBar} transition-all duration-75 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
