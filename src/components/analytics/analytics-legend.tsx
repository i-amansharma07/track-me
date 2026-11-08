"use client";

import { useEffect, useMemo, useState } from "react";
import type { AnalyticsTask, AnalyticsTimelineSegment } from "@/lib/api";
import { formatSeconds } from "./analytics-utils";
import styles from "./analytics-legend.module.css";

type Props = {
  tasks: AnalyticsTask[];
  timeline: AnalyticsTimelineSegment[];
  colorMap: Record<string, string>;
  trackedPercentage: number;
};

export function AnalyticsLegend({ tasks, timeline, colorMap, trackedPercentage }: Props) {
  const defaultId = useMemo(() => {
    const first = timeline.find((s) => s.type === "task" && tasks.some((t) => t.id === s.taskId));
    return first && first.type === "task" ? first.taskId : tasks[0]?.id ?? null;
  }, [timeline, tasks]);

  const [selectedId, setSelectedId] = useState<string | null>(defaultId);

  useEffect(() => {
    if (!selectedId || !tasks.some((t) => t.id === selectedId)) {
      setSelectedId(defaultId);
    }
  }, [selectedId, tasks, defaultId]);

  if (tasks.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyTitle}>No tracked activity</div>
        <div className={styles.emptyText}>Sessions recorded for this day will appear here.</div>
      </div>
    );
  }

  const selected = tasks.find((t) => t.id === selectedId) ?? tasks[0];

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span>Tasks</span>
        <span>{trackedPercentage.toFixed(2)}% tracked</span>
      </div>
      <div className={styles.palette} role="tablist" aria-label="Task colors">
        {tasks.map((task) => {
          const active = task.id === selected.id;
          return (
            <button
              key={task.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={task.title}
              title={task.title}
              className={`${styles.swatchBtn} ${active ? styles.swatchActive : ""}`.trim()}
              style={{ backgroundColor: colorMap[task.id] }}
              onClick={() => setSelectedId(task.id)}
            />
          );
        })}
      </div>
      <div className={styles.detail} role="tabpanel">
        <div className={styles.top}>
          <span className={styles.swatch} style={{ backgroundColor: colorMap[selected.id] }} aria-hidden="true" />
          <span className={styles.title} title={selected.title}>{selected.title}</span>
          <span className={styles.pct}>{selected.percentageOfDay.toFixed(2)}%</span>
        </div>
        <div className={styles.meta}>
          <span>{formatSeconds(selected.totalDurationSeconds)}</span>
          {selected.tag && <span className={styles.tag}>{selected.tag}</span>}
          <span>{selected.sessionCount} session{selected.sessionCount === 1 ? "" : "s"}</span>
          {selected.sessions.some((s) => s.isOngoing) && <span className={styles.live}>Ongoing</span>}
        </div>
        <div className={styles.barTrack} aria-hidden="true">
          <div
            className={styles.barFill}
            style={{ width: `${Math.min(100, selected.percentageOfDay)}%`, backgroundColor: colorMap[selected.id] }}
          />
        </div>
      </div>
    </div>
  );
}
