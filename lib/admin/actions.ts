'use server';

import { createClient } from '@/lib/supabase/server';

export type DashboardStats = {
  totalBookings: number;
  activeBookings: number;
  revenueThisMonth: number;
  unpaidBookings: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  // Total bookings (all time)
  const { count: totalBookings = 0 } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true });

  // Active bookings (pending / pending_payment / confirmed)
  const { count: activeBookings = 0 } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .in('status', ['pending', 'pending_payment', 'confirmed']);

  // Unpaid bookings (not cancelled, payment_status != 'paid')
  const { count: unpaidBookings = 0 } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .neq('payment_status', 'paid')
    .neq('status', 'cancelled');

  // Revenue this month (sum of total_price for paid bookings created this month)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

  const { data: paidThisMonth = [] } = await supabase
    .from('bookings')
    .select('total_price, created_at')
    .eq('payment_status', 'paid')
    .gte('created_at', monthStart.toISOString())
    .lt('created_at', nextMonthStart.toISOString());

  const revenueThisMonth = paidThisMonth.reduce((sum, row) => {
    const value = (row as any).total_price;
    if (typeof value === 'number') {
      return sum + value;
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return sum + (isNaN(parsed) ? 0 : parsed);
    }
    return sum;
  }, 0);

  return {
    totalBookings,
    activeBookings,
    revenueThisMonth,
    unpaidBookings,
  };
}

export type ActionResult = { success: true } | { success: false; error: string };

/**
 * Mark a booking as paid and confirmed.
 * Designed to be called from admin UI or payment processor webhook.
 * When payment processor integration is added, webhook will call this same function.
 */
export async function markBookingPaid(bookingId: string): Promise<ActionResult> {
  const supabase = await createClient();

  // Verify admin access
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (!adminUser) return { success: false, error: 'Admin access required' };

  // Update booking: set payment_status='paid' and status='confirmed'
  const { error } = await supabase
    .from('bookings')
    .update({
      payment_status: 'paid',
      status: 'confirmed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);

  if (error) {
    console.error('[markBookingPaid]', error);
    return { success: false, error: error.message };
  }

  // TODO: When payment processor is integrated, call onBookingConfirmed hook here
  // For now, we skip it since Airtable may not be configured

  return { success: true };
}

/**
 * Admin override: cancel any booking (even if paid).
 * Use with caution - this is for admin-only cancellation.
 */
export async function adminCancelBooking(bookingId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (!adminUser) return { success: false, error: 'Admin access required' };

  // Delete booking_items first, then booking
  const { error: itemsErr } = await supabase.from('booking_items').delete().eq('booking_id', bookingId);
  if (itemsErr) {
    console.error('[adminCancelBooking] booking_items', itemsErr);
    return { success: false, error: itemsErr.message };
  }

  const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
  if (error) {
    console.error('[adminCancelBooking] bookings', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export type BookingWithCustomer = {
  id: string;
  status: string;
  payment_status: string;
  move_out_date: string;
  move_in_date: string;
  move_out_time_slot: string;
  dorm: string;
  elevator_available: boolean;
  stairs_required: boolean;
  school: string;
  total_price: number;
  total_monthly_rate: number;
  storage_months: number;
  box_quantity: number;
  created_at: string;
  customer: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
};

export type BookingsFilters = {
  status?: string;
  payment_status?: string;
  dateType?: 'move_out' | 'move_in' | 'created';
  dateFrom?: string;
  dateTo?: string;
  school?: string;
  dorm?: string;
  search?: string;
};

export async function getBookings(
  page: number = 1,
  pageSize: number = 25,
  filters?: BookingsFilters,
  sortBy: 'move_out_date' | 'move_in_date' | 'created_at' = 'move_out_date',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<{ bookings: BookingWithCustomer[]; total: number }> {
  const supabase = await createClient();

  let query = supabase
    .from('bookings')
    .select(
      `
      id,
      status,
      payment_status,
      move_out_date,
      move_in_date,
      move_out_time_slot,
      dorm,
      elevator_available,
      stairs_required,
      school,
      total_price,
      total_monthly_rate,
      storage_months,
      box_quantity,
      created_at,
      users!bookings_user_id_fkey (
        full_name,
        email,
        phone
      )
    `,
      { count: 'exact' }
    );

  // Apply filters
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.payment_status) {
    query = query.eq('payment_status', filters.payment_status);
  }
  if (filters?.school) {
    query = query.eq('school', filters.school);
  }
  if (filters?.dorm) {
    query = query.eq('dorm', filters.dorm);
  }

  // Date range filter (based on dateType)
  if (filters?.dateFrom && filters?.dateType) {
    const dateField = filters.dateType === 'move_out' ? 'move_out_date' : filters.dateType === 'move_in' ? 'move_in_date' : 'created_at';
    query = query.gte(dateField, filters.dateFrom);
  }
  if (filters?.dateTo && filters?.dateType) {
    const dateField = filters.dateType === 'move_out' ? 'move_out_date' : filters.dateType === 'move_in' ? 'move_in_date' : 'created_at';
    query = query.lte(dateField, filters.dateTo);
  }

  // Sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('[getBookings]', error);
    return { bookings: [], total: 0 };
  }

  // Transform: flatten users relation to customer
  const bookings: BookingWithCustomer[] = (data || []).map((row: any) => ({
    id: row.id,
    status: row.status,
    payment_status: row.payment_status,
    move_out_date: row.move_out_date,
    move_in_date: row.move_in_date,
    move_out_time_slot: row.move_out_time_slot,
    dorm: row.dorm,
    elevator_available: row.elevator_available,
    stairs_required: row.stairs_required,
    school: row.school,
    total_price: typeof row.total_price === 'number' ? row.total_price : parseFloat(row.total_price || '0'),
    total_monthly_rate: typeof row.total_monthly_rate === 'number' ? row.total_monthly_rate : parseFloat(row.total_monthly_rate || '0'),
    storage_months: row.storage_months,
    box_quantity: row.box_quantity,
    created_at: row.created_at,
    customer: Array.isArray(row.users) && row.users.length > 0
      ? {
          full_name: row.users[0].full_name,
          email: row.users[0].email,
          phone: row.users[0].phone,
        }
      : null,
  }));

  // Apply search filter if provided (client-side for now)
  let filteredBookings = bookings;
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    filteredBookings = bookings.filter(
      (b) =>
        b.customer?.full_name?.toLowerCase().includes(searchLower) ||
        b.customer?.email?.toLowerCase().includes(searchLower) ||
        b.customer?.phone?.includes(searchLower)
    );
  }

  return { bookings: filteredBookings, total: count || 0 };
}

