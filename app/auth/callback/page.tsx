'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { createImplicitRedirectClient } from '@/lib/supabase/implicit-recovery';
import { AuthPageWrapper } from '@/app/components/AuthPageWrapper';
import { sanitizeNext } from '@/lib/auth/sanitize-next';
import { finalizeAuthCallback } from './actions';

/**
 * App Router soft navigation often fails to leave /auth/callback after Set-Cookie from
 * Supabase — users see "Redirecting..." forever. Full navigation fixes it.
 */
function hardRedirect(path: string) {
  if (typeof window === 'undefined') return;
  const url = path.startsWith('http') ? path : `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`;
  window.location.replace(url);
}

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
            hardRedirect(`/auth/reset-password?${q}`);
          } else {
            hardRedirect('/auth/login?error=auth');
          }
        }
        return;
      }

      const supabase = createClient();

      // Hash fragment (implicit): works when the user opens the email on another device/browser
      // than signup — PKCE ?code= requires the same browser’s code_verifier.
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        const implicitTypes =
          hash &&
          (hash.includes('access_token') ||
            hash.includes('type=signup') ||
            hash.includes('type=email') ||
            hash.includes('type=magiclink') ||
            hash.includes('type=invite') ||
            hash.includes('type=email_change') ||
            hash.includes('type=reauthentication'));
        if (implicitTypes) {
          if (hash.includes('error=') && !hash.includes('access_token')) {
            if (!cancelled) {
              hardRedirect(
                nextPath === '/auth/update-password'
                  ? '/auth/reset-password?error=link'
                  : '/auth/login?error=auth'
              );
            }
            return;
          }
          try {
            const implicit = createImplicitRedirectClient();
            await implicit.auth.getSession();
            const {
              data: { session: implicitSession },
              error: implicitErr,
            } = await implicit.auth.getSession();
            if (implicitErr || !implicitSession) {
              console.error('[auth/callback] implicit session:', implicitErr?.message);
              if (!cancelled) {
                hardRedirect(
                  nextPath === '/auth/update-password'
                    ? '/auth/reset-password?error=link'
                    : '/auth/login?error=auth'
                );
              }
              return;
            }
            const { error: setErr } = await supabase.auth.setSession({
              access_token: implicitSession.access_token,
              refresh_token: implicitSession.refresh_token,
            });
            if (setErr) {
              console.error('[auth/callback] setSession (implicit):', setErr.message);
              if (!cancelled) {
                hardRedirect(
                  nextPath === '/auth/update-password'
                    ? '/auth/reset-password?error=link'
                    : '/auth/login?error=auth'
                );
              }
              return;
            }
            await finalizeAuthCallback();
            if (!cancelled) {
              setStatus('Redirecting...');
              hardRedirect(nextPath);
            }
          } catch (e) {
            console.error('[auth/callback] implicit flow:', e);
            if (!cancelled) {
              hardRedirect(
                nextPath === '/auth/update-password'
                  ? '/auth/reset-password?error=link'
                  : '/auth/login?error=auth'
              );
            }
          }
          return;
        }
      }

      // OAuth / email PKCE: ?code= in query (same browser as signup/OAuth start)
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
                hardRedirect(
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
        // No code / no hash: best-effort existing session (e.g. already signed in)
        await supabase.auth.getSession();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          if (!cancelled) hardRedirect('/auth/login?error=auth');
          return;
        }
      }

      await finalizeAuthCallback();

      if (!cancelled) {
        setStatus('Redirecting...');
        hardRedirect(nextPath);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [code, nextParam, errorParam, errorCode, errorDescription]);

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
