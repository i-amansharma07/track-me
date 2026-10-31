'use client';

import { forwardRef, type ReactNode } from 'react';
import styles from './button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading = false, children, className = '', disabled, ...rest }, ref) => {
    const variantClass = styles[variant] || styles.primary;
    const sizeClass = styles[size] || styles.md;
    return (
      <button
        ref={ref}
        className={`${styles.button} ${variantClass} ${sizeClass} ${isLoading ? styles.loading : ''} ${className}`.trim()}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...rest}
      >
        {isLoading && <span className={styles.spinner} aria-hidden="true" />}
        <span className={isLoading ? styles.contentHidden : ''}>{children}</span>
      </button>
    );
  }
);
Button.displayName = 'Button';
