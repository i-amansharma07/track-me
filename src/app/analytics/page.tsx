'use client';

import { AppLayout } from '@/components/layout/layout';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { SummaryCards } from '@/components/analytics/summary-cards';
import { DailyChart } from '@/components/analytics/daily-chart';
import { CategoryChart } from '@/components/analytics/category-chart';
import { DateFilter } from '@/components/analytics/date-filter';
import { useState } from 'react';
import styles from './analytics.module.css';

export default function AnalyticsPage() {
  const [range, setRange] = useState<{ start?: string; end?: string }>({});

  return (
    <ProtectedRoute>
      <AppLayout>
        <h1 className={styles.pageTitle}>Analytics</h1>
        <section className={styles.section}>
          <SummaryCards />
        </section>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Daily Activity</h2>
            <DateFilter onChange={(start, end) => setRange({ start, end })} />
          </div>
          <DailyChart start={range.start} end={range.end} />
        </section>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Category Distribution</h2>
          <CategoryChart />
        </section>
      </AppLayout>
    </ProtectedRoute>
  );
}
