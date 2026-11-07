"use client";

import type { AnalyticsTimelineSegment } from "@/lib/api";
import { formatMinuteLabel, segmentTitle } from "./analytics-utils";
import styles from "./analytics-timeline.module.css";

type Props = {
  timeline: AnalyticsTimelineSegment[];
  dayDurationMinutes: number;
  colorMap: Record<string, string>;
};

const HOUR_MARKS = [0, 3, 6, 9, 12, 15, 18, 21, 24];

export function AnalyticsTimeline({ timeline, dayDurationMinutes, colorMap }: Props) {
  const dayMin = dayDurationMinutes || 1440;
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
            return (
              <div
                key={`${seg.type}-${i}-${seg.startMinute}`}
                className={`${styles.segment} ${isTask ? styles.task : styles.untracked} ${seg.isOngoing ? styles.ongoing : ""}`.trim()}
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
