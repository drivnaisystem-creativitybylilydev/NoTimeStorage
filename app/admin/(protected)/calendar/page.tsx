import { getCalendarBookings } from '@/lib/admin/actions';
import { CalendarView } from './CalendarView';

export default async function CalendarPage() {
  const bookings = await getCalendarBookings();

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-coffee)', margin: '0 0 6px' }}>
          Move-out Calendar
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-gray-500)', margin: 0 }}>
          All scheduled move-out pickups across partner campuses.
        </p>
      </div>

      <CalendarView bookings={bookings} />
    </div>
  );
}
