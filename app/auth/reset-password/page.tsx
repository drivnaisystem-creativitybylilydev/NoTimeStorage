'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { AuthPageWrapper } from '@/app/components/AuthPageWrapper';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const linkError = searchParams.get('error') === 'link';
  const supabase = createClient();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Match signup flow: use current origin so redirect matches Supabase allowlist for
      // localhost, production, or preview (avoid NEXT_PUBLIC_SITE_URL pointing elsewhere).
      const baseUrl = window.location.origin.replace(/\/$/, '');
      // Route through /auth/callback so the browser can exchange PKCE (same storage as this request).
      const callback = new URL('/auth/callback', baseUrl);
      callback.searchParams.set('next', '/auth/update-password');
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: callback.toString(),
      });

      if (resetError) throw resetError;

      setSuccess(true);
    } catch (err: any) {
      const raw = String(err?.message ?? err ?? '');
      const lower = raw.toLowerCase();
      if (lower.includes('rate limit') || lower.includes('over_email_send')) {
        setError(
          'Too many reset emails were requested. Please wait about an hour and try again, or contact support if you need help immediately.'
        );
      } else {
        setError(raw || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
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
          
          <div className="auth-success">
            <h1>Check your email</h1>
            <p>We've sent password reset instructions to <strong>{email}</strong></p>
            <p>Click the link in the email to reset your password.</p>
            <p style={{ fontSize: '0.8rem', color: '#5c4f48', marginTop: '8px', padding: '8px 12px', background: 'var(--color-paper)', borderRadius: '8px', border: '1px solid var(--color-latte)', lineHeight: 1.5 }}>
              <strong>On a phone:</strong> open the link in <strong>Safari or Chrome</strong> (use
              &quot;Open in Browser&quot; from your mail app) so it works with the browser where you
              requested the reset.
            </p>
            <p style={{ fontSize: '0.8rem', color: '#9B8880', marginTop: '8px', padding: '8px 12px', background: 'var(--color-paper)', borderRadius: '8px', border: '1px solid var(--color-latte)' }}>
              📬 Don&apos;t see it? Check your <strong>junk or spam folder</strong> — it may have landed there.
            </p>
            <Link href="/auth/login" className="button-primary">
              Back to Login
            </Link>
          </div>
        </div>
      </AuthPageWrapper>
    );
  }

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
          <h1>Reset your password</h1>
          <p>Enter your email and we'll send you reset instructions</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {linkError && (
            <div
              className="auth-success"
              style={{ marginBottom: '1rem', textAlign: 'left' }}
              role="alert"
            >
              <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: '#4A3A34' }}>
                We couldn&apos;t open your reset link
              </p>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#5c4f48', lineHeight: 1.5 }}>
                This often happens on phones when the link opens inside the email app instead of
                Safari or Chrome. Use <strong>Open in Browser</strong> (or copy the link), then
                request a new reset email and open it in that same browser. You can also request
                the reset on the device where you read email so the app and browser match.
              </p>
            </div>
          )}
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <button 
            type="submit" 
            className="button-primary" 
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <div className="auth-footer">
            Remember your password? <Link href="/auth/login">Log in</Link>
          </div>
        </form>
      </div>
    </AuthPageWrapper>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthPageWrapper><div className="auth-card" /></AuthPageWrapper>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
