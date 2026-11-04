"use client";

import { useState } from "react";
import { TaskData } from "@/lib/api";
import { formatDate } from "@/lib/date";
import styles from "./task-card.module.css";

type Log = { id: string; startedAt: string; endedAt: string | null };

type TaskCardProps = {
  task: TaskData & {
    logs?: Log[];
    totalDurationSeconds?: number;
    longestDurationSeconds?: number;
  };
  onResume?: () => void;
  onComplete?: () => void;
  onStart?: () => void;
  onPause?: () => void;
  onMenuClick?: () => void;
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} sec`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function formatClock(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function TaskCard({
  task,
  onResume,
  onComplete,
  onStart,
  onPause,
  onMenuClick,
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const logs: Log[] = task.logs || [];

  const logDurations: number[] = logs.map((log) => {
    const started = new Date(log.startedAt).getTime();
    const ended = log.endedAt ? new Date(log.endedAt).getTime() : Date.now();
    return Math.max(0, Math.floor((ended - started) / 1000));
  });

  const totalDuration =
    task.totalDurationSeconds ?? logDurations.reduce((a, b) => a + b, 0);
  const longestDuration =
    task.longestDurationSeconds ??
    (logDurations.length > 0 ? Math.max(...logDurations) : 0);

  const isRunning = task.status === "active";
  const isPaused = task.status === "pause";
  const isPending = task.status === "pending";

  const statusDot = isRunning
    ? "bg-[#34d399]"
    : isPaused || isPending
      ? "bg-[#fbbf24]"
      : "bg-[#38bdf8]";

  const statusText = isRunning
    ? "text-[#34d399]"
    : isPaused || isPending
      ? "text-[#fbbf24]"
      : "text-[#38bdf8]";

  const statusLabel = isRunning ? "Running" : isPaused || isPending ? "Paused" : "Completed";

  const created = formatDate(task.createdAt);
  const totalText = formatDuration(totalDuration);

  const handlePrimaryAction = () => {
    if (isPaused) {
      onResume?.();
    } else if (isPending) {
      onStart?.();
    } else if (isRunning) {
      onPause?.();
    }
  };

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div className={styles.statusRow}>
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? "Collapse task" : "Expand task"}
            aria-expanded={expanded}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.chevron}
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <span className={`${styles.statusLabel} ${statusText}`}>
            <span className={`${styles.statusDot} ${statusDot}`} aria-hidden="true"></span>
            {statusLabel} · {task.tag || "Study"}
          </span>
          <button
            type="button"
            aria-label="More options"
            className={styles.kebabBtn}
            onClick={onMenuClick}
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className={styles.kebabIcon}
              aria-hidden="true"
            >
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
        </div>
        <h2 className={styles.title}>{task.title}</h2>
        <p className={styles.metaLine}>
          Created {created} · {totalText} logged
        </p>
      </div>

      <div
        className={`${styles.collapsible} ${expanded ? styles.expanded : ""}`}
      >
        <ul className={styles.sessionList}>
          {logs.map((log, index) => {
            const duration = logDurations[index];
            const isLongest =
              logs.length > 1 && duration === longestDuration && duration > 0;
            const isTiny = duration < 60;
            const barWidth =
              longestDuration > 0
                ? Math.max(2, (duration / longestDuration) * 100)
                : 2;
            const endedTime = log.endedAt
              ? formatClock(log.endedAt)
              : formatClock(log.startedAt);
            const timeRange = `${formatClock(log.startedAt)} – ${endedTime}`;

            return (
              <li key={log.id} className={styles.sessionRow}>
                <div
                  className={`${styles.sessionText} ${
                    isTiny ? styles.dimmed : ""
                  }`}
                >
                  <span className={styles.timeRange}>{timeRange}</span>
                  {isLongest && <span className={styles.longestLabel}>longest</span>}
                  <span
                    className={`${styles.sessionDuration} ${
                      isTiny ? styles.dimmed : ""
                    }`}
                  >
                    {formatDuration(duration)}
                  </span>
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${barWidth}%` }}
                    data-longest={isLongest}
                    data-tiny={isTiny}
                  />
                </div>
              </li>
            );
          })}
        </ul>

        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.resumeBtn}
            onClick={handlePrimaryAction}
            disabled={task.status === "completed"}
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className={styles.playIcon}
              aria-hidden="true"
            >
              <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z" />
            </svg>
            {isPaused ? "Resume" : isPending ? "Start" : "Pause"}
          </button>
          <button
            type="button"
            className={styles.completeBtn}
            onClick={onComplete}
            disabled={task.status === "completed"}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.checkIcon}
              aria-hidden="true"
            >
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
            Complete
          </button>
        </footer>
      </div>
    </article>
  );
}
