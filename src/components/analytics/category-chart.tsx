'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import styles from './category-chart.module.css';

export type CategoryPoint = {
  tag: string;
  totalTrackedSeconds: number;
};

export function CategoryChart() {
  const [data, setData] = useState<CategoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.analytics.categories();
        if (!cancelled) setData(res.data || []);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className={styles.loading}>Loading categories...</div>;
  if (data.length === 0) return <div className={styles.empty}>No category data available.</div>;

  const maxSec = Math.max(...data.map((d) => d.totalTrackedSeconds), 60);
  const colors = ['#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

  return (
    <div className={styles.chartWrapper}>
      <h3 className={styles.title}>Category Tracked Time</h3>
      <div className={styles.bars}>
        {data.map((d, i) => (
          <div key={d.tag} className={styles.barGroup}>
            <div className={styles.barLabel}>{d.tag}</div>
            <div className={styles.barBackground}>
              <div
                className={styles.barFill}
                style={{ width: `${(d.totalTrackedSeconds / maxSec) * 100}%`, backgroundColor: colors[i % colors.length] }}
              />
            </div>
            <div className={styles.barValue}>{Math.round(d.totalTrackedSeconds / 60)}m</div>
          </div>
        ))}
      </div>
    </div>
  );
}
