import { createContext, useContext, useState, useCallback, useRef } from 'react';

export type ToastType = 'error' | 'success' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toasts: Toast[];
  show: (message: string, type?: ToastType) => void;
  error: (message: string) => void;
  success: (message: string) => void;
  info: (message: string) => void;
  remove: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, number>>({});

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      window.clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const show = useCallback((message: string, type: ToastType = 'error') => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    timers.current[id] = window.setTimeout(() => remove(id), 4000);
  }, [remove]);

  const error = useCallback((message: string) => show(message, 'error'), [show]);
  const success = useCallback((message: string) => show(message, 'success'), [show]);
  const info = useCallback((message: string) => show(message, 'info'), [show]);

  return (
    <ToastContext.Provider value={{ toasts, show, error, success, info, remove }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
