'use client';

import { createPortal } from 'react-dom';

export interface ToastItem {
  id: string;
  message: string;
}

interface ToastViewportProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  if (toasts.length === 0) return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-[20px] right-[20px] z-[100] flex flex-col gap-[8px] items-end"
      style={{ pointerEvents: 'none' }}
    >
      {toasts.map(toast => (
        <button
          key={toast.id}
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="font-ui text-[13px] text-ink bg-paper border border-chalk rounded-[10px] shadow-[var(--shadow-2)] px-[14px] py-[10px] max-w-[320px] text-left cursor-pointer transition-opacity duration-150 hover:opacity-90"
          style={{ pointerEvents: 'auto' }}
        >
          {toast.message}
        </button>
      ))}
    </div>,
    document.body,
  );
}
