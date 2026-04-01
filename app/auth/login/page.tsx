'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { AuthPageWrapper } from '@/app/components/AuthPageWrapper';

function LoginPageContent() {
  const searchParams = useSearchParams();
  const supabase = createClient();
  const redirectTo = searchParams.get('redirect');
  const from = searchParams.get('from');
  const authError = searchParams.get('error');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        const path = redirectTo?.startsWith('/') ? redirectTo : '/dashboard';
        // Full reload so server components pick up the new session cookies immediately
        window.location.replace(path);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

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
          <h1>Welcome back</h1>
          <p>Log in to your NoTime Storage account</p>
          <p className="auth-session-hint" style={{ marginTop: '0.75rem', marginBottom: 0, fontSize: '0.875rem', color: 'var(--color-gray-500)', lineHeight: 1.45 }}>
            We keep you signed in on this browser until you log out or clear site data. For fewer logins, use normal Safari or Chrome (not private browsing) and don&apos;t block cookies for this site.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {from === 'email-change' && (
            <div className="auth-success" style={{ marginBottom: '1rem' }}>
              <p style={{ margin: 0, color: '#4A3A34', fontSize: '0.95rem' }}>
                Your email has been updated. Please log in with your new email address.
              </p>
            </div>
          )}
          {from === 'password-reset' && (
            <div className="auth-success" style={{ marginBottom: '1rem' }}>
              <p style={{ margin: 0, color: '#4A3A34', fontSize: '0.95rem' }}>
                Your password has been updated. Log in with your new password.
              </p>
            </div>
          )}
          {authError === 'auth' && (
            <div className="auth-error" style={{ marginBottom: '1rem' }}>
              <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>
                This sign-in or confirmation link couldn&apos;t be completed (wrong browser, expired
                link, or session issue). If you were confirming email or using OAuth, try again in
                the same browser. For password reset,{' '}
                <Link href="/auth/reset-password" style={{ textDecoration: 'underline' }}>
                  request a new link
                </Link>{' '}
                and open it in Safari or Chrome, not only inside your mail app.
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
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              autoComplete="current-password"
            />
          </div>

          <div className="form-forgot">
            <Link href="/auth/reset-password">Forgot password?</Link>
          </div>

          <button 
            type="submit" 
            className="button-primary" 
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>

          <div className="auth-footer">
            Don't have an account? <Link href="/auth/signup">Sign up</Link>
          </div>
        </form>
      </div>
    </AuthPageWrapper>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthPageWrapper><div className="auth-card" /></AuthPageWrapper>}>
      <LoginPageContent />
    </Suspense>
  );
}
