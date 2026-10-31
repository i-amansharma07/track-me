'use client';

import { forwardRef } from 'react';
import styles from './input.module.css';

export type InputProps = {
  label?: string;
  error?: string;
  helperText?: string;
} & React.InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...rest }, ref) => {
    const hasError = !!error;
    return (
      <div className={`${styles.wrapper} ${className}`.trim()}>
        {label && (
          <label htmlFor={rest.id || rest.name} className={styles.label}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`${styles.input} ${hasError ? styles.error : ''}`.trim()}
          aria-invalid={hasError}
          aria-describedby={helperText ? `${rest.id || rest.name}-helper` : undefined}
          {...rest}
        />
        {helperText && !error && (
          <span id={`${rest.id || rest.name}-helper`} className={styles.helper}>
            {helperText}
          </span>
        )}
        {error && (
          <span id={`${rest.id || rest.name}-error`} className={styles.errorText} role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
