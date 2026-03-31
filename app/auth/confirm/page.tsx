'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { EmailOtpType } from '@supabase/auth-js';
import { createClient } from '@/lib/supabase/client';
import { AuthPageWrapper } from '@/app/components/AuthPageWrapper';
import { sanitizeNext } from '@/lib/auth/sanitize-next';
import { finalizeAuthCallback } from '@/app/auth/callback/actions';

const OTP_TYPES = new Set([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
]);

function hardRedirect(path: string) {
  if (typeof window === 'undefined') return;
  const url = path.startsWith('http')
    ? path
    : `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`;
  window.location.replace(url);
}

/**
 * Email links land here with ?token_hash=&type=&next= — works in any in-app browser or mail client
 * because we use verifyOtp (no PKCE code_verifier). Links from the Send Email hook point here.
 */
function ConfirmContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Confirming your email...');

  const tokenHash = searchParams.get('token_hash');
  const typeRaw = searchParams.get('type');
  const nextParam = searchParams.get('next');

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const nextPath = sanitizeNext(nextParam);

      if (!tokenHash?.trim() || !typeRaw || !OTP_TYPES.has(typeRaw)) {
        hardRedirect('/auth/login?error=auth');
        return;
      }

      const supabase = createClient();
      const otpType = typeRaw as EmailOtpType;

      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash.trim(),
        type: otpType,
      });

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (error) {
          console.error('[auth/confirm] verifyOtp:', error.message);
        }
        if (!cancelled) {
          const q =
            error?.message?.toLowerCase().includes('expired') ||
            error?.message?.toLowerCase().includes('invalid')
              ? 'error=expired'
              : 'error=auth';
          hardRedirect(`/auth/login?${q}`);
        }
        return;
      }

      await finalizeAuthCallback();

      if (!cancelled) {
        setStatus('Redirecting...');
        hardRedirect(nextPath);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [tokenHash, typeRaw, nextParam]);

  return (
    <AuthPageWrapper>
      <div className="auth-card">
        <p style={{ textAlign: 'center', color: 'var(--color-gray-600)' }}>{status}</p>
      </div>
    </AuthPageWrapper>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense
      fallback={
        <AuthPageWrapper>
          <div className="auth-card">
            <p style={{ textAlign: 'center', color: 'var(--color-gray-600)' }}>Loading...</p>
          </div>
        </AuthPageWrapper>
      }
    >
      <ConfirmContent />
    </Suspense>
  );
}
