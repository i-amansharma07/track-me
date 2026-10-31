'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { TaskTag } from '@/lib/api';
import styles from './task-form.module.css';

const tags: TaskTag[] = ['Exercise', 'Rest', 'Study', 'Discipline', 'Code', 'Revision'];

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  tag: z.nativeEnum({ Exercise: 'Exercise', Rest: 'Rest', Study: 'Study', Discipline: 'Discipline', Code: 'Code', Revision: 'Revision' }).optional(),
});

export type TaskFormData = {
  title: string;
  tag?: TaskTag;
}

export type TaskFormProps = {
  initial?: Partial<TaskFormData>;
  onSubmit: (data: TaskFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function TaskForm({ initial, onSubmit, isSubmitting = false }: TaskFormProps) {
  const [title, setTitle] = useState(initial?.title || '');
  const [tag, setTag] = useState<TaskTag | ''>((initial?.tag as TaskTag) || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initial) {
      setTitle(initial.title || '');
      setTag((initial.tag as TaskTag) || '');
    }
  }, [initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void (async () => {
      const result = schema.safeParse({ title, tag: tag ? tag : undefined });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        for (const err of result.error.errors) {
          const field = err.path[0] as string;
          fieldErrors[field] = err.message;
        }
        setErrors(fieldErrors);
        return;
      }
      setErrors({});
      await onSubmit({ title: result.data.title, tag: result.data.tag as import('@/lib/api').TaskTag | undefined });
    })();
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
        placeholder="Task title"
      />
      <Select
        label="Category"
        value={tag}
        onChange={(e) => setTag(e.target.value as TaskTag | '')}
        error={errors.tag}
        options={[{ value: '', label: 'Select category' }, ...tags.map((t) => ({ value: t, label: t }))]}
      />
      <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting} className={styles.submit}>
        {initial ? 'Update Task' : 'Create Task'}
      </Button>
    </form>
  );
}
