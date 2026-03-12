'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SCHOOL_NAMES } from '@/lib/schools/config';
import { SUPPORTED_COUNTRIES, normalizePhoneForStorage, formatPhoneForDisplay, type CountryCode } from '@/lib/phone/format';

type ProfileEditorProps = {
  profileId: string;
  initialEmail: string;
  initialPhone: string;
  initialSchool: string;
};

export function ProfileEditor({ profileId, initialEmail, initialPhone, initialSchool }: ProfileEditorProps) {
  const supabase = createClient();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState(initialEmail);
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>('US');
  const [phone, setPhone] = useState(formatPhoneForDisplay(initialPhone || '', phoneCountry));
  const [school, setSchool] = useState(initialSchool);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [emailChangePending, setEmailChangePending] = useState(false);

  const initialDisplayPhone = useMemo(
    () => formatPhoneForDisplay(initialPhone || '', phoneCountry),
    [initialPhone, phoneCountry]
  );

  const emailChanged = email.trim() !== (initialEmail || '').trim();

  const isDirty =
    emailChanged ||
    school.trim() !== (initialSchool || '').trim() ||
    phone.trim() !== initialDisplayPhone.trim();

  useEffect(() => {
    if (!showSuccess) return;
    const id = setTimeout(() => setShowSuccess(false), 3000);
    return () => clearTimeout(id);
  }, [showSuccess]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const normalizedPhone = normalizePhoneForStorage(phone, phoneCountry);

      // Update auth user email + metadata
      const { error: authError } = await supabase.auth.updateUser({
        email,
        data: {
          phone: normalizedPhone,
          school,
        },
      });
      if (authError) throw authError;

      // Update profile row
      const { error: profileError } = await supabase
        .from('users')
        .update({
          email,
          phone: normalizedPhone,
          school,
        })
        .eq('id', profileId);
      if (profileError) throw profileError;

      if (emailChanged) {
        setEmailChangePending(true);
        setEditing(false);
      } else {
        setEditing(false);
        setShowSuccess(true);
      }
    } catch (e: any) {
      const msg = (e?.message || '').toString();
      const code = e?.code;

      if (code === '23505' || msg.includes('users_email_key') || msg.toLowerCase().includes('duplicate key')) {
        setError('That email address is already in use. Please use a different email.');
      } else if (code === 'email_address_conflict' || msg.toLowerCase().includes('already registered')) {
        setError('That email address is already in use. Please use a different email.');
      } else {
        setError('Could not save your changes. Please try again. If this keeps happening, contact support.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Read-only or edit content */}
      {!editing ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--color-latte-soft)' }}>
              <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-gray-700)' }}>Email</span>
              <span style={{ fontSize: '1rem', color: 'var(--color-coffee)', fontWeight: '500', wordBreak: 'break-all' }}>{email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--color-latte-soft)' }}>
              <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-gray-700)' }}>Phone</span>
              <span style={{ fontSize: '1rem', color: 'var(--color-coffee)', fontWeight: '500' }}>{formatPhoneForDisplay(phone, phoneCountry)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-gray-700)' }}>School</span>
              <span style={{ fontSize: '1rem', color: 'var(--color-coffee)', fontWeight: '500' }}>{school}</span>
            </div>
          </div>
          <button
            type="button"
            className="button-secondary"
            style={{ marginTop: '16px' }}
            onClick={() => setEditing(true)}
          >
            Edit profile
          </button>
        </>
      ) : (
        <>
          {/* Back arrow to exit edit mode */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError(null);
                setEmail(initialEmail);
                setPhone(initialDisplayPhone);
                setSchool(initialSchool);
              }}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--color-coffee)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                padding: '4px 0',
              }}
            >
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                borderRadius: '999px',
                border: '1px solid var(--color-latte)',
                fontSize: '0.85rem',
              }}>
                ←
              </span>
              <span style={{ fontSize: '0.85rem' }}>Back to profile</span>
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!saving && isDirty) void handleSave();
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.9rem', color: 'var(--color-gray-700)' }}>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--color-latte)' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.9rem', color: 'var(--color-gray-700)' }}>
              Phone
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'stretch' }}>
                <select
                  value={phoneCountry}
                  onChange={(e) => setPhoneCountry(e.target.value as any)}
                  style={{
                    width: '3.25rem',
                    minWidth: '3.25rem',
                    padding: '0',
                    borderRadius: '8px',
                    border: '2px solid var(--color-latte)',
                    backgroundColor: 'white',
                    fontSize: '0.95rem',
                    color: 'var(--color-coffee)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    appearance: 'auto',
                  }}
                >
                  {SUPPORTED_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneForDisplay(e.target.value, phoneCountry))}
                  required
                  style={{
                    flex: 1,
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    border: '2px solid var(--color-latte)',
                  }}
                />
              </div>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.9rem', color: 'var(--color-gray-700)' }}>
              School
              <select
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                required
                style={{
                  padding: '0.6rem 0.8rem',
                  borderRadius: '8px',
                  border: '2px solid var(--color-latte)',
                  backgroundColor: 'white',
                  fontSize: '0.95rem',
                  color: school ? 'var(--color-coffee)' : '#9CA3AF',
                  cursor: 'pointer',
                }}
              >
                <option value="" disabled>Select your school</option>
                {SCHOOL_NAMES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                type="submit"
                className="button-primary"
                disabled={saving || !isDirty}
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={() => {
                  setEditing(false);
                  setError(null);
                  setEmail(initialEmail);
                  setPhone(formatPhoneForDisplay(initialPhone || '', phoneCountry));
                  setSchool(initialSchool);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </>
      )}

      {showSuccess && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'var(--color-coffee)',
            color: 'var(--color-latte-soft)',
            padding: '10px 16px',
            borderRadius: '999px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 110,
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>✓</span>
          <span>Profile updated. Check your email if you changed it.</span>
        </div>
      )}

      {emailChangePending && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 120,
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              background: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
              padding: '28px 28px 24px',
              textAlign: 'center',
            }}
          >
            <div style={{ marginBottom: '16px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '56px',
                  height: '56px',
                  borderRadius: '999px',
                  background: 'rgba(75,46,37,0.08)',
                  color: 'var(--color-coffee)',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                }}
              >
                ✉️
              </span>
            </div>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: 'var(--color-coffee)',
                marginBottom: '10px',
              }}
            >
              Check your email to confirm
            </h2>
            <p
              style={{
                fontSize: '0.95rem',
                color: '#4A3A34',
                lineHeight: 1.6,
                marginBottom: '16px',
              }}
            >
              We&apos;ve sent a confirmation link related to this change.
              You&apos;ll need to follow the instructions in that email before you can sign in with your new address.
            </p>
            <p
              style={{
                fontSize: '0.85rem',
                color: '#9B8880',
                lineHeight: 1.6,
                marginBottom: '20px',
              }}
            >
              Depending on your email provider, you may receive a message at your
              <strong> current</strong> email, your <strong>new</strong> email, or both.
              Until you confirm as instructed there, the new email won&apos;t work for login and
              you may see errors if you try to sign in.
            </p>
            <button
              type="button"
              className="button-primary"
              style={{ width: '100%' }}
              onClick={async () => {
                try {
                  await supabase.auth.signOut();
                } catch {
                  // ignore
                } finally {
                  router.push('/auth/login');
                }
              }}
            >
              Go to login
            </button>
          </div>
        </div>
      )}
    </>
  );
}

