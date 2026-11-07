"use client";

import type { DailyAnalyticsData } from "@/lib/api";
import { formatSeconds } from "./analytics-utils";
import styles from "./analytics-summary.module.css";

type Props = { data: DailyAnalyticsData };

export function AnalyticsSummary({ data }: Props) {
  const { summary } = data;
  const stats = [
    { label: "Tracked", value: formatSeconds(summary.totalTrackedSeconds), sub: `${summary.trackedPercentage.toFixed(1)}% of day` },
    { label: "Untracked", value: formatSeconds(summary.untrackedSeconds), sub: `${summary.untrackedPercentage.toFixed(1)}% of day` },
    { label: "Tasks", value: String(summary.totalTasks), sub: `${summary.totalSessions} sessions` },
  ];
  return (
    <div className={styles.grid}>
      {stats.map((s) => (
        <div key={s.label} className={styles.stat}>
          <div className={styles.label}>{s.label}</div>
          <div className={styles.value}>{s.value}</div>
          <div className={styles.sub}>{s.sub}</div>
        </div>
      ))}
      {data.warnings.length > 0 && (
        <div className={styles.warning} role="status">
          {data.warnings[0].message}
        </div>
      )}
    </div>
  );
}
