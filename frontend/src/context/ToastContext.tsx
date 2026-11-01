// ============================================================================
// File: frontend/src/context/ToastContext.tsx
// Vai trò: Quản lý trạng thái và cung cấp Context/Hook cho hệ thống Toast toàn cục:
//          - Cung cấp hook `useToast()` với các hàm tiện ích: toast.success, toast.error, toast.warning, toast.info
//          - Tích hợp sâu với `formatApiError` để tự động bóc tách lỗi API chuẩn xác
//          - Lắng nghe sự kiện `app:toast` trên `window` cho phép kích hoạt toast từ các file non-React (như axiosClient)
//          - Tự động mount <ToastContainer /> tại gốc ứng dụng
// ============================================================================

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ToastContainer } from '../components/common/Toast/ToastContainer';
import { ToastData, ToastType } from '../components/common/Toast/ToastItem';
import { formatApiError } from '../utils/formatApiError';

export interface ToastOptions {
  title?: string;
  duration?: number;
  details?: string[];
}

export interface ToastContextValue {
  toasts: ToastData[];
  showToast: (toast: Omit<ToastData, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  toast: {
    success: (message: string, options?: ToastOptions) => string;
    error: (err: unknown, fallbackMessage?: string, options?: ToastOptions) => string;
    warning: (message: string, options?: ToastOptions) => string;
    info: (message: string, options?: ToastOptions) => string;
  };
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let toastCounter = 0;
const generateId = () => `toast_${Date.now()}_${++toastCounter}`;

/**
 * Tiện ích phát sự kiện Toast từ bất kỳ đâu (kể cả ngoài component React, ví dụ axiosClient)
 */
export function emitToast(data: Omit<ToastData, 'id'>): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:toast', { detail: data }));
  }
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback((toastData: Omit<ToastData, 'id'>): string => {
    const id = generateId();
    const newToast: ToastData = {
      ...toastData,
      id,
    };
    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  // Lắng nghe sự kiện toàn cục 'app:toast' (hữu ích cho axiosClient và các service không phải React)
  useEffect(() => {
    const handleGlobalToast = (event: Event) => {
      const customEvent = event as CustomEvent<Omit<ToastData, 'id'>>;
      if (customEvent.detail) {
        showToast(customEvent.detail);
      }
    };

    window.addEventListener('app:toast', handleGlobalToast);
    return () => {
      window.removeEventListener('app:toast', handleGlobalToast);
    };
  }, [showToast]);

  const success = useCallback(
    (message: string, options?: ToastOptions): string => {
      return showToast({
        type: 'success',
        title: options?.title || 'Thành công',
        message,
        details: options?.details,
        duration: options?.duration ?? 4000,
      });
    },
    [showToast],
  );

  const error = useCallback(
    (err: unknown, fallbackMessage?: string, options?: ToastOptions): string => {
      const formatted = formatApiError(err, fallbackMessage);
      const title =
        options?.title || (formatted.code ? `Lỗi: ${formatted.code}` : 'Thao tác không thành công');

      return showToast({
        type: 'error',
        title,
        message: formatted.message,
        details: options?.details || formatted.details,
        duration: options?.duration ?? 5000, // Lỗi giữ lâu hơn một chút để người dùng đọc
      });
    },
    [showToast],
  );

  const warning = useCallback(
    (message: string, options?: ToastOptions): string => {
      return showToast({
        type: 'warning',
        title: options?.title || 'Lưu ý',
        message,
        details: options?.details,
        duration: options?.duration ?? 4500,
      });
    },
    [showToast],
  );

  const info = useCallback(
    (message: string, options?: ToastOptions): string => {
      return showToast({
        type: 'info',
        title: options?.title || 'Thông tin',
        message,
        details: options?.details,
        duration: options?.duration ?? 4000,
      });
    },
    [showToast],
  );

  const contextValue: ToastContextValue = {
    toasts,
    showToast,
    removeToast,
    clearToasts,
    toast: {
      success,
      error,
      warning,
      info,
    },
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast phải được sử dụng bên trong ToastProvider.');
  }
  return context;
};
