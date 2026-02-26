'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    fullName: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      // Sign up with Supabase Auth
      // The database trigger will automatically create the user profile
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: `${formData.firstName} ${formData.lastName}`,
            phone: formData.phone,
            school: 'Stonehill College', // Default school; more options can be added later
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Profile is automatically created by database trigger
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">
            <Image
              src="/brand/notime-storage-logo.png"
              alt="NoTime Storage"
              width={60}
              height={60}
            />
          </div>

          <div className="auth-success" style={{ textAlign: 'center', padding: '8px 0 24px' }}>
            {/* Animated green check */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <svg
                viewBox="0 0 52 52"
                width="80"
                height="80"
                style={{ display: 'block' }}
              >
                <style>{`
                  @keyframes circle-draw {
                    from { stroke-dashoffset: 166; }
                    to   { stroke-dashoffset: 0; }
                  }
                  @keyframes check-draw {
                    from { stroke-dashoffset: 48; }
                    to   { stroke-dashoffset: 0; }
                  }
                  .check-circle {
                    stroke-dasharray: 166;
                    stroke-dashoffset: 166;
                    animation: circle-draw 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
                  }
                  .check-mark {
                    stroke-dasharray: 48;
                    stroke-dashoffset: 48;
                    animation: check-draw 0.4s cubic-bezier(0.65, 0, 0.45, 1) 0.5s forwards;
                  }
                `}</style>
                <circle
                  className="check-circle"
                  cx="26" cy="26" r="25"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <polyline
                  className="check-mark"
                  points="14,26 22,34 38,18"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-coffee)', marginBottom: '12px' }}>
              Check your email
            </h1>
            <p style={{ color: '#4A3A34', marginBottom: '8px' }}>
              We&apos;ve sent a confirmation link to
            </p>
            <p style={{ fontWeight: '700', color: 'var(--color-coffee)', marginBottom: '16px' }}>
              {formData.email}
            </p>
            <p style={{ color: '#6B5A52', fontSize: '0.9rem' }}>
              Click the link in the email to activate your account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <Image
            src="/brand/notime-storage-logo.png"
            alt="NoTime Storage"
            width={60}
            height={60}
          />
        </div>
        
        <div className="auth-header">
          <h1>Create your account</h1>
          <p>Start storing your belongings with NoTime Storage</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(555) 123-4567"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              minLength={8}
              required
            />
            <small>Must be at least 8 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              minLength={8}
              required
            />
          </div>

          <button 
            type="submit" 
            className="button-primary" 
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <div className="auth-footer">
            Already have an account? <Link href="/auth/login">Log in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
