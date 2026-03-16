'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { AuthPageWrapper } from '@/app/components/AuthPageWrapper';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const redirectTo = searchParams.get('redirect');
  const from = searchParams.get('from');
  
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
        router.push(path);
        router.refresh();
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
