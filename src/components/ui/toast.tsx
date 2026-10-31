'use client';

import { useEffect } from 'react';
import styles from './toast.module.css';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export type ToastProps = {
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onClose?: () => void;
  open?: boolean;
}

export function Toast({ message, variant = 'info', duration = 4000, onClose, open = true }: ToastProps) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [open, duration, onClose]);

  if (!open) return null;

  const variantClass = styles[variant] || styles.info;

  return (
    <div className={`${styles.toast} ${variantClass}`} role="status" aria-live="polite">
      <span className={styles.message}>{message}</span>
      <button
        className={styles.close}
        onClick={onClose}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}
