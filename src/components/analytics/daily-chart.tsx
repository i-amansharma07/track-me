'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import styles from './daily-chart.module.css';

export type DailyPoint = {
  date: string;
  totalTrackedSeconds: number;
  completedTasks: number;
  workSessions: number;
};

export function DailyChart({ start, end }: { start?: string; end?: string }) {
  const [data, setData] = useState<DailyPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.analytics.daily(start, end);
        if (!cancelled) setData(res.data || []);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [start, end]);

  if (loading) return <div className={styles.loading}>Loading daily data...</div>;
  if (data.length === 0) return <div className={styles.empty}>No daily data available.</div>;

  const maxSec = Math.max(...data.map((d) => d.totalTrackedSeconds), 60);

  return (
    <div className={styles.chartWrapper}>
      <h3 className={styles.title}>Daily Tracked Time</h3>
      <div className={styles.chart} aria-label="Daily tracked time chart">
        <svg viewBox={`0 0 ${Math.max(data.length * 60, 200)} 180`} preserveAspectRatio="none" role="img">
          {data.map((d, i) => {
            const x = i * 60 + 30;
            const h = Math.max((d.totalTrackedSeconds / maxSec) * 120, 4);
            const y = 120 - h;
            return (
              <g key={d.date}>
                <rect x={x - 15} y={y} width={30} height={h} fill="var(--color-accent)" rx={4} />
                <text x={x} y={140} textAnchor="middle" fontSize="10" fill="var(--color-text-muted)">{d.date.slice(5)}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className={styles.legend}>
        {data.map((d) => (
          <div key={d.date} className={styles.legendItem}>
            <span className={styles.dot} />
            <span className={styles.legendLabel}>{d.date}: {Math.round(d.totalTrackedSeconds / 60)}m</span>
          </div>
        ))}
      </div>
    </div>
  );
}
