'use client';

import { forwardRef } from 'react';
import styles from './textarea.module.css';

export type TextAreaProps = {
  label?: string;
  error?: string;
  helperText?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, helperText, className = '', ...rest }, ref) => {
    const hasError = !!error;
    return (
      <div className={`${styles.wrapper} ${className}`.trim()}>
        {label && <label htmlFor={rest.id || rest.name} className={styles.label}>{label}</label>}
        <textarea
          ref={ref}
          className={`${styles.textarea} ${hasError ? styles.error : ''}`.trim()}
          aria-invalid={hasError}
          {...rest}
        />
        {helperText && !error && <span className={styles.helper}>{helperText}</span>}
        {error && <span className={styles.errorText} role="alert">{error}</span>}
      </div>
    );
  }
);
TextArea.displayName = 'TextArea';
