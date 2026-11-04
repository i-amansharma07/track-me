'use client';

import { Badge } from '@/components/ui/badge';
import { TaskStatus, TaskTag } from '@/lib/api';

const statusLabels: Record<TaskStatus, string> = {
  pending: 'Pending',
  active: 'Active',
  pause: 'Paused',
  completed: 'Completed',
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const variant: 'success' | 'primary' | 'warning' | 'default' = status === 'completed' ? 'success' : status === 'active' ? 'primary' : status === 'pause' ? 'warning' : 'default';
  return <Badge variant={variant}>{statusLabels[status]}</Badge>;
}

export function TaskCategoryBadge({ tag }: { tag?: TaskTag }) {
  if (!tag) return null;
  return <Badge variant="default">{tag}</Badge>;
}
