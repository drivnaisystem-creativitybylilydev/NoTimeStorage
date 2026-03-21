'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { SCHOOL_NAMES } from '@/lib/schools/config';
import { AuthPageWrapper } from '@/app/components/AuthPageWrapper';
import { SUPPORTED_COUNTRIES, normalizePhoneForStorage, formatPhoneForDisplay } from '@/lib/phone/format';

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
    phoneCountry: 'US',
    fullName: '',
    school: '',
    parentEmail: '',
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
      const normalizedPhone = normalizePhoneForStorage(formData.phone, formData.phoneCountry as any);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: `${formData.firstName} ${formData.lastName}`,
            phone: normalizedPhone,
            school: formData.school,
            parent_email: formData.parentEmail || null,
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
            <p style={{ color: '#9B8880', fontSize: '0.8rem', marginTop: '12px', padding: '8px 12px', background: 'var(--color-paper)', borderRadius: '8px', border: '1px solid var(--color-latte)' }}>
              📬 Don&apos;t see it? Check <strong>junk or spam</strong>. If you used a <strong>.edu</strong> address, the email may be blocked — sign up again with a <strong>personal email</strong> if nothing arrives within a few minutes.
            </p>
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
          <h1>Create your account</h1>
          <p>Start storing your belongings with NoTime Storage</p>
        </div>

        <div
          role="note"
          style={{
            marginBottom: '20px',
            padding: '14px 16px',
            borderRadius: '12px',
            border: '1px solid rgba(92, 64, 51, 0.25)',
            background: 'linear-gradient(135deg, rgba(250, 247, 242, 0.95) 0%, rgba(232, 220, 208, 0.5) 100%)',
            fontSize: '0.875rem',
            lineHeight: 1.5,
            color: '#3d2f26',
          }}
        >
          <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--color-coffee)' }}>
            Use a personal email for this account
          </strong>
          Sign up with <strong>Gmail, Outlook, iCloud, or Yahoo</strong> — not your school (.edu) address. We send a{' '}
          <strong>confirmation link</strong> and <strong>password resets</strong> to this email, and many colleges block
          or delay those messages.
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
            <label htmlFor="email">Email (login &amp; confirmations)</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              autoComplete="email"
              placeholder="you@gmail.com"
            />
            <small style={{ display: 'block', marginTop: '8px', color: '#6b5a52', lineHeight: 1.45 }}>
              This must be an inbox you can open anytime — same email for logging in and resetting your password.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'stretch' }}>
              <select
                id="phoneCountry"
                value={formData.phoneCountry}
                onChange={(e) => setFormData({ ...formData, phoneCountry: e.target.value })}
                style={{
                  width: '3.25rem',
                  minWidth: '3.25rem',
                  padding: '0',
                  border: '2px solid var(--color-latte)',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  fontSize: '0.95rem',
                  color: 'var(--color-coffee)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  appearance: 'auto',
                }}
              >
                {SUPPORTED_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: formatPhoneForDisplay(e.target.value, formData.phoneCountry as any) })
                }
                placeholder="(555) 123-4567"
                required
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  border: '2px solid var(--color-latte)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="parentEmail">Parent / Guardian Email <span style={{ color: '#9CA3AF', fontWeight: '400' }}>(optional)</span></label>
            <input
              type="email"
              id="parentEmail"
              value={formData.parentEmail}
              onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
              placeholder="parent@example.com"
            />
            <small>They&apos;ll receive copies of all booking confirmations</small>
          </div>

          <div className="form-group">
            <label htmlFor="school">Your College</label>
            <select
              id="school"
              value={formData.school}
              onChange={(e) => setFormData({ ...formData, school: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '2px solid var(--color-latte)',
                borderRadius: '8px',
                fontSize: '1rem',
                color: formData.school ? 'var(--color-coffee)' : '#9CA3AF',
                backgroundColor: 'white',
                cursor: 'pointer',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%234B2E25' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
              }}
            >
              <option value="" disabled>Select your college</option>
              {SCHOOL_NAMES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
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
    </AuthPageWrapper>
  );
}
