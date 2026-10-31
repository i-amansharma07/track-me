'use client';

import { type ReactNode } from 'react';
import styles from './emptystate.module.css';

export type EmptyStateProps = {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title = 'No data', description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`${styles.container} ${className}`.trim()}>
      <div className={styles.content}>
        {title && <h3 className={styles.title}>{title}</h3>}
        {description && <p className={styles.description}>{description}</p>}
        {action && <div className={styles.action}>{action}</div>}
      </div>
    </div>
  );
}
