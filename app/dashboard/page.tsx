import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { BookingCard } from './BookingCard';
import { PackingGuide } from './PackingGuide';
import { AuthPageWrapper } from '@/app/components/AuthPageWrapper';
import { ProfileEditor } from './ProfileEditor';
import { LogoutButton } from './LogoutButton';
import { MoveInConfirmCard } from './MoveInConfirmCard';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';
import { ensureProfileRowForUser } from '@/lib/auth/ensure-profile';
import { SyncAccountButton } from './SyncAccountButton';

type BookingItem = { item_type: string; quantity: number; monthly_rate: number; subtotal: number };
type BookingRow = {
  id: string;
  status: string;
  move_out_date: string;
  move_in_date: string;
  move_out_time_slot: string;
  dorm: string;
  elevator_available: boolean;
  stairs_required: boolean;
  school: string;
  total_monthly_rate: number;
  total_price: number;
  storage_months: number;
  payment_status: string;
  box_quantity: number;
  created_at: string;
  move_in_dorm: string | null;
  move_in_room: string | null;
  move_in_confirmed_at: string | null;
  special_instructions: string | null;
  booking_items: BookingItem[] | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  await ensureProfileRowForUser(user);

  // Resolve profile (same as create-booking: id or auth_id)
  const { data: profile } = await supabase
    .from('users')
    .select('id, full_name, email, phone, school, deposit_paid')
    .or(`id.eq.${user.id},auth_id.eq.${user.id}`)
    .limit(1)
    .single();

  // Backfill name/phone from auth metadata so admin and bookings show correct details
  const meta = user.user_metadata ?? {};
  const metaName = (meta.full_name as string)?.trim();
  const metaPhone = (meta.phone as string)?.trim();
  if (profile?.id && (metaName || metaPhone) && (!profile.full_name?.trim() || !profile.phone?.trim())) {
    await supabase
      .from('users')
      .update({
        ...(metaName && { full_name: metaName }),
        ...(metaPhone && { phone: metaPhone }),
        ...(!profile.email && user.email && { email: user.email }),
      })
      .eq('id', profile.id);
  }

  // Use profile when available, fall back to auth user (e.g. email from auth)
  const displayName = profile?.full_name || metaName || user.user_metadata?.full_name || 'there';
  const displayEmail = profile?.email ?? user.email ?? '—';
  const displayPhone = profile?.phone || user.user_metadata?.phone || '';
  const displaySchool = profile?.school || 'Stonehill College';
  const depositPaid = profile?.deposit_paid === true;

  // Fetch user's bookings with line items (user_id = public.users.id)
  const profileId = profile?.id ?? user.id;
  const { data: rawBookings } = await supabase
    .from('bookings')
    .select(`
      id,
      status,
      move_out_date,
      move_in_date,
      move_out_time_slot,
      dorm,
      elevator_available,
      stairs_required,
      school,
      total_monthly_rate,
      total_price,
      storage_months,
      payment_status,
      box_quantity,
      created_at,
      move_in_dorm,
      move_in_room,
      move_in_confirmed_at,
      special_instructions,
      booking_items ( item_type, quantity, monthly_rate, subtotal )
    `)
    .eq('user_id', profileId)
    .order('created_at', { ascending: false })
    .returns<BookingRow[]>();
  const bookings: BookingRow[] = rawBookings ?? [];

  return (
    <AuthPageWrapper>
        <div
          className="dashboard-main"
          style={{
            maxWidth: 'min(900px, 100%)',
            width: '100%',
            background: 'white',
            borderRadius: '16px',
            padding: 'clamp(14px, 4vw, 48px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
            boxSizing: 'border-box',
            minWidth: 0,
          }}
        >
          {/* Header - matches Configure page */}
          <div style={{ textAlign: 'center', marginBottom: 'clamp(24px, 6vw, 48px)' }}>
            <div className="auth-logo">
              <Link href="/">
                <Image
                  src="/brand/notime-storage-logo.png"
                  alt="NoTime Storage"
                  width={80}
                  height={80}
                />
              </Link>
            </div>
            <h1 style={{ fontSize: 'clamp(1.5rem, 5.5vw, 2.25rem)', fontWeight: '800', color: 'var(--color-coffee)', marginBottom: '12px', wordBreak: 'break-word' }}>
              Welcome, {displayName}!
            </h1>
            <p style={{ fontSize: 'clamp(0.95rem, 3.5vw, 1.125rem)', color: 'var(--color-gray-600)' }}>
              Your NoTime Storage Dashboard
            </p>
          </div>

          {/* Your Profile - editable */}
          <div style={{ marginBottom: '40px', padding: 'clamp(16px, 4vw, 32px)', background: 'var(--color-paper)', borderRadius: '12px', border: '2px solid var(--color-latte)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-coffee)', marginBottom: '16px' }}>
              👤 Your Profile
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-gray-600)', marginBottom: '16px' }}>
              Update your contact info below. Changes are saved to your account and used for bookings.
            </p>
            <ProfileEditor
              profileId={profile?.id ?? user.id}
              initialEmail={displayEmail}
              initialPhone={displayPhone}
              initialSchool={displaySchool}
            />
          </div>

          {/* Deposit banner — shown only when deposit not yet paid */}
          {!depositPaid && (
            <div style={{
              marginBottom: '32px', padding: '24px 28px',
              background: 'linear-gradient(135deg, #4B2E25 0%, #7A4A35 100%)',
              borderRadius: '12px', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap',
            }}>
              <div>
                <p style={{ color: '#F7ECD8', fontWeight: '700', fontSize: '1.05rem', marginBottom: '4px' }}>
                  One step left to unlock your storage
                </p>
                <p style={{ color: '#C9A47E', fontSize: '0.875rem', margin: 0 }}>
                  Pay the $50 commitment fee to start booking — it&apos;s deducted from your total storage bill.
                </p>
              </div>
              <Link href="/deposit">
                <button type="button" style={{
                  background: '#C9A47E', color: '#2D1A0E', fontWeight: '700',
                  padding: '10px 24px', borderRadius: '8px', border: 'none',
                  cursor: 'pointer', fontSize: '0.95rem', whiteSpace: 'nowrap',
                }}>
                  Pay $50 Deposit →
                </button>
              </Link>
            </div>
          )}

          {/* Move-In Delivery Confirmation — shown 28 days before move-in for confirmed bookings */}
          {(() => {
            const now = new Date();
            const upcoming = bookings.find(b => {
              if (!b.move_in_date || b.status === 'cancelled') return false;
              const moveIn = new Date(b.move_in_date + 'T12:00:00');
              const daysUntil = (moveIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
              return daysUntil <= 28 && daysUntil >= 0;
            });
            if (!upcoming) return null;
            return (
              <MoveInConfirmCard
                bookingId={upcoming.id}
                moveInDate={upcoming.move_in_date}
                currentSchool={upcoming.school}
                currentMoveInDorm={upcoming.move_in_dorm}
                currentMoveInRoom={upcoming.move_in_room}
                currentSpecialInstructions={upcoming.special_instructions}
                confirmedAt={upcoming.move_in_confirmed_at}
              />
            );
          })()}

          {/* Your Bookings */}
          <div style={{ marginBottom: '40px', padding: 'clamp(16px, 4vw, 32px)', background: 'var(--color-paper)', borderRadius: '12px', border: '2px solid var(--color-latte)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-coffee)', marginBottom: '24px' }}>
              📦 Your Bookings
            </h2>
            {bookings.length === 0 ? (
              <>
                <p style={{ fontSize: '1rem', color: 'var(--color-gray-600)', marginBottom: '24px' }}>
                  You don&apos;t have any active bookings yet.
                </p>
                <Link href={depositPaid ? '/booking/configure' : '/deposit'}>
                  <button type="button" className="button-primary" style={{ fontSize: '1rem', padding: '0.875rem 2rem' }}>
                    {depositPaid ? 'Book Your First Storage' : 'Pay Deposit to Book'}
                  </button>
                </Link>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {bookings.map((b) => (
                  <BookingCard key={b.id} booking={b as import('./BookingCard').BookingRow} />
                ))}
                <Link href={depositPaid ? '/booking/configure' : '/deposit'}>
                  <button type="button" className="button-primary" style={{ fontSize: '1rem', padding: '0.875rem 2rem', alignSelf: 'flex-start' }}>
                    {depositPaid ? 'Book Another Storage' : 'Pay Deposit to Book More'}
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* How to Pack Your Box — collapsible */}
          <PackingGuide />

          {/* Need Help */}
          <div style={{ padding: 'clamp(16px, 4vw, 32px)', background: 'var(--color-paper)', borderRadius: '12px', border: '2px solid var(--color-latte)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-coffee)', marginBottom: '6px' }}>
              🙋 Need Help?
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-gray-600)', marginBottom: '24px', marginTop: 0 }}>
              We&apos;re here for you — reach out any time and we&apos;ll get back to you quickly.
            </p>

            <div className="help-section" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Email */}
              <a
                href={`mailto:${SITE_CONTACT_EMAIL}`}
                style={{ textDecoration: 'none', display: 'block', padding: '4px 0' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>✉️</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-coffee)', textDecoration: 'none' }}>Email us</span>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-500)', paddingLeft: '2px', textDecoration: 'none' }}>{SITE_CONTACT_EMAIL}</div>
              </a>

              {/* FAQ / Contact page */}
              <SyncAccountButton />

              <Link
                href="/#contact"
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '16px 20px',
                  background: 'var(--color-coffee)',
                  borderRadius: '10px',
                  border: '1.5px solid var(--color-coffee)',
                  textDecoration: 'none',
                  marginTop: '4px',
                }}
              >
                <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>💬</span>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#FFF8F0', textDecoration: 'none' }}>Visit our contact page</div>
                  <div style={{ fontSize: '0.8125rem', color: 'rgba(255,248,240,0.65)', marginTop: '1px', textDecoration: 'none' }}>FAQs, contact form &amp; more</div>
                </div>
                <svg style={{ marginLeft: 'auto', flexShrink: 0, color: 'rgba(255,248,240,0.7)' }} width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10h12m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </Link>

            </div>
          </div>
          <LogoutButton />
        </div>
      </AuthPageWrapper>
  );
}
