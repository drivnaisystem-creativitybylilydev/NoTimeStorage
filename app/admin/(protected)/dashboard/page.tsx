import { getDashboardStats } from '@/lib/admin/actions';
import { StatsCard } from '@/app/components/admin/StatsCard';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();
  const revenueDisplay = `$${stats.revenueThisMonth.toFixed(2)}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: 'var(--color-coffee)',
            marginBottom: '4px',
          }}
        >
          Admin Overview
        </h1>
        <p style={{ fontSize: '0.98rem', color: 'var(--color-gray-600)' }}>
          High-level snapshot of all NoTime Storage bookings. This is only visible to admins/owners.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
        }}
      >
        <StatsCard
          label="Total bookings"
          value={stats.totalBookings.toString()}
          helper="All bookings across all time"
        />
        <StatsCard
          label="Active bookings"
          value={stats.activeBookings.toString()}
          helper="Pending or confirmed (not cancelled)"
          tone="success"
        />
        <StatsCard
          label="Revenue this month"
          value={revenueDisplay}
          helper="Sum of paid bookings created this calendar month"
        />
        <StatsCard
          label="Unpaid bookings"
          value={stats.unpaidBookings.toString()}
          helper="Bookings that still need payment"
          tone="warning"
        />
      </div>
    </div>
  );
}

