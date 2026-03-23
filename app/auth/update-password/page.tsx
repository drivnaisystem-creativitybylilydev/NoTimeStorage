'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { createImplicitRedirectClient } from '@/lib/supabase/implicit-recovery';
import Link from 'next/link';
import Image from 'next/image';
import { AuthPageWrapper } from '@/app/components/AuthPageWrapper';
import { finalizeAuthCallback } from '@/app/auth/callback/actions';

export default function UpdatePasswordPage() {
  const router = useRouter();
  /** Set after bootstrap so PKCE client is never initialized while the URL still has implicit hash tokens. */
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const resolvedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let invalidTimer: ReturnType<typeof setTimeout>;
    let sub: { unsubscribe: () => void };

    const markReady = () => {
      if (!cancelled && !resolvedRef.current) {
        resolvedRef.current = true;
        setReady(true);
        window.history.replaceState({}, '', window.location.pathname);
      }
    };

    const checkRecovery = async () => {
      if (typeof window === 'undefined') return;

      const hash = window.location.hash;
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');

      // Implicit recovery (#access_token / type=recovery): must use implicit client first.
      // The app PKCE client rejects implicit callback URLs (flow type mismatch).
      if (
        hash &&
        (hash.includes('access_token') ||
          hash.includes('type=recovery') ||
          hash.includes('error='))
      ) {
        if (hash.includes('error=') && !hash.includes('access_token')) {
          if (!cancelled) setInvalidLink(true);
          return;
        }
        try {
          const implicit = createImplicitRedirectClient();
          await implicit.auth.getSession();
          const {
            data: { session },
            error: sessErr,
          } = await implicit.auth.getSession();
          if (cancelled) return;
          if (sessErr || !session) {
            if (!cancelled) setInvalidLink(true);
            return;
          }
          const main = createClient();
          const { error: setErr } = await main.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          });
          if (setErr) {
            console.error('[update-password] setSession:', setErr);
            if (!cancelled) setInvalidLink(true);
            return;
          }
          supabaseRef.current = main;
          await finalizeAuthCallback();
          markReady();
        } catch (e) {
          console.error('[update-password] implicit recovery:', e);
          if (!cancelled) setInvalidLink(true);
        }
        return;
      }

      // PKCE (?code=): older reset emails or signup-style links — exchange in browser.
      const main = createClient();
      supabaseRef.current = main;

      if (code) {
        const {
          data: { session: existing },
        } = await main.auth.getSession();
        if (!existing) {
          const { error: exchangeError } = await main.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            const {
              data: { session: afterFail },
            } = await main.auth.getSession();
            if (!afterFail) {
              if (!cancelled) setInvalidLink(true);
              return;
            }
          }
        }
        await finalizeAuthCallback();
        markReady();
        return;
      }

      const { data: { session } } = await main.auth.getSession();
      if (!cancelled && session) {
        await finalizeAuthCallback();
        markReady();
        return;
      }

      const { data: { subscription } } = main.auth.onAuthStateChange((_event, session) => {
        if (!cancelled && session) markReady();
      });
      sub = subscription;
      invalidTimer = setTimeout(() => {
        if (!cancelled && !resolvedRef.current) setInvalidLink(true);
      }, 5000);
    };

    checkRecovery();
    return () => {
      cancelled = true;
      clearTimeout(invalidTimer);
      sub?.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const supabase = supabaseRef.current;
    if (!supabase) {
      setError('Session not ready. Please refresh the page.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) throw updateError;

      router.push('/auth/login?from=password-reset');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update password';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (invalidLink) {
    return (
      <AuthPageWrapper>
        <div className="auth-card">
          <div className="auth-logo">
            <Link href="/">
              <Image src="/brand/notime-storage-logo.png" alt="NoTime Storage" width={60} height={60} />
            </Link>
          </div>
          <div className="auth-header">
            <h1>Invalid or expired link</h1>
            <p>This password reset link has expired or is invalid. Please request a new one.</p>
          </div>
          <Link href="/auth/reset-password" className="button-primary">
            Request new reset link
          </Link>
        </div>
      </AuthPageWrapper>
    );
  }

  if (!ready) {
    return (
      <AuthPageWrapper>
        <div className="auth-card">
          <div className="auth-logo">
            <Link href="/">
              <Image src="/brand/notime-storage-logo.png" alt="NoTime Storage" width={60} height={60} />
            </Link>
          </div>
          <p style={{ textAlign: 'center', color: 'var(--color-gray-600)' }}>Verifying your link...</p>
        </div>
      </AuthPageWrapper>
    );
  }

  return (
    <AuthPageWrapper>
      <div className="auth-card">
        <div className="auth-logo">
          <Link href="/">
            <Image src="/brand/notime-storage-logo.png" alt="NoTime Storage" width={60} height={60} />
          </Link>
        </div>
        <div className="auth-header">
          <h1>Set new password</h1>
          <p>Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error">{error}</div>
          )}

          <div className="form-group">
            <label htmlFor="password">New password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="button-primary" disabled={loading}>
            {loading ? 'Updating...' : 'Update password'}
          </button>

          <div className="auth-footer">
            <Link href="/auth/login">Back to login</Link>
          </div>
        </form>
      </div>
    </AuthPageWrapper>
  );
}
