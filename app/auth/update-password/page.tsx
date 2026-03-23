'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { AuthPageWrapper } from '@/app/components/AuthPageWrapper';
import { finalizeAuthCallback } from '@/app/auth/callback/actions';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = createClient();
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
      const search = window.location.search;
      const hashParams = new URLSearchParams(hash.replace('#', ''));
      const searchParams = new URLSearchParams(search);
      const type = hashParams.get('type');
      const code = searchParams.get('code');

      // PKCE: exchange in the browser (same cookie storage as resetPasswordForEmail). Do not send
      // to server-only /auth/callback — mobile Safari often fails server-side exchange.
      if (code) {
        const {
          data: { session: existing },
        } = await supabase.auth.getSession();
        if (!existing) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            const {
              data: { session: afterFail },
            } = await supabase.auth.getSession();
            if (!afterFail) {
              setInvalidLink(true);
              return;
            }
          }
        }
        await finalizeAuthCallback();
        markReady();
        return;
      }

      if (type === 'recovery' || hash.includes('access_token')) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!cancelled && session) {
          markReady();
          return;
        }
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (!cancelled && session) markReady();
        });
        sub = subscription;
        invalidTimer = setTimeout(() => {
          if (!cancelled && !resolvedRef.current) setInvalidLink(true);
        }, 5000);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!cancelled && session) {
        markReady();
        return;
      }

      invalidTimer = setTimeout(() => {
        if (!cancelled) setInvalidLink(true);
      }, 2000);
    };

    checkRecovery();
    return () => {
      cancelled = true;
      clearTimeout(invalidTimer);
      sub?.unsubscribe();
    };
  }, [supabase.auth]);

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
