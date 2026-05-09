import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const icons = {
  error: AlertCircle,
  success: CheckCircle,
  info: Info,
};

const styles = {
  error: 'bg-red-500/10 border-red-500/30 text-red-400',
  success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
};

export default function ToastContainer() {
  const { toasts, remove } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[99999] flex flex-col gap-2 w-[360px] max-w-[calc(100vw-2rem)]">
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm animate-in slide-in-from-right ${styles[toast.type]}`}
            style={{ animationDuration: '200ms' }}
          >
            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium flex-1 break-words">{toast.message}</p>
            <button
              onClick={() => remove(toast.id)}
              className="shrink-0 p-0.5 rounded hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
