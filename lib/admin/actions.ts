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

  // Revenue this month: sum of total_price for paid bookings that count this month.
  // Use paid_at when set (when marked paid in admin), else fall back to created_at for backward compatibility.
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  let paidBookings: { total_price?: number | string; paid_at?: string | null; created_at?: string }[] = [];
  const { data: withPaidAt, error: paidAtError } = await supabase
    .from('bookings')
    .select('total_price, paid_at, created_at')
    .eq('payment_status', 'paid');

  if (paidAtError?.message?.includes('paid_at')) {
    const { data: fallback } = await supabase
      .from('bookings')
      .select('total_price, created_at')
      .eq('payment_status', 'paid');
    paidBookings = (fallback || []).map((r) => ({ ...r, paid_at: null }));
  } else {
    paidBookings = (withPaidAt || []) as typeof paidBookings;
  }

  const revenueThisMonth = paidBookings.reduce((sum, row) => {
    const price = typeof row.total_price === 'number' ? row.total_price : parseFloat(String(row.total_price || 0)) || 0;
    const paidAt = row.paid_at ? new Date(row.paid_at) : null;
    const createdAt = row.created_at ? new Date(row.created_at) : null;
    const countsThisMonth = paidAt
      ? paidAt >= monthStart && paidAt < nextMonthStart
      : createdAt
        ? createdAt >= monthStart && createdAt < nextMonthStart
        : false;
    return countsThisMonth ? sum + price : sum;
  }, 0);

  return {
    totalBookings,
    activeBookings,
    revenueThisMonth,
    unpaidBookings,
  };
}

export type CustomerRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  booking_count: number;
};

/** Sync the current auth user's full_name, email, phone into public.users so admin lists show correct data. */
export async function syncCurrentUserProfile(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const meta = user.user_metadata ?? {};
  const full_name = (meta.full_name as string)?.trim() || (meta.first_name || meta.last_name ? [meta.first_name, meta.last_name].filter(Boolean).join(' ').trim() : null) || null;
  const phone = (meta.phone as string)?.trim() || null;
  const email = user.email?.trim() || null;
  if (!full_name && !phone && !email) return;

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .or(`id.eq.${user.id},auth_id.eq.${user.id}`)
    .limit(1)
    .single();

  if (existing?.id) {
    const updates: Record<string, string> = {};
    if (full_name) updates.full_name = full_name;
    if (phone) updates.phone = phone;
    if (email) updates.email = email;
    if (Object.keys(updates).length > 0) {
      await supabase.from('users').update(updates).eq('id', existing.id);
    }
  }
}

/** List all customers (users) for admin. Requires admin RLS on public.users (see docs/admin-users-rls.sql). */
export async function getCustomers(): Promise<CustomerRow[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();
  if (!adminUser) return [];

  await syncCurrentUserProfile();

  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('id, full_name, email, phone')
    .order('full_name', { ascending: true, nullsFirst: false });

  if (usersError || !usersData?.length) {
    if (usersError) console.error('[getCustomers] users', usersError);
    return [];
  }

  const { data: countsData } = await supabase
    .from('bookings')
    .select('user_id')
    .neq('status', 'cancelled');

  const countByUserId: Record<string, number> = {};
  (countsData || []).forEach((row: { user_id: string }) => {
    countByUserId[row.user_id] = (countByUserId[row.user_id] || 0) + 1;
  });

  return usersData.map((u: { id: string; full_name: string | null; email: string | null; phone: string | null }) => ({
    id: u.id,
    full_name: u.full_name ?? null,
    email: u.email ?? null,
    phone: u.phone ?? null,
    booking_count: countByUserId[u.id] ?? 0,
  }));
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

  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    payment_status: 'paid',
    status: 'confirmed',
    updated_at: now,
  };

  const rlsHint =
    'Add admin RLS policies so admins can update bookings (run docs/admin-bookings-rls.sql in Supabase SQL Editor).';

  // Try with paid_at first (run docs/admin-paid-at-migration.sql for revenue-this-month)
  try {
    const { data: withPaidAt, error: errPaidAt } = await supabase
      .from('bookings')
      .update({ ...payload, paid_at: now })
      .eq('id', bookingId)
      .select('id')
      .single();

    if (!errPaidAt && withPaidAt) {
      return { success: true };
    }
    if (errPaidAt) {
      const noRows = errPaidAt.code === 'PGRST116' || errPaidAt.message?.includes('no rows') || errPaidAt.message?.includes('0 rows');
      if (noRows) {
        return { success: false, error: `Update had no effect. ${rlsHint}` };
      }
      if (!errPaidAt.message?.includes('paid_at')) {
        console.error('[markBookingPaid]', errPaidAt);
        return { success: false, error: errPaidAt.message };
      }
    }
  } catch {
    // ignore and try without paid_at
  }

  const { data, error } = await supabase
    .from('bookings')
    .update(payload)
    .eq('id', bookingId)
    .select('id')
    .single();

  if (error) {
    console.error('[markBookingPaid]', error);
    const noRows = error.code === 'PGRST116' || error.message?.includes('no rows') || error.message?.includes('0 rows');
    return {
      success: false,
      error: noRows ? `Update had no effect. ${rlsHint}` : error.message,
    };
  }

  if (!data) {
    return { success: false, error: `Update had no effect. ${rlsHint}` };
  }

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
  /** Filter by customer (user) id from admin Customers page */
  userId?: string;
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
  if (filters?.userId) {
    query = query.eq('user_id', filters.userId);
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

  // Transform: flatten users relation to customer (Supabase may return users as array or single object)
  const pickUser = (u: unknown): { full_name: string | null; email: string | null; phone: string | null } | null => {
    if (!u || typeof u !== 'object') return null;
    const o = u as Record<string, unknown>;
    return {
      full_name: (o.full_name != null && String(o.full_name).trim()) ? String(o.full_name).trim() : null,
      email: o.email != null ? String(o.email) : null,
      phone: o.phone != null ? String(o.phone) : null,
    };
  };
  const bookings: BookingWithCustomer[] = (data || []).map((row: any) => {
    const userRow = Array.isArray(row.users) ? row.users[0] : row.users;
    const customer = pickUser(userRow);
    return {
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
      customer,
    };
  });

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

// ─── Analytics ───────────────────────────────────────────────────────────────

export type AnalyticsData = {
  // KPI cards
  totalRevenue: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  totalBookings: number;
  bookingsThisMonth: number;
  bookingsLastMonth: number;
  avgBoxesPerBooking: number;
  totalBoxes: number;

  // Breakdown by school
  bySchool: { school: string; bookings: number; revenue: number; boxes: number }[];

  // Monthly revenue trend (last 6 months)
  monthlyRevenue: { month: string; revenue: number; bookings: number }[];

  // Booking status breakdown
  byStatus: { status: string; count: number }[];

  // Box quantity distribution
  boxDistribution: { range: string; count: number }[];
};

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return emptyAnalytics();

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();
  if (!adminUser) return emptyAnalytics();

  // Try with paid_at first; fall back without it if column doesn't exist
  let bookings: any[] | null = null;
  const { data: withPaidAt, error: err1 } = await supabase
    .from('bookings')
    .select('id, status, payment_status, school, total_price, total_monthly_rate, box_quantity, storage_months, created_at, move_out_date, paid_at')
    .neq('status', 'cancelled');

  if (err1?.message?.includes('paid_at')) {
    const { data: fallback, error: err2 } = await supabase
      .from('bookings')
      .select('id, status, payment_status, school, total_price, total_monthly_rate, box_quantity, storage_months, created_at, move_out_date')
      .neq('status', 'cancelled');
    if (err2) { console.error('[getAnalyticsData]', err2); return emptyAnalytics(); }
    bookings = (fallback || []).map((r: any) => ({ ...r, paid_at: null }));
  } else if (err1) {
    console.error('[getAnalyticsData]', err1);
    return emptyAnalytics();
  } else {
    bookings = withPaidAt || [];
  }

  if (!bookings.length) return emptyAnalytics();

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  // Revenue date: use paid_at if set, else created_at
  const getRevenueDate = (row: any): Date =>
    row.paid_at ? new Date(row.paid_at) : row.created_at ? new Date(row.created_at) : new Date(0);

  const paidBookings = bookings.filter((b: any) => b.payment_status === 'paid');

  // KPIs — revenue is ONLY from paid bookings (consistent with Bookings dashboard)
  let totalRevenue = 0, revenueThisMonth = 0, revenueLastMonth = 0;
  let totalBoxes = 0;
  paidBookings.forEach((b: any) => {
    const price = typeof b.total_price === 'number' ? b.total_price : parseFloat(b.total_price || '0');
    totalRevenue += price;
    const d = getRevenueDate(b);
    if (d >= thisMonthStart) revenueThisMonth += price;
    if (d >= lastMonthStart && d <= lastMonthEnd) revenueLastMonth += price;
  });
  bookings.forEach((b: any) => { totalBoxes += b.box_quantity ?? 0; });

  const bookingsThisMonth = bookings.filter((b: any) => new Date(b.created_at) >= thisMonthStart).length;
  const bookingsLastMonth = bookings.filter((b: any) => {
    const d = new Date(b.created_at); return d >= lastMonthStart && d <= lastMonthEnd;
  }).length;
  const avgBoxesPerBooking = bookings.length ? Math.round((totalBoxes / bookings.length) * 10) / 10 : 0;

  // By school — bookings/boxes = all active, revenue = paid only
  const schoolMap: Record<string, { bookings: number; revenue: number; boxes: number }> = {};
  bookings.forEach((b: any) => {
    const s = b.school || 'Unknown';
    if (!schoolMap[s]) schoolMap[s] = { bookings: 0, revenue: 0, boxes: 0 };
    schoolMap[s].bookings++;
    schoolMap[s].boxes += b.box_quantity ?? 0;
  });
  paidBookings.forEach((b: any) => {
    const s = b.school || 'Unknown';
    if (!schoolMap[s]) schoolMap[s] = { bookings: 0, revenue: 0, boxes: 0 };
    schoolMap[s].revenue += typeof b.total_price === 'number' ? b.total_price : parseFloat(b.total_price || '0');
  });
  const bySchool = Object.entries(schoolMap).map(([school, v]) => ({ school, ...v }))
    .sort((a, b) => b.bookings - a.bookings);

  // Monthly revenue — last 6 months (revenue = paid only, bookings = all active)
  const monthlyRevenue: { month: string; revenue: number; bookings: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const label = start.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const allInRange = bookings.filter((b: any) => {
      const d = b.created_at ? new Date(b.created_at) : new Date(0);
      return d >= start && d <= end;
    });
    const paidInRange = paidBookings.filter((b: any) => {
      const d = getRevenueDate(b); return d >= start && d <= end;
    });
    const revenue = paidInRange.reduce((sum: number, b: any) =>
      sum + (typeof b.total_price === 'number' ? b.total_price : parseFloat(b.total_price || '0')), 0);
    monthlyRevenue.push({ month: label, revenue, bookings: allInRange.length });
  }

  // By status
  const statusMap: Record<string, number> = {};
  bookings.forEach((b: any) => {
    statusMap[b.status] = (statusMap[b.status] || 0) + 1;
  });
  const byStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  // Box distribution
  const boxRanges = [
    { range: '1–3', min: 1, max: 3 },
    { range: '4–6', min: 4, max: 6 },
    { range: '7–10', min: 7, max: 10 },
    { range: '11+', min: 11, max: Infinity },
  ];
  const boxDistribution = boxRanges.map(r => ({
    range: r.range,
    count: bookings.filter((b: any) => (b.box_quantity ?? 0) >= r.min && (b.box_quantity ?? 0) <= r.max).length,
  }));

  return {
    totalRevenue, revenueThisMonth, revenueLastMonth,
    totalBookings: bookings.length, bookingsThisMonth, bookingsLastMonth,
    avgBoxesPerBooking, totalBoxes,
    bySchool, monthlyRevenue, byStatus, boxDistribution,
  };
}

function emptyAnalytics(): AnalyticsData {
  return {
    totalRevenue: 0, revenueThisMonth: 0, revenueLastMonth: 0,
    totalBookings: 0, bookingsThisMonth: 0, bookingsLastMonth: 0,
    avgBoxesPerBooking: 0, totalBoxes: 0,
    bySchool: [], monthlyRevenue: [], byStatus: [], boxDistribution: [],
  };
}

/** Fetch all non-cancelled bookings for the admin calendar (no pagination). */
export async function getCalendarBookings(): Promise<BookingWithCustomer[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();
  if (!adminUser) return [];

  const { data, error } = await supabase
    .from('bookings')
    .select(`
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
    `)
    .neq('status', 'cancelled')
    .order('move_out_date', { ascending: true });

  if (error) {
    console.error('[getCalendarBookings]', error);
    return [];
  }

  const pickUser = (u: unknown): { full_name: string | null; email: string | null; phone: string | null } | null => {
    if (!u || typeof u !== 'object') return null;
    const o = u as Record<string, unknown>;
    return {
      full_name: (o.full_name != null && String(o.full_name).trim()) ? String(o.full_name).trim() : null,
      email: o.email != null ? String(o.email) : null,
      phone: o.phone != null ? String(o.phone) : null,
    };
  };

  return (data || []).map((row: any) => {
    const userRow = Array.isArray(row.users) ? row.users[0] : row.users;
    return {
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
      customer: pickUser(userRow),
    };
  });
}
