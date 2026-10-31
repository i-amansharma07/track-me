'use client';

import { ReactNode, useState } from 'react';
import { Sidebar } from './nav';
import { Header } from './header';
import { ActiveTaskDisplay } from '@/components/tasks/active-task';
import styles from './layout.module.css';

export type AppLayoutProps = {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className={styles.layout}>
      <aside className={`${styles.aside} ${mobileOpen ? styles.open : ''}`} aria-label="Sidebar">
        <Sidebar />
      </aside>
      {mobileOpen && <div className={styles.overlay} onClick={() => setMobileOpen(false)} aria-hidden="true" />}
      <div className={styles.contentArea}>
        <Header mobileOpen={mobileOpen} onToggleMobile={() => setMobileOpen(!mobileOpen)} />
        <ActiveTaskDisplay />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
