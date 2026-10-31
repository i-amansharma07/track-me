'use client';

import { forwardRef } from 'react';
import styles from './select.module.css';

export type SelectProps = {
  label?: string;
  error?: string;
  options?: { value: string; label: string }[];
} & React.SelectHTMLAttributes<HTMLSelectElement>

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...rest }, ref) => {
    const hasError = !!error;
    return (
      <div className={`${styles.wrapper} ${className}`.trim()}>
        {label && <label htmlFor={rest.id || rest.name} className={styles.label}>{label}</label>}
        <div className={styles.selectWrapper}>
          <select
            ref={ref}
            className={`${styles.select} ${hasError ? styles.error : ''}`.trim()}
            aria-invalid={hasError}
            {...rest}
          >
            {rest.children || (
              options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            )}
          </select>
        </div>
        {error && <span className={styles.errorText} role="alert">{error}</span>}
      </div>
    );
  }
);
Select.displayName = 'Select';
