import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AuthPageWrapper } from '@/app/components/AuthPageWrapper';
import { DepositSuccessPoller } from './DepositSuccessPoller';

export const dynamic = 'force-dynamic';

export default async function DepositSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?redirect=/deposit');

  const { data: profile } = await supabase
    .from('users')
    .select('deposit_paid')
    .or(`id.eq.${user.id},auth_id.eq.${user.id}`)
    .limit(1)
    .maybeSingle();

  // Webhook already landed on the server — straight to booking.
  if (profile?.deposit_paid) redirect('/booking/configure');

  return (
    <AuthPageWrapper>
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-logo">
          <Image src="/brand/notime-storage-logo.png" alt="NoTime Storage" width={60} height={60} />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-coffee)', marginBottom: '10px' }}>
          Confirming your deposit…
        </h1>
        <p style={{ color: '#6B5A52', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '20px' }}>
          Your payment went through. We&apos;re unlocking booking now — this usually takes just a few seconds.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '3px solid var(--color-latte)',
              borderTopColor: 'transparent',
              animation: 'spin 0.9s linear infinite',
            }}
          />
        </div>

        <DepositSuccessPoller />

        <p style={{ color: '#9E8E88', fontSize: '0.8rem', marginTop: '20px' }}>
          Taking longer than usual? You can safely close this tab — we&apos;ll email you when booking unlocks.
        </p>

        <div style={{ marginTop: '20px' }}>
          <Link href="/dashboard" style={{ color: 'var(--color-latte)', fontSize: '0.85rem', textDecoration: 'underline' }}>
            Back to dashboard
          </Link>
        </div>

        {/* Hidden session_id for debugging in inspector if needed */}
        {session_id && (
          <div style={{ display: 'none' }} data-session-id={session_id} />
        )}

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </AuthPageWrapper>
  );
}
