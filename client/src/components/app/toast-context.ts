import { createContext, useContext } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
};

export type ToastContextValue = {
  showToast: (toast: ToastInput) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Access global toast notifications API.
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
