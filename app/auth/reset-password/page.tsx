'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { AuthPageWrapper } from '@/app/components/AuthPageWrapper';

export default function ResetPasswordPage() {
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
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (resetError) throw resetError;

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
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
