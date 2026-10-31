'use client';

import { TaskData } from '@/lib/api';
import { TaskCard } from './task-card';
import { EmptyState } from '@/components/ui/emptystate';
import styles from './task-list.module.css';

export type TaskListProps = {
  tasks: TaskData[];
  onEdit?: (task: TaskData) => void;
  onDelete?: (taskId: string) => void;
  onStart?: (taskId: string) => void;
  onPause?: (taskId: string) => void;
  onResume?: (taskId: string) => void;
  onComplete?: (taskId: string) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function TaskList({ tasks, onEdit, onDelete, onStart, onPause, onResume, onComplete, isLoading, error, onRetry }: TaskListProps) {
  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.skeletonCard} />
        <div className={styles.skeletonCard} />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Failed to load tasks"
        description={error}
        action={onRetry ? <button onClick={onRetry}>Retry</button> : undefined}
      />
    );
  }

  if (tasks.length === 0) {
    return <EmptyState title="No tasks" description="Create your first task to get started." />;
  }

  return (
    <div className={styles.grid}>
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} onStart={onStart} onPause={onPause} onResume={onResume} onComplete={onComplete} />
      ))}
    </div>
  );
}
