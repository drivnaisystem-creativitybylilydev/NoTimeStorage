import { getCustomers } from '@/lib/admin/actions';
import { CustomersTable } from './CustomersTable';

export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage() {
  const customers = await getCustomers();

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.booking_count > 0).length;
  const noBookings = customers.filter((c) => c.booking_count === 0).length;
  const totalBookings = customers.reduce((sum, c) => sum + c.booking_count, 0);

  return (
    <div className="admin-page" style={{ display: 'flex', flexDirection: 'column', gap: '64px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h1 className="admin-title">Customers</h1>
        <p className="admin-subtitle">
          All registered students. Click "View Bookings" to jump to their bookings.
        </p>
      </div>

      {/* Stats row */}
      <div className="admin-stats-grid">
        <div className="admin-card" style={{ padding: '32px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-gray-500)', marginBottom: '12px' }}>
            Total Students
          </div>
          <div style={{ fontSize: '40px', fontWeight: 700, color: 'var(--color-gray-900)', lineHeight: 1, marginBottom: '8px' }}>
            {totalCustomers}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-gray-500)' }}>Registered accounts</div>
        </div>

        <div className="admin-card" style={{ padding: '32px', background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#166534', marginBottom: '12px' }}>
            With Bookings
          </div>
          <div style={{ fontSize: '40px', fontWeight: 700, color: '#15803d', lineHeight: 1, marginBottom: '8px' }}>
            {activeCustomers}
          </div>
          <div style={{ fontSize: '13px', color: '#166534' }}>Students who booked storage</div>
        </div>

        <div className="admin-card" style={{ padding: '32px', background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c2410c', marginBottom: '12px' }}>
            No Booking Yet
          </div>
          <div style={{ fontSize: '40px', fontWeight: 700, color: '#c2410c', lineHeight: 1, marginBottom: '8px' }}>
            {noBookings}
          </div>
          <div style={{ fontSize: '13px', color: '#c2410c' }}>Signed up but not booked</div>
        </div>

        <div className="admin-card" style={{ padding: '32px', background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3730a3', marginBottom: '12px' }}>
            Total Bookings
          </div>
          <div style={{ fontSize: '40px', fontWeight: 700, color: '#3730a3', lineHeight: 1, marginBottom: '8px' }}>
            {totalBookings}
          </div>
          <div style={{ fontSize: '13px', color: '#3730a3' }}>Across all customers</div>
        </div>
      </div>

      <CustomersTable customers={customers} />
    </div>
  );
}
