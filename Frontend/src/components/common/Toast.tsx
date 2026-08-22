import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useNotification, ToastMessage } from '../../context/NotificationContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useNotification();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-brand-500 shrink-0" />,
  };

  const bgBorderMap = {
    success: 'border-emerald-200 bg-white/95 shadow-emerald-900/5',
    error: 'border-rose-200 bg-white/95 shadow-rose-900/5',
    warning: 'border-amber-200 bg-white/95 shadow-amber-900/5',
    info: 'border-brand-200 bg-white/95 shadow-brand-900/5',
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-card border shadow-lg backdrop-blur-sm transition-all duration-300 transform translate-y-0 ${bgBorderMap[toast.type]}`}
    >
      {iconMap[toast.type]}
      <div className="flex-1 min-w-0">
        {toast.title && <h4 className="text-xs font-bold text-ink-primary uppercase tracking-wider mb-0.5">{toast.title}</h4>}
        <p className="text-sm text-ink-secondary">{toast.message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="text-ink-muted hover:text-ink-primary p-0.5 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
