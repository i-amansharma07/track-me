'use client';

import { Suspense } from 'react';
import { useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import styles from './login.module.css';

function LoginContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/tasks';

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  if (status === 'authenticated') {
    return <div className={styles.redirecting}>Redirecting...</div>;
  }

  return (
    <main className={styles.container}>
      <Card variant="elevated" className={styles.card}>
        <div className={styles.inner}>
          <h1 className={styles.title}>Track Me</h1>
          <p className={styles.subtitle}>Sign in to manage your tasks and track time.</p>
          <Button
            onClick={() => {
              void signIn('google', { callbackUrl });
            }}
            size="lg"
            className={styles.button}
          >
            Continue with Google
          </Button>
        </div>
      </Card>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className={styles.redirecting}>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
