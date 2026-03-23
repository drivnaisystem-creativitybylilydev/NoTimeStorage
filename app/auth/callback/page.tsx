'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AuthPageWrapper } from '@/app/components/AuthPageWrapper';
import { sanitizeNext } from '@/lib/auth/sanitize-next';
import { finalizeAuthCallback } from './actions';

/** Supabase redirects here with ?error= when the email link is expired, already used, etc. */
function resetPasswordErrorQuery(errorCode: string | null, errorDescription: string | null): string {
  const code = (errorCode ?? '').toLowerCase();
  const desc = (errorDescription ?? '').toLowerCase();
  if (
    code === 'otp_expired' ||
    code.includes('expired') ||
    desc.includes('expired') ||
    desc.includes('invalid or has expired') ||
    desc.includes('already been used')
  ) {
    return 'error=expired';
  }
  return 'error=link';
}

/**
 * PKCE exchange must run in the **browser** so it uses the same cookie storage as
 * resetPasswordForEmail / signUp. Server Route Handlers can fail on mobile Safari
 * because the code_verifier cookie may not be visible to `cookies()` the same way.
 */
function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Signing you in...');

  const code = searchParams.get('code');
  const nextParam = searchParams.get('next');
  const errorParam = searchParams.get('error');
  const errorCode = searchParams.get('error_code');
  const errorDescription = searchParams.get('error_description');

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const nextPath = sanitizeNext(nextParam);

      if (errorParam) {
        console.error(
          '[auth/callback] provider error:',
          errorParam,
          errorCode,
          errorDescription
        );
        if (!cancelled) {
          if (nextPath === '/auth/update-password') {
            const q = resetPasswordErrorQuery(errorCode, errorDescription);
            router.replace(`/auth/reset-password?${q}`);
          } else {
            router.replace(`/auth/login?error=auth`);
          }
        }
        return;
      }

      const supabase = createClient();

      // OAuth / email PKCE: ?code= in query
      if (code) {
        const {
          data: { session: existing },
        } = await supabase.auth.getSession();
        if (!existing) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            const {
              data: { session: afterFail },
            } = await supabase.auth.getSession();
            // React Strict Mode may run the effect twice; second exchange fails after first succeeded
            if (!afterFail) {
              console.error('[auth/callback] exchangeCodeForSession:', error.message);
              if (!cancelled) {
                router.replace(
                  nextPath === '/auth/update-password'
                    ? '/auth/reset-password?error=link'
                    : '/auth/login?error=auth'
                );
              }
              return;
            }
          }
        }
      } else {
        // Implicit-style redirect (hash tokens) — client parses URL
        await supabase.auth.getSession();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          if (!cancelled) router.replace('/dashboard');
          return;
        }
      }

      await finalizeAuthCallback();

      if (!cancelled) {
        setStatus('Redirecting...');
        router.replace(nextPath);
        router.refresh();
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [code, nextParam, errorParam, errorCode, errorDescription, router]);

  return (
    <AuthPageWrapper>
      <div className="auth-card">
        <p style={{ textAlign: 'center', color: 'var(--color-gray-600)' }}>{status}</p>
      </div>
    </AuthPageWrapper>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <AuthPageWrapper>
          <div className="auth-card">
            <p style={{ textAlign: 'center', color: 'var(--color-gray-600)' }}>
              Loading...
            </p>
          </div>
        </AuthPageWrapper>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
