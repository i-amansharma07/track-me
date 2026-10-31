'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TaskStatusBadge, TaskCategoryBadge } from './task-badges';
import { TaskData } from '@/lib/api';
import styles from './task-card.module.css';

export type TaskCardProps = {
  task: TaskData;
  onEdit?: (task: TaskData) => void;
  onDelete?: (taskId: string) => void;
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const created = new Date(task.createdAt).toLocaleDateString();
  return (
    <Card variant="elevated" className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{task.title}</h3>
        <TaskStatusBadge status={task.status} />
      </div>
      <div className={styles.meta}>
        <TaskCategoryBadge tag={(task.tag as import('@/lib/api').TaskTag) || undefined} />
        <span className={styles.date}>Created {created}</span>
      </div>
      <div className={styles.actions}>
        <Button variant="outline" size="sm" onClick={() => onEdit?.(task)} disabled={task.status === 'completed'}>
          Edit
        </Button>
        <Button variant="danger" size="sm" onClick={() => onDelete?.(task.id)} disabled={task.status === 'active'}>
          Delete
        </Button>
      </div>
    </Card>
  );
}
