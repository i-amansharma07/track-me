"use client";

import { useMemo } from "react";
import type { AnalyticsTask, AnalyticsTimelineSegment } from "@/lib/api";
import { formatMinuteLabel, segmentTitle } from "./analytics-utils";
import styles from "./analytics-timeline.module.css";

type Props = {
  timeline: AnalyticsTimelineSegment[];
  tasks: AnalyticsTask[];
  dayDurationMinutes: number;
  colorMap: Record<string, string>;
  selectedTaskId?: string | null;
};

const HOUR_MARKS = [0, 3, 6, 9, 12, 15, 18, 21, 24];

export function AnalyticsTimeline({ timeline, tasks, dayDurationMinutes, colorMap, selectedTaskId }: Props) {
  const dayMin = dayDurationMinutes || 1440;
  const selected = useMemo(() => tasks.find((t) => t.id === selectedTaskId) ?? null, [tasks, selectedTaskId]);
  const selectedAnchor = useMemo(() => {
    if (!selectedTaskId) return null;
    let best: { top: number } | null = null;
    for (const seg of timeline) {
      if (seg.type !== "task" || seg.taskId !== selectedTaskId) continue;
      const bottom = (seg.startMinute / dayMin) * 100;
      const height = (seg.durationMinutes / dayMin) * 100;
      const top = 100 - bottom - Math.max(height, 0.15);
      const mid = top + Math.max(height, 0.15) / 2;
      if (!best || height > 0) {
        // prefer largest visible segment; fall back to first
        if (!best) best = { top: mid };
        else best = { top: Math.min(best.top, mid) };
      }
    }
    if (best) return best;
    const first = timeline.find((s) => s.type === "task" && s.taskId === selectedTaskId);
    if (!first || first.type !== "task") return null;
    return { top: 100 - ((first.startMinute + first.durationMinutes / 2) / dayMin) * 100 };
  }, [timeline, selectedTaskId, dayMin]);

  return (
    <div className={styles.wrap}>
      <div className={styles.axis} aria-hidden="true">
        {HOUR_MARKS.map((h) => {
          const minute = (h / 24) * dayMin;
          const bottom = (minute / dayMin) * 100;
          return (
            <div key={h} className={styles.tick} style={{ bottom: `${Math.min(100, bottom)}%` }}>
              <span className={styles.tickLabel}>{formatMinuteLabel(minute >= dayMin ? dayMin - 1 : minute)}</span>
              <span className={styles.tickLine} />
            </div>
          );
        })}
      </div>
      <div className={styles.cylinder} role="img" aria-label="24-hour activity timeline">
        <div className={styles.cylinderInner}>
          {timeline.map((seg, i) => {
            const height = (seg.durationMinutes / dayMin) * 100;
            const bottom = (seg.startMinute / dayMin) * 100;
            const isTask = seg.type === "task";
            const color = isTask ? colorMap[seg.taskId] : undefined;
            const isSelected = isTask && selectedTaskId === seg.taskId;
            const isDimmed = Boolean(selectedTaskId) && isTask && !isSelected;
            return (
              <div
                key={`${seg.type}-${i}-${seg.startMinute}`}
                className={`${styles.segment} ${isTask ? styles.task : styles.untracked} ${seg.isOngoing ? styles.ongoing : ""} ${isSelected ? styles.selected : ""} ${isDimmed ? styles.dimmed : ""}`.trim()}
                style={{
                  bottom: `${bottom}%`,
                  height: `${Math.max(height, 0.15)}%`,
                  backgroundColor: color,
                }}
                title={segmentTitle(seg)}
              >
                {isTask && height > 6 && <span className={styles.segmentLabel}>{seg.taskTitle}</span>}
                {seg.isOngoing && <span className={styles.ongoingDot} aria-label="Ongoing" />}
              </div>
            );
          })}
          {selected && selectedAnchor && (
            <div
              className={styles.tooltip}
              style={{
                top: `clamp(18px, ${selectedAnchor.top}%, calc(100% - 18px))`,
                ["--tip-color" as string]: colorMap[selected.id],
              }}
              role="status"
              aria-live="polite"
            >
              <span className={styles.tooltipDot} aria-hidden="true" />
              <span className={styles.tooltipText}>{selected.title}</span>
            </div>
          )}
        </div>
        <div className={styles.glass} aria-hidden="true" />
      </div>
      <div className={styles.ends}>
        <span>12:00 AM (next)</span>
        <span>12:00 AM</span>
      </div>
    </div>
  );
}
