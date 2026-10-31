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

  if (loading) return <div className={styles.loading}>Loading sessions...</div>;
  if (logs.length === 0) return <div className={styles.empty}>No sessions yet.</div>;

  return (
    <div className={styles.list}>
      <h4 className={styles.title}>Session History</h4>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Started</th>
            <th>Ended</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const started = new Date(log.startedAt);
            const ended = log.endedAt ? new Date(log.endedAt) : null;
            const durationSec = ended ? Math.floor((ended.getTime() - started.getTime()) / 1000) : null;
            return (
              <tr key={log.id}>
                <td>{started.toLocaleString()}</td>
                <td>{ended ? ended.toLocaleString() : 'Active'}</td>
                <td>{durationSec !== null ? `${durationSec}s` : '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
