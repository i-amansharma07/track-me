'use client';

import { useRef, useState, useEffect } from 'react';
import styles from './dropdown.module.css';

export type DropdownOption = {
  label: string;
  value: string;
  onClick?: () => void;
}

export type DropdownProps = {
  trigger: React.ReactNode;
  options: DropdownOption[];
  align?: 'left' | 'right';
}

export function Dropdown({ trigger, options, align = 'right' }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      window.addEventListener('mousedown', handle);
    }
    return () => window.removeEventListener('mousedown', handle);
  }, [open]);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [open]);

  return (
    <div ref={ref} className={styles.wrapper}>
      <button
        className={styles.trigger}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={open}
        type="button"
      >
        {trigger}
      </button>
      {open && (
        <div className={`${styles.menu} ${align === 'left' ? styles.alignLeft : styles.alignRight}`} role="menu">
          {options.map((opt, i) => (
            <button
              key={opt.value || i}
              className={styles.item}
              onClick={() => {
                opt.onClick?.();
                setOpen(false);
              }}
              role="menuitem"
              tabIndex={0}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
