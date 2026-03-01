import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { BookingCard } from './BookingCard';

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
  booking_items: BookingItem[] | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

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
  const displayPhone = profile?.phone || user.user_metadata?.phone || '—';
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
      booking_items ( item_type, quantity, monthly_rate, subtotal )
    `)
    .eq('user_id', profileId)
    .order('created_at', { ascending: false })
    .returns<BookingRow[]>();
  const bookings: BookingRow[] = rawBookings ?? [];

  return (
    <div>
      {/* Dashboard Header */}
      <header className="header">
        <div className="header-container">
          <Link href="/" className="header-logo">
            <Image
              src="/brand/notime-storage-logo.png"
              alt="NoTime Storage"
              width={50}
              height={50}
              className="header-logo-image"
            />
            <span className="header-logo-text">NoTime Storage</span>
          </Link>

          <nav className="header-nav">
            <Link href="/">Home</Link>
            <Link href="/#pricing">Pricing</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href={depositPaid ? '/booking/configure' : '/deposit'} className="header-cta">
              Book Storage
            </Link>
          </nav>

          <form action="/auth/signout" method="post" style={{ margin: 0 }}>
            <button 
              type="submit"
              className="header-login"
              style={{ cursor: 'pointer' }}
            >
              Sign Out
            </button>
          </form>
        </div>
      </header>

      {/* Dashboard Content - same layout as booking pages */}
      <div className="auth-container">
        <div style={{ maxWidth: '900px', width: '100%', background: 'white', borderRadius: '16px', padding: '48px', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
          {/* Header - matches Configure page */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <Link href="/">
              <Image
                src="/brand/notime-storage-logo.png"
                alt="NoTime Storage"
                width={80}
                height={80}
                style={{ marginBottom: '24px' }}
              />
            </Link>
            <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--color-coffee)', marginBottom: '12px' }}>
              Welcome, {displayName}!
            </h1>
            <p style={{ fontSize: '1.125rem', color: 'var(--color-gray-600)' }}>
              Your NoTime Storage Dashboard
            </p>
          </div>

          {/* Your Profile - same card style as Storage Boxes / Additional Items */}
          <div style={{ marginBottom: '40px', padding: '32px', background: 'var(--color-paper)', borderRadius: '12px', border: '2px solid var(--color-latte)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-coffee)', marginBottom: '24px' }}>
              👤 Your Profile
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--color-latte-soft)' }}>
                <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-gray-700)' }}>Name</span>
                <span style={{ fontSize: '1rem', color: 'var(--color-coffee)', fontWeight: '500' }}>{displayName === 'there' ? '—' : displayName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--color-latte-soft)' }}>
                <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-gray-700)' }}>Email</span>
                <span style={{ fontSize: '1rem', color: 'var(--color-coffee)', fontWeight: '500', wordBreak: 'break-all' }}>{displayEmail}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--color-latte-soft)' }}>
                <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-gray-700)' }}>Phone</span>
                <span style={{ fontSize: '1rem', color: 'var(--color-coffee)', fontWeight: '500' }}>{displayPhone}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-gray-700)' }}>School</span>
                <span style={{ fontSize: '1rem', color: 'var(--color-coffee)', fontWeight: '500' }}>{displaySchool}</span>
              </div>
            </div>
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

          {/* Your Bookings */}
          <div style={{ marginBottom: '40px', padding: '32px', background: 'var(--color-paper)', borderRadius: '12px', border: '2px solid var(--color-latte)' }}>
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

          {/* Quick Actions */}
          <div style={{ padding: '32px', background: 'var(--color-paper)', borderRadius: '12px', border: '2px solid var(--color-latte)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-coffee)', marginBottom: '24px' }}>
              ⚡ Quick Actions
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--color-gray-600)', marginBottom: '16px' }}>
              More features coming soon.
            </p>
            <ul style={{ margin: 0, paddingLeft: '24px', color: 'var(--color-gray-700)', fontSize: '1rem', lineHeight: '1.8' }}>
              <li>View your bookings</li>
              <li>Schedule pickup/delivery</li>
              <li>Manage payment methods</li>
              <li>Update account settings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
