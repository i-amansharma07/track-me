"use client";

import { ReactNode } from "react";
import { ActiveTaskDisplay } from "@/components/tasks/active-task";
import styles from "./layout.module.css";

export type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className={styles.layout} suppressHydrationWarning>
      <div className={styles.contentArea}>
        <ActiveTaskDisplay />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
