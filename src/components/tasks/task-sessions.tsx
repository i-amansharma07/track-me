'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import styles from './task-sessions.module.css';

export type TimeLogData = {
  id: string;
  taskId: string;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
}

export type TaskSessionsProps = {
  taskId: string;
}

function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}

function formatClock(value: Date): string {
  return value.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function TaskSessions({ taskId }: TaskSessionsProps) {
  const [logs, setLogs] = useState<TimeLogData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.tasks.timeLogs(taskId);
        if (!cancelled) setLogs(res.data || []);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [taskId]);

  if (loading || logs.length === 0) return null;

  return (
    <div className={styles.list}>
      <h4 className={styles.title}>Time Logs</h4>
      <ol className={styles.logs}>
        {logs.map((log, index) => {
          const started = new Date(log.startedAt);
          const ended = log.endedAt ? new Date(log.endedAt) : null;
          const endMs = ended ? ended.getTime() : Date.now();
          const durationSec = Math.floor((endMs - started.getTime()) / 1000);
          return (
            <li key={log.id} className={styles.row}>
              <span className={styles.logLabel}>
                log {index + 1} : {formatDuration(durationSec)}
              </span>
              <span className={styles.times}>
                {formatClock(started)} - {ended ? formatClock(ended) : 'running'}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
