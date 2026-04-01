'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AuthPageWrapper } from '@/app/components/AuthPageWrapper';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const errorKind = searchParams.get('error');
  const linkError = errorKind === 'link';
  const expiredError = errorKind === 'expired';
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, origin: window.location.origin }),
      });

      if (!res.ok) {
        throw new Error('Failed to send reset email');
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'An error occurred. Please try again.'
      );
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
            <p>We&apos;ve sent password reset instructions to <strong>{email}</strong></p>
            <p>Click the link in the email to reset your password.</p>
            <p style={{ fontSize: '0.8rem', color: '#5c4f48', marginTop: '8px', padding: '8px 12px', background: 'var(--color-paper)', borderRadius: '8px', border: '1px solid var(--color-latte)', lineHeight: 1.5 }}>
              Open the link <strong>within about an hour</strong>. Each link works <strong>once</strong>{' '}
              — if you already tapped it, request a new email.
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
          <p>Enter your email and we&apos;ll send you reset instructions</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {expiredError && (
            <div
              className="auth-success"
              style={{ marginBottom: '1rem', textAlign: 'left' }}
              role="alert"
            >
              <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: '#4A3A34' }}>
                This reset link has expired or was already used
              </p>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#5c4f48', lineHeight: 1.5 }}>
                Supabase only allows each link to be used once, and links time out after a limited
                window (often about an hour). Request a <strong>new</strong> reset email below and
                open it soon in the same browser you use to submit this form. If you tried Safari
                and then Chrome, request a fresh link in the browser you&apos;ll use to open the
                email.
              </p>
            </div>
          )}
          {linkError && (
            <div
              className="auth-success"
              style={{ marginBottom: '1rem', textAlign: 'left' }}
              role="alert"
            >
              <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: '#4A3A34' }}>
                We couldn&apos;t complete your reset link
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
