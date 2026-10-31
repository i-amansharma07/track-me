'use client';

import { type ReactNode } from 'react';
import styles from './card.module.css';

export type CardProps = {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated';
}

export function Card({ children, className = '', variant = 'default' }: CardProps) {
  const variantClass = variant === 'elevated' ? styles.elevated : styles.default;
  return (
    <article className={`${styles.card} ${variantClass} ${className}`.trim()}>
      {children}
    </article>
  );
}
