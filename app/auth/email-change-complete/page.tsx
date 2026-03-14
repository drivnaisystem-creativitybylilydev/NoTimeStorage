'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AuthPageWrapper } from '@/app/components/AuthPageWrapper';
import Image from 'next/image';

export default function EmailChangeCompletePage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore sign-out errors; we still send them to login
      }
      if (!cancelled) {
        router.replace('/auth/login?from=email-change');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  return (
    <AuthPageWrapper>
      <div className="auth-card">
        <div className="auth-logo">
          <Link href="/">
            <Image
              src="/brand/notime-storage-logo.png"
              alt="NoTime Storage"
              width={60}
              height={60}
            />
          </Link>
        </div>
        <div className="auth-header">
          <h1>Email updated</h1>
          <p>We&apos;re signing you out so you can log in with your new email.</p>
        </div>
        <p style={{ textAlign: 'center', color: '#4A3A34', fontSize: '0.95rem' }}>
          If you&apos;re not redirected automatically, you can{' '}
          <button
            type="button"
            onClick={() => router.replace('/auth/login?from=email-change')}
            style={{
              border: 'none',
              background: 'none',
              color: 'var(--color-coffee)',
              fontWeight: 600,
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            go to the login page here
          </button>.
        </p>
      </div>
    </AuthPageWrapper>
  );
}

