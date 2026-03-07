import { ReactNode, useCallback, useMemo, useState } from 'react';
import { cn } from '@/lib';
import { ToastContext, ToastInput, ToastVariant } from './toast-context';

type Toast = ToastInput & {
  id: string;
};

const variantClassMap: Record<ToastVariant, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-slate-200 bg-white text-slate-900',
};

/**
 * Provide lightweight global toast notifications.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: ToastInput) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, variant: 'info', ...toast }]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3500);
  }, []);

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              'rounded-md border px-3 py-2 text-sm shadow-md',
              variantClassMap[toast.variant ?? 'info'],
            )}>
            <p className="font-semibold">{toast.title}</p>
            {toast.description && <p className="mt-1">{toast.description}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
