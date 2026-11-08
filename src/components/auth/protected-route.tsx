'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import styles from './protected-route.module.css';

export type ProtectedRouteProps = {
  children: React.ReactNode;
  redirectTo?: string;
};

function CheckingSession() {
  return (
    <div className={styles.wrap} role="status" aria-live="polite" aria-label="Verifying session">
      <div className={styles.card}>
        <div className={styles.scene} aria-hidden="true">
          <div className={styles.glow} />
          <Image src="/brand/quartz-mark-on-dark.svg" alt="" width={72} height={72} className={styles.logo} priority />
        </div>
        <p className={styles.brand}>Quartz</p>
        <p className={styles.label}>Verifying session</p>
        <div className={styles.track} aria-hidden="true">
          <div className={styles.bar} />
        </div>
      </div>
    </div>
  );
}

export function ProtectedRoute({ children, redirectTo = '/login' }: ProtectedRouteProps) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`${redirectTo}?callbackUrl=${encodeURIComponent(pathname || '/')}`);
    }
  }, [status, router, redirectTo, pathname]);

  if (status === 'loading') {
    return <CheckingSession />;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return <>{children}</>;
}
