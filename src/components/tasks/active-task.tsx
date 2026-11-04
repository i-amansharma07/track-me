"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { api, TaskData } from "@/lib/api";
import styles from "./active-task.module.css";

export function ActiveTaskDisplay() {
  const { status } = useSession();
  const [activeTask, setActiveTask] = useState<TaskData | null>(null);
  const [timeLogs, setTimeLogs] = useState<{ startedAt: string; endedAt: string | null }[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchActive = async () => {
    if (status !== "authenticated") return;
    setLoading(true);
    try {
      const res = await api.tasks.list({ status: "active", limit: 1 });
      const task = res.data?.[0] || null;
      setActiveTask(task);
      if (task) {
        const logs = await api.tasks.timeLogs(task.id);
        setTimeLogs(logs.data || []);
      } else {
        setTimeLogs([]);
      }
    } catch {
      setActiveTask(null);
      setTimeLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchActive();
  }, [status]);

  const [elapsed, setElapsed] = useState(0);

  const openLog = activeTask ? timeLogs.find((l) => l.endedAt === null) : undefined;
  const startedAt = openLog ? openLog.startedAt : null;

  useEffect(() => {
    if (!startedAt) {
      setElapsed(0);
      return;
    }
    const start = new Date(startedAt).getTime();
    const tick = () => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  if (loading || !activeTask) return null;

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;
  const timerText = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const handlePause = async () => {
    try {
      await api.tasks.pause(activeTask.id);
      await fetchActive();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to pause";
      alert(msg);
    }
  };

  const handleComplete = async () => {
    try {
      await api.tasks.complete(activeTask.id);
      await fetchActive();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to complete";
      alert(msg);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.capsule}>
        <div className={styles.gloss} />

        <div className={styles.topRow}>
          <div>
            <h3 className={styles.title}>
              {activeTask.title.length > 15
                ? activeTask.title.slice(0, 15) + "..."
                : activeTask.title}
            </h3>
          </div>
          <div className={styles.timer}>{timerText}</div>
        </div>

        <div className={styles.badgesRow}>
          <span className={styles.activeBadge}>Active</span>
          {activeTask.tag && <span className={styles.tagBadge}>{activeTask.tag}</span>}
        </div>

        <div className={styles.pillContainer}>
          <button
            type="button"
            className={styles.pauseBtn}
            onClick={() => {
              void handlePause();
            }}
            disabled={loading}
          >
            <span className={styles.icon} aria-hidden="true">
              ⏸
            </span>
            Pause
          </button>
          <button
            type="button"
            className={styles.completeBtn}
            onClick={() => {
              void handleComplete();
            }}
            disabled={loading}
          >
            <span className={styles.icon} aria-hidden="true">
              ✓
            </span>
            Complete
          </button>
        </div>
      </div>
    </div>
  );
}
