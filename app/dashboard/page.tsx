import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { BookingCard } from './BookingCard';
import { DashboardHeader } from './DashboardHeader';

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
      <DashboardHeader depositPaid={depositPaid} />

      {/* Dashboard Content - same layout as booking pages */}
      <div className="auth-container">
        <div style={{ maxWidth: '900px', width: '100%', background: 'white', borderRadius: '16px', padding: 'clamp(20px, 5vw, 48px)', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
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
          <div style={{ marginBottom: '40px', padding: 'clamp(16px, 4vw, 32px)', background: 'var(--color-paper)', borderRadius: '12px', border: '2px solid var(--color-latte)' }}>
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

          {/* How to Pack Your Box */}
          <div style={{ marginBottom: '40px', padding: 'clamp(16px, 4vw, 32px)', background: 'var(--color-paper)', borderRadius: '12px', border: '2px solid var(--color-latte)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-coffee)', marginBottom: '8px' }}>
              📦 How to Pack Your Box
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-gray-600)', marginBottom: '24px' }}>
              Follow these guidelines so your pickup goes smoothly and nothing gets damaged in storage.
            </p>

            {/* Box specs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              {[
                { icon: '📏', label: 'Dimensions', value: '40″ × 30″ × 30″' },
                { icon: '⚖️', label: 'Max Weight', value: 'Up to 225 lbs' },
                { icon: '🧊', label: 'Volume', value: '≈ 4 mini fridges' },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ background: 'white', borderRadius: '10px', padding: '16px', border: '1px solid var(--color-latte-soft)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-gray-600)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-coffee)' }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Packing tips */}
            <div style={{ background: 'white', borderRadius: '10px', padding: '20px', border: '1px solid var(--color-latte-soft)', marginBottom: '16px' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-coffee)', marginBottom: '12px' }}>✅ What fits inside</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-gray-700)', lineHeight: '1.6', margin: 0 }}>
                Bedding, pillows, clothes, shoes, books, school supplies, small appliances, wall decor, and more — everything you need packed into one secure box.
              </p>
            </div>

            {/* Packing steps */}
            <div style={{ background: 'white', borderRadius: '10px', padding: '20px', border: '1px solid var(--color-latte-soft)', marginBottom: '16px' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-coffee)', marginBottom: '12px' }}>🗂️ Packing steps</p>
              <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: 'var(--color-gray-700)', lineHeight: '2' }}>
                <li>Place heavier items (books, shoes) at the <strong>bottom</strong>.</li>
                <li>Fill gaps with soft items (clothes, bedding) to prevent shifting.</li>
                <li>Do <strong>not</strong> exceed the <strong>225 lb weight limit</strong> — overstuffed boxes may be refused.</li>
                <li>Keep contents below the rim so the lid sits flat — no bulging lids.</li>
                <li>Tape <strong>all flaps securely shut</strong> with strong packing tape before pickup.</li>
              </ol>
            </div>

            {/* Warning disclaimer */}
            <div style={{
              background: '#FFF8E1',
              border: '1.5px solid #F5C842',
              borderRadius: '10px',
              padding: '16px 20px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: '1.25rem', flexShrink: 0, marginTop: '1px' }}>⚠️</span>
              <div style={{ fontSize: '0.875rem', color: '#5A4A00', lineHeight: '1.65' }}>
                <strong>Important reminders:</strong>
                <ul style={{ margin: '6px 0 0', paddingLeft: '18px' }}>
                  <li><strong>No liquids</strong> of any kind inside the box.</li>
                  <li><strong>All flaps must be taped shut</strong> before our team arrives — untaped boxes may not be accepted.</li>
                  <li><strong>Do not overpack.</strong> If the box cannot close properly or exceeds 225 lbs, additional fees may apply.</li>
                  <li>Fragile items should be individually wrapped in bubble wrap or clothing.</li>
                  <li>Label your box with your name if you have multiple boxes.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ padding: 'clamp(16px, 4vw, 32px)', background: 'var(--color-paper)', borderRadius: '12px', border: '2px solid var(--color-latte)' }}>
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
