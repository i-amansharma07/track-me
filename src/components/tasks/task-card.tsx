'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TaskStatusBadge, TaskCategoryBadge } from './task-badges';
import { TaskSessions } from './task-sessions';
import { TaskData } from '@/lib/api';
import styles from './task-card.module.css';

export type TaskCardProps = {
  task: TaskData;
  onEdit?: (task: TaskData) => void;
  onDelete?: (taskId: string) => void;
  onStart?: (taskId: string) => void;
  onPause?: (taskId: string) => void;
  onResume?: (taskId: string) => void;
  onComplete?: (taskId: string) => void;
}

export function TaskCard({ task, onEdit, onDelete, onStart, onPause, onResume, onComplete }: TaskCardProps) {
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
      <TaskSessions key={task.updatedAt} taskId={task.id} />
      <div className={styles.actions}>
        {task.status === 'pending' && (
          <Button variant="primary" size="sm" onClick={() => { if (onStart) onStart(task.id); }}>Start</Button>
        )}
        {task.status === 'active' && (
          <>
            <Button variant="outline" size="sm" onClick={() => { if (onPause) onPause(task.id); }}>Pause</Button>
            <Button variant="primary" size="sm" onClick={() => { if (onComplete) onComplete(task.id); }}>Complete</Button>
          </>
        )}
        {task.status === 'pause' && (
          <>
            <Button variant="outline" size="sm" onClick={() => { if (onResume) onResume(task.id); }}>Resume</Button>
            <Button variant="primary" size="sm" onClick={() => { if (onComplete) onComplete(task.id); }}>Complete</Button>
          </>
        )}
        {task.status === 'completed' && (
          <Button variant="outline" size="sm" onClick={() => { if (onEdit) onEdit(task); }} disabled>Completed</Button>
        )}
        <Button variant="outline" size="sm" onClick={() => { if (onEdit) onEdit(task); }} disabled={task.status === 'completed'}>Edit</Button>
        <Button variant="danger" size="sm" onClick={() => { if (onDelete) onDelete(task.id); }} disabled={task.status === 'active'}>Delete</Button>
      </div>
    </Card>
  );
}
