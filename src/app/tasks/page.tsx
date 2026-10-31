'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AppLayout } from '@/components/layout/layout';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { TaskFilters } from '@/components/tasks/task-filters';
import { TaskList } from '@/components/tasks/task-list';
import { TaskForm } from '@/components/tasks/task-form';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { api, TaskData, TaskStatus, TaskTag } from '@/lib/api';
import { Toast } from '@/components/ui/toast';
import styles from './tasks.module.css';

export default function TasksPage() {
  const { status } = useSession();
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ status?: TaskStatus; tag?: TaskTag }>({});
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; variant: 'success' | 'error' | 'info' | 'warning' }>({ open: false, message: '', variant: 'info' });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (status !== 'authenticated') return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.tasks.list({ ...filters, page, limit: 12 });
      setTasks(res.data || []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load tasks';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [status, filters, page]);

  useEffect(() => {
    if (status === 'authenticated') {
      void fetchTasks();
    }
  }, [status, filters, page, fetchTasks]);

  const handleCreate = async (data: { title: string; tag?: TaskTag }) => {
    setSubmitting(true);
    try {
      await api.tasks.create(data);
      setShowForm(false);
      setToast({ open: true, message: 'Task created', variant: 'success' });
      await fetchTasks();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to create task';
      setToast({ open: true, message: msg, variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (data: { title: string; tag?: TaskTag }) => {
    if (!editingTask) return;
    setSubmitting(true);
    try {
      await api.tasks.update(editingTask.id, data);
      setEditingTask(null);
      setToast({ open: true, message: 'Task updated', variant: 'success' });
      await fetchTasks();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to update task';
      setToast({ open: true, message: msg, variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLifecycle = async (action: 'start' | 'pause' | 'resume' | 'complete', id: string) => {
    setSubmitting(true);
    try {
      if (action === 'start') await api.tasks.start(id);
      if (action === 'pause') await api.tasks.pause(id);
      if (action === 'resume') await api.tasks.resume(id);
      if (action === 'complete') await api.tasks.complete(id);
      await fetchTasks();
      setToast({ open: true, message: `Task ${action === 'start' ? 'started' : action === 'pause' ? 'paused' : action === 'resume' ? 'resumed' : 'completed'}`, variant: 'success' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed';
      setToast({ open: true, message: msg, variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.tasks.delete(deleteTarget);
      setDeleteTarget(null);
      setToast({ open: true, message: 'Task deleted', variant: 'success' });
      await fetchTasks();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete task';
      setToast({ open: true, message: msg, variant: 'error' });
    }
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Tasks</h1>
          <Button onClick={() => setShowForm(true)} size="md">New Task</Button>
        </div>
        <div className={styles.filtersSection}>
          <TaskFilters onFilter={(f) => { setFilters(f); setPage(1); }} />
        </div>
        <TaskList
          tasks={tasks}
          onEdit={setEditingTask}
          onDelete={(id) => setDeleteTarget(id)}
          onStart={(id) => { void handleLifecycle('start', id); }}
          onPause={(id) => { void handleLifecycle('pause', id); }}
          onResume={(id) => { void handleLifecycle('resume', id); }}
          onComplete={(id) => { void handleLifecycle('complete', id); }}
          isLoading={loading}
          error={error}
          onRetry={() => { void fetchTasks(); }}
        />
        <Dialog
          open={showForm || !!editingTask}
          onClose={() => { setShowForm(false); setEditingTask(null); }}
          title={editingTask ? 'Edit Task' : 'Create Task'}
        >
          <TaskForm
            initial={editingTask ? { title: editingTask.title, tag: (editingTask.tag as TaskTag) || undefined } : undefined}
            onSubmit={editingTask ? handleUpdate : handleCreate}
            isSubmitting={submitting}
          />
        </Dialog>
        <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Task?" description="This action cannot be undone.">
          <div className={styles.dialogActions}>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => { void handleDelete(); }}>Delete</Button>
          </div>
        </Dialog>
        <Toast
          message={toast.message}
          variant={toast.variant}
          open={toast.open}
          onClose={() => setToast({ ...toast, open: false })}
        />
      </AppLayout>
    </ProtectedRoute>
  );
}
