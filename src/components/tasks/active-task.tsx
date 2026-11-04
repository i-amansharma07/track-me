"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { api, TaskData } from "@/lib/api";
import { Timer } from "./timer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TaskStatusBadge, TaskCategoryBadge } from "./task-badges";
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
    // const interval = setInterval(() => { void fetchActive(); }, 15000);
    // return () => clearInterval(interval);
  }, [status]);

  if (loading || !activeTask) return null;

  const openLog = timeLogs.find((l) => l.endedAt === null);
  const startedAt = openLog ? openLog.startedAt : null;

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
    <Card variant="elevated" className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h3 className={styles.title}>{activeTask.title}</h3>
          <div className={styles.tags}>
            <TaskStatusBadge status={activeTask.status} />
            <TaskCategoryBadge tag={(activeTask.tag as import("@/lib/api").TaskTag) || undefined} />
          </div>
        </div>
        <Timer startedAt={startedAt} />
      </div>
      <div className={styles.actions}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            void handlePause();
          }}
        >
          Pause
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            void handleComplete();
          }}
        >
          Complete
        </Button>
      </div>
    </Card>
  );
}
