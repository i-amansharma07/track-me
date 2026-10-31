'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

export type ProtectedRouteProps = {
  children: React.ReactNode;
  redirectTo?: string;
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
    return (
      <div style={{ padding: '2rem', color: 'var(--color-text-secondary)' }}>
        Checking session...
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return <>{children}</>;
}
