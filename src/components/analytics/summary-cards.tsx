'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import styles from './summary-cards.module.css';

function formatSeconds(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function SummaryCards() {
  const [data, setData] = useState<{
    totalTasks: number;
    pendingTasks: number;
    activeTasks: number;
    pausedTasks: number;
    completedTasks: number;
    totalTrackedSeconds: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.analytics.summary();
        if (!cancelled) setData(res.data || null);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className={styles.loading}>Loading summary...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;
  if (!data) return <div className={styles.empty}>No data</div>;

  return (
    <div className={styles.summaryGrid}>
      <div className={styles.summaryCard}><div className={styles.label}>Total Tasks</div><div className={styles.value}>{data.totalTasks}</div></div>
      <div className={styles.summaryCard}><div className={styles.label}>Pending</div><div className={styles.value}>{data.pendingTasks}</div></div>
      <div className={styles.summaryCard}><div className={styles.label}>Active</div><div className={styles.value}>{data.activeTasks}</div></div>
      <div className={styles.summaryCard}><div className={styles.label}>Paused</div><div className={styles.value}>{data.pausedTasks}</div></div>
      <div className={styles.summaryCard}><div className={styles.label}>Completed</div><div className={styles.value}>{data.completedTasks}</div></div>
      <div className={`${styles.summaryCard} ${styles.highlight}`}><div className={styles.label}>Tracked Time</div><div className={styles.value}>{formatSeconds(data.totalTrackedSeconds)}</div></div>
    </div>
  );
}
