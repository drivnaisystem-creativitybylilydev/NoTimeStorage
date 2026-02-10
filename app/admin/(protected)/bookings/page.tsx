import { getBookings, type BookingsFilters } from '@/lib/admin/actions';
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
    search?: string;
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
  };
  const sortBy = params.sortBy || 'move_out_date';
  const sortOrder = params.sortOrder || 'desc';

  const { bookings, total } = await getBookings(page, 25, filters, sortBy, sortOrder);

  return <BookingsTable initialBookings={bookings} total={total} currentPage={page} filters={filters} sortBy={sortBy} sortOrder={sortOrder} />;
}
