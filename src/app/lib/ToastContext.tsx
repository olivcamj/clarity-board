'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { ToastViewport, type ToastItem } from '../ui/Toast';

const AUTO_DISMISS_MS = 5000;

interface ToastContextValue {
  push: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback((message: string) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message }]);
    const timer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    timers.current.set(id, timer);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
