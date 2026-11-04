"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { TaskStatusBadge, TaskCategoryBadge } from "./task-badges";
import { TaskSessions } from "./task-sessions";
import { TaskData } from "@/lib/api";
import styles from "./task-card.module.css";

export type TaskCardProps = {
  task: TaskData;
  onEdit?: (task: TaskData) => void;
  onDelete?: (taskId: string) => void;
  onStart?: (taskId: string) => void;
  onPause?: (taskId: string) => void;
  onResume?: (taskId: string) => void;
  onComplete?: (taskId: string) => void;
  isBusy?: boolean;
};

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onStart,
  onPause,
  onResume,
  onComplete,
  isBusy = false,
}: TaskCardProps) {
  const created = new Date(task.createdAt).toLocaleDateString();
  return (
    <Card variant="elevated" className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          {task.title.length > 20 ? task.title.slice(0, 15) + "..." : task.title}
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <TaskStatusBadge status={task.status} />
          <Dropdown
            align="right"
            trigger={
              <span
                aria-label="More actions"
                style={{ color: "#fff", fontWeight: 600, fontSize: "1.2rem", lineHeight: 1 }}
              >
                ⋮
              </span>
            }
            options={[
              {
                label: "Edit",
                value: "edit",
                onClick: () => {
                  if (onEdit) onEdit(task);
                },
              },
              {
                label: "Delete",
                value: "delete",
                onClick: () => {
                  if (onDelete) onDelete(task.id);
                },
              },
            ]}
          />
        </div>
      </div>
      <div className={styles.meta}>
        <TaskCategoryBadge tag={(task.tag as import("@/lib/api").TaskTag) || undefined} />
        <span className={styles.date}>Created {created}</span>
      </div>
      <TaskSessions key={task.updatedAt} taskId={task.id} />
      <div className={styles.actions}>
        {task.status === "pending" && (
          <Button
            variant="primary"
            size="sm"
            disabled={isBusy}
            onClick={() => {
              if (onStart) onStart(task.id);
            }}
          >
            Start
          </Button>
        )}
        {task.status === "active" && (
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={() => {
                if (onPause) onPause(task.id);
              }}
            >
              Pause
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={isBusy}
              onClick={() => {
                if (onComplete) onComplete(task.id);
              }}
            >
              Complete
            </Button>
          </>
        )}
        {task.status === "pause" && (
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={() => {
                if (onResume) onResume(task.id);
              }}
            >
              Resume
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={isBusy}
              onClick={() => {
                if (onComplete) onComplete(task.id);
              }}
            >
              Complete
            </Button>
          </>
        )}
        {task.status === "completed" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (onEdit) onEdit(task);
            }}
            disabled
          >
            Completed
          </Button>
        )}
      </div>
    </Card>
  );
}
