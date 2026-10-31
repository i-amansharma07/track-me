import { AppLayout } from '@/components/layout/layout';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { EmptyState } from '@/components/ui/emptystate';
import { Button } from '@/components/ui/button';

export default function TasksPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <EmptyState
          title="No tasks yet"
          description="Create your first task to get started with time tracking."
          action={<Button>New Task</Button>}
        />
      </AppLayout>
    </ProtectedRoute>
  );
}
