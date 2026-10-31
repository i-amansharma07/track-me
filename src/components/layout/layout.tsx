'use client';

import { ReactNode } from 'react';
import { Sidebar } from './nav';
import { Header } from './header';
import { ActiveTaskDisplay } from '@/components/tasks/active-task';
import styles from './layout.module.css';

export type AppLayoutProps = {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className={styles.layout}>
      <aside className={styles.aside} aria-label="Sidebar">
        <Sidebar />
      </aside>
      <div className={styles.contentArea}>
        <Header />
        <ActiveTaskDisplay />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
