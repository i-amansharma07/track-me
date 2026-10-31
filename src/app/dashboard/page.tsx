import { AppLayout } from '@/components/layout/layout';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Card } from '@/components/ui/card';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <div className={styles.grid}>
          <Card variant="elevated">
            <h2 className={styles.cardTitle}>Active Tasks</h2>
            <p className={styles.cardBody}>No active tasks right now. Start one from the Tasks page.</p>
          </Card>
          <Card variant="elevated">
            <h2 className={styles.cardTitle}>Today</h2>
            <p className={styles.cardBody}>Track your time and stay productive.</p>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
