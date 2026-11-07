'use client';

import { useEffect } from 'react';
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
          <svg className={styles.character} viewBox="0 0 120 120" fill="none">
            <g className={styles.hoodie}>
              <path d="M30 88c2-18 11-31 30-31s28 13 30 31v10H30V88z" fill="#1a1f2e" />
              <path d="M38 64c4-14 12-22 22-22s18 8 22 22" stroke="#2a3147" strokeWidth="2" />
              <path d="M36 58c6-16 14-24 24-24s18 8 24 24l-6 8c-4-10-10-16-18-16s-14 6-18 16l-6-8z" fill="#232a3d" />
              <path d="M52 98v-8m16 8v-8" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
              <path d="M48 92h24" stroke="#2f3752" strokeWidth="3" strokeLinecap="round" />
            </g>
            <g className={styles.head}>
              <path d="M44 56c0-10 7-18 16-18s16 8 16 18v6c0 9-7 16-16 16s-16-7-16-16v-6z" fill="#2a3147" />
              <path d="M44 58c0-2 3-8 16-8s16 6 16 8" fill="#232a3d" />
              <rect x="47" y="49" width="26" height="10" rx="5" fill="#0f1117" />
              <line x1="48" y1="54" x2="72" y2="54" className={styles.scan} stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" />
              <g className={styles.eyes}>
                <rect x="51" y="52.5" width="5" height="3" rx="1.5" fill="#a78bfa" />
                <rect x="64" y="52.5" width="5" height="3" rx="1.5" fill="#a78bfa" />
              </g>
            </g>
          </svg>
        </div>
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
