'use client';

import { useState } from 'react';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { TaskStatus, TaskTag } from '@/lib/api';
import styles from './task-filters.module.css';

const statuses: { value: TaskStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'pause', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
];

const tags: { value: TaskTag | ''; label: string }[] = [
  { value: '', label: 'All categories' },
  { value: 'Exercise', label: 'Exercise' },
  { value: 'Rest', label: 'Rest' },
  { value: 'Study', label: 'Study' },
  { value: 'Discipline', label: 'Discipline' },
  { value: 'Code', label: 'Code' },
  { value: 'Revision', label: 'Revision' },
];

export type TaskFiltersProps = {
  onFilter: (filters: { status?: TaskStatus; tag?: TaskTag }) => void;
}

export function TaskFilters({ onFilter }: TaskFiltersProps) {
  const [status, setStatus] = useState<TaskStatus | ''>('');
  const [tag, setTag] = useState<TaskTag | ''>('');

  const apply = () => {
    onFilter({ status: status || undefined, tag: tag || undefined });
  };

  const reset = () => {
    setStatus('');
    setTag('');
    onFilter({});
  };

  return (
    <div className={styles.filters}>
      <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus | '')} options={statuses} />
      <Select label="Category" value={tag} onChange={(e) => setTag(e.target.value as TaskTag | '')} options={tags} />
      <Button variant="outline" size="sm" onClick={apply}>Apply</Button>
      <Button variant="ghost" size="sm" onClick={reset}>Reset</Button>
    </div>
  );
}
