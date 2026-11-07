"use client";

import type { AnalyticsTask } from "@/lib/api";
import { formatSeconds } from "./analytics-utils";
import styles from "./analytics-legend.module.css";

type Props = {
  tasks: AnalyticsTask[];
  colorMap: Record<string, string>;
  trackedPercentage: number;
};

export function AnalyticsLegend({ tasks, colorMap, trackedPercentage }: Props) {
  if (tasks.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyTitle}>No tracked activity</div>
        <div className={styles.emptyText}>Sessions recorded for this day will appear here.</div>
      </div>
    );
  }
  return (
    <div className={styles.list}>
      <div className={styles.header}>
        <span>Legend</span>
        <span>{trackedPercentage.toFixed(2)}% tracked</span>
      </div>
      {tasks.map((task) => (
        <div key={task.id} className={styles.item}>
          <div className={styles.top}>
            <span className={styles.swatch} style={{ backgroundColor: colorMap[task.id] }} aria-hidden="true" />
            <span className={styles.title} title={task.title}>{task.title}</span>
            <span className={styles.pct}>{task.percentageOfDay.toFixed(2)}%</span>
          </div>
          <div className={styles.meta}>
            <span>{formatSeconds(task.totalDurationSeconds)}</span>
            {task.tag && <span className={styles.tag}>{task.tag}</span>}
            <span>{task.sessionCount} session{task.sessionCount === 1 ? "" : "s"}</span>
            {task.sessions.some((s) => s.isOngoing) && <span className={styles.live}>Ongoing</span>}
          </div>
          <div className={styles.barTrack} aria-hidden="true">
            <div className={styles.barFill} style={{ width: `${Math.min(100, task.percentageOfDay)}%`, backgroundColor: colorMap[task.id] }} />
          </div>
        </div>
      ))}
    </div>
  );
}
