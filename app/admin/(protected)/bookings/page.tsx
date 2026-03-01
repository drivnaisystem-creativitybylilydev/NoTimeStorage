import { getBookings, getDashboardStats, type BookingsFilters } from '@/lib/admin/actions';
import { StatsCard } from '@/app/components/admin/StatsCard';
import { BookingsTable } from './BookingsTable';

export const dynamic = 'force-dynamic';

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    status?: string;
    payment_status?: string;
    dateType?: 'move_out' | 'move_in' | 'created';
    dateFrom?: string;
    dateTo?: string;
    school?: string;
    dorm?: string;
    search?: string;
    userId?: string;
    sortBy?: 'move_out_date' | 'move_in_date' | 'created_at';
    sortOrder?: 'asc' | 'desc';
  }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const filters: BookingsFilters = {
    status: params.status,
    payment_status: params.payment_status,
    dateType: params.dateType || 'move_out',
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    school: params.school,
    dorm: params.dorm,
    search: params.search,
    userId: params.userId,
  };
  const sortBy = params.sortBy || 'move_out_date';
  const sortOrder = params.sortOrder || 'desc';

  const [stats, { bookings, total }] = await Promise.all([
    getDashboardStats(),
    getBookings(page, 25, filters, sortBy, sortOrder),
  ]);

  const revenueDisplay = `$${stats.revenueThisMonth.toFixed(2)}`;
  const revenueBreakdown = [
    { label: 'This week', value: `$${stats.revenueThisWeek.toFixed(2)}` },
    { label: 'Today', value: `$${stats.revenueToday.toFixed(2)}` },
  ];

  return (
    <div className="admin-page" style={{ display: 'flex', flexDirection: 'column', gap: '64px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h1 className="admin-title">Bookings</h1>
        <p className="admin-subtitle">
          High-level snapshot and manage all student bookings. Filter, search, and take actions.
        </p>
      </div>

      <div className="admin-stats-grid">
        <StatsCard
          label="Total bookings"
          value={stats.totalBookings.toString()}
          helper="All bookings across all time"
          icon="layers"
        />
        <StatsCard
          label="Active bookings"
          value={stats.activeBookings.toString()}
          helper="Pending or confirmed (not cancelled)"
          tone="success"
          icon="check-circle"
        />
        <StatsCard
          label="Revenue this month"
          value={revenueDisplay}
          breakdown={revenueBreakdown}
          helper="Sum of paid bookings (this month). Week and today below."
          tone="revenue"
          icon="dollar"
        />
        <StatsCard
          label="Unpaid bookings"
          value={stats.unpaidBookings.toString()}
          helper="Bookings that still need payment"
          tone="warning"
          icon="alert-circle"
        />
      </div>

      <BookingsTable initialBookings={bookings} total={total} currentPage={page} filters={filters} sortBy={sortBy} sortOrder={sortOrder} />
    </div>
  );
}
