import { AppLayout } from '@/components/layout/layout';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import styles from './analytics.module.css';

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <div className={styles.headerRow}>
          <h1 className={styles.pageTitle}>Analytics</h1>
          <Badge>Coming soon</Badge>
        </div>
        <div className={styles.grid}>
          <Card variant="elevated">
            <h3 className={styles.cardTitle}>Total Tracked Time</h3>
            <p className={styles.metric}>0h 0m</p>
          </Card>
          <Card variant="elevated">
            <h3 className={styles.cardTitle}>Completed Tasks</h3>
            <p className={styles.metric}>0</p>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
