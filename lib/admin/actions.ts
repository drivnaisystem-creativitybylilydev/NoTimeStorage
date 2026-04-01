'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { SCHOOLS } from '@/lib/schools/config';

export type DashboardStats = {
  totalBookings: number;
  activeBookings: number;
  revenueThisMonth: number;
  revenueThisWeek: number;
  revenueToday: number;
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

  // Week: start of current week (Sunday 00:00) to now
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const revenueThisWeek = paidBookings.reduce((sum, row) => {
    const price = typeof row.total_price === 'number' ? row.total_price : parseFloat(String(row.total_price || 0)) || 0;
    const d = row.paid_at ? new Date(row.paid_at) : row.created_at ? new Date(row.created_at) : null;
    if (!d) return sum;
    return d >= weekStart ? sum + price : sum;
  }, 0);

  // Today: start of today (00:00) to now
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const revenueToday = paidBookings.reduce((sum, row) => {
    const price = typeof row.total_price === 'number' ? row.total_price : parseFloat(String(row.total_price || 0)) || 0;
    const d = row.paid_at ? new Date(row.paid_at) : row.created_at ? new Date(row.created_at) : null;
    if (!d) return sum;
    return d >= todayStart ? sum + price : sum;
  }, 0);

  return {
    totalBookings: totalBookings ?? 0,
    activeBookings: activeBookings ?? 0,
    revenueThisMonth,
    revenueThisWeek,
    revenueToday,
    unpaidBookings: unpaidBookings ?? 0,
  };
}

export type CustomerRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  /** From public.users.school (signup); see also school_display */
  school: string | null;
  /** Profile school, or latest non-cancelled booking school if profile empty */
  school_display: string | null;
  booking_count: number;
  /**
   * Cash recorded in `payments` (status succeeded) for this customer's non-cancelled bookings:
   * deposits, full payments, installments, etc. If a booking is marked paid but has no payment
   * rows (legacy), we add that booking's total_price once.
   */
  total_paid: number;
  /** Non-cancelled bookings not marked paid: sum of (total_price − payments succeeded toward that booking), floored at 0 per booking */
  total_outstanding: number;
  paid_booking_count: number;
  unpaid_booking_count: number;
  /** From public.users — false until $50 deposit succeeds */
  deposit_paid: boolean;
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
  const school = (meta.school as string)?.trim() || null;
  if (!full_name && !phone && !email && !school) return;

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
    if (school) updates.school = school;
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
    .select('id, full_name, email, phone, school, deposit_paid')
    .order('full_name', { ascending: true, nullsFirst: false });

  if (usersError || !usersData?.length) {
    if (usersError) console.error('[getCustomers] users', usersError);
    return [];
  }

  const { data: bookingAggRows } = await supabase
    .from('bookings')
    .select('id, user_id, total_price, payment_status, status, school, created_at')
    .neq('status', 'cancelled');

  type UserPaymentAgg = {
    booking_count: number;
    total_paid: number;
    total_outstanding: number;
    paid_booking_count: number;
    unpaid_booking_count: number;
  };

  const aggByUserId: Record<string, UserPaymentAgg> = {};

  const parsePrice = (v: unknown) =>
    typeof v === 'number' ? v : parseFloat(String(v ?? '0')) || 0;

  // Succeeded payment rows (deposits, full_payment, monthly, etc.) — service role avoids RLS gaps
  const adminDb = createAdminClient();
  const { data: paymentRows, error: paymentsError } = await adminDb
    .from('payments')
    .select('booking_id, amount, status')
    .eq('status', 'succeeded');

  if (paymentsError) {
    console.error('[getCustomers] payments', paymentsError);
  }

  const paidTowardBookingId: Record<string, number> = {};
  for (const p of paymentRows || []) {
    const bid = String((p as { booking_id: string }).booking_id);
    const amt = parsePrice((p as { amount?: unknown }).amount);
    paidTowardBookingId[bid] = (paidTowardBookingId[bid] || 0) + amt;
  }

  type BRow = {
    id: string;
    user_id: string;
    total_price?: unknown;
    payment_status: string | null;
    school?: string | null;
    created_at?: string | null;
  };

  /** Latest non-cancelled booking school per user (by created_at) when profile has no school */
  const schoolFromBookings: Record<string, string> = {};
  const schoolBookingTime: Record<string, string> = {};
  for (const row of (bookingAggRows || []) as BRow[]) {
    const s = row.school?.trim();
    if (!s) continue;
    const t = row.created_at || '';
    const uid = row.user_id;
    if (!schoolFromBookings[uid] || t > (schoolBookingTime[uid] || '')) {
      schoolFromBookings[uid] = s;
      schoolBookingTime[uid] = t;
    }
  }

  for (const row of (bookingAggRows || []) as BRow[]) {
    const uid = row.user_id;
    if (!aggByUserId[uid]) {
      aggByUserId[uid] = {
        booking_count: 0,
        total_paid: 0,
        total_outstanding: 0,
        paid_booking_count: 0,
        unpaid_booking_count: 0,
      };
    }
    const a = aggByUserId[uid];
    a.booking_count += 1;
    if (row.payment_status === 'paid') {
      a.paid_booking_count += 1;
    } else {
      a.unpaid_booking_count += 1;
    }
  }

  for (const row of (bookingAggRows || []) as BRow[]) {
    const uid = row.user_id;
    const a = aggByUserId[uid];
    const price = parsePrice(row.total_price);
    const toward = paidTowardBookingId[String(row.id)] || 0;

    a.total_paid += toward;
    if (row.payment_status === 'paid' && toward === 0) {
      a.total_paid += price;
    }
    if (row.payment_status !== 'paid') {
      a.total_outstanding += Math.max(0, price - toward);
    }
  }

  return usersData.map(
    (u: {
      id: string;
      full_name: string | null;
      email: string | null;
      phone: string | null;
      school: string | null;
      deposit_paid?: boolean | null;
    }) => {
    const a = aggByUserId[u.id];
    const profileSchool = u.school?.trim() || null;
    const school_display = profileSchool || schoolFromBookings[u.id] || null;
    return {
      id: u.id,
      full_name: u.full_name ?? null,
      email: u.email ?? null,
      phone: u.phone ?? null,
      school: profileSchool,
      school_display,
      deposit_paid: u.deposit_paid === true,
      booking_count: a?.booking_count ?? 0,
      total_paid: a?.total_paid ?? 0,
      total_outstanding: a?.total_outstanding ?? 0,
      paid_booking_count: a?.paid_booking_count ?? 0,
      unpaid_booking_count: a?.unpaid_booking_count ?? 0,
    };
  });
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
  let updateSucceeded = false;
  try {
    const { data: withPaidAt, error: errPaidAt } = await supabase
      .from('bookings')
      .update({ ...payload, paid_at: now })
      .eq('id', bookingId)
      .select('id')
      .single();

    if (!errPaidAt && withPaidAt) {
      updateSucceeded = true;
    } else if (errPaidAt) {
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

  if (!updateSucceeded) {
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
  }

  // Insert full_payment record into payments table
  const { data: booking } = await supabase
    .from('bookings')
    .select('total_price')
    .eq('id', bookingId)
    .single();

  if (booking?.total_price) {
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        booking_id: bookingId,
        amount: booking.total_price,
        payment_type: 'full_payment',
        status: 'succeeded',
      });
    if (paymentError) {
      console.error('[markBookingPaid] payments insert error:', paymentError);
    }
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

  // Soft-cancel: set status = 'cancelled' on booking (preserves audit trail)
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', bookingId);

  if (error) {
    console.error('[adminCancelBooking] bookings', error);
    return { success: false, error: error.message };
  }

  // Also cancel related schedules
  const { error: schedErr } = await supabase
    .from('schedules')
    .update({ status: 'cancelled' })
    .eq('booking_id', bookingId);
  if (schedErr) {
    console.error('[adminCancelBooking] schedules', schedErr);
  }

  return { success: true };
}

export type AdminBookingItemRow = {
  item_type: string;
  quantity: number;
  monthly_rate: number;
  subtotal: number;
};

export type BookingWithCustomer = {
  id: string;
  status: string;
  payment_status: string;
  payment_plan: 'full' | 'monthly';
  move_out_date: string;
  move_in_date: string;
  move_out_time_slot: string;
  move_in_time_slot: string | null;
  dorm: string;
  room: string | null;
  elevator_available: boolean;
  stairs_required: boolean;
  school: string;
  special_instructions: string | null;
  total_price: number;
  total_monthly_rate: number;
  storage_months: number;
  box_quantity: number;
  created_at: string;
  paid_at: string | null;
  /** Line items (boxes + add-ons); loaded via join for admin list + detail. */
  items: AdminBookingItemRow[];
  // Monthly plan fields
  monthly_payment_amount: number | null;
  monthly_payments_remaining: number | null;
  next_payment_date: string | null;
  // Square IDs
  square_customer_id: string | null;
  square_card_id: string | null;
  square_invoice_id: string | null;
  // Move-in delivery details (confirmed by student)
  move_in_dorm: string | null;
  move_in_room: string | null;
  move_in_confirmed_at: string | null;
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

function normalizePaymentPlan(raw: string | null | undefined): BookingWithCustomer['payment_plan'] {
  return raw === 'monthly' ? 'monthly' : 'full';
}

function normalizeAdminBookingItems(raw: unknown): AdminBookingItemRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((r) => {
    const o = r as Record<string, unknown>;
    const monthly = typeof o.monthly_rate === 'number' ? o.monthly_rate : parseFloat(String(o.monthly_rate ?? '0'));
    const sub = typeof o.subtotal === 'number' ? o.subtotal : parseFloat(String(o.subtotal ?? '0'));
    return {
      item_type: String(o.item_type ?? ''),
      quantity: typeof o.quantity === 'number' ? o.quantity : parseInt(String(o.quantity ?? '0'), 10) || 0,
      monthly_rate: monthly,
      subtotal: sub,
    };
  });
}

/** Raw row from bookings + booking_items + users join (admin list + calendar). */
type AdminBookingJoinRow = {
  id: string;
  status: string;
  payment_status: string;
  payment_plan?: string | null;
  move_out_date: string;
  move_in_date: string;
  move_out_time_slot: string;
  move_in_time_slot?: string | null;
  dorm: string;
  room?: string | null;
  elevator_available: boolean;
  stairs_required: boolean;
  school: string;
  special_instructions?: string | null;
  total_price: number | string;
  total_monthly_rate: number | string;
  storage_months: number;
  box_quantity: number;
  created_at: string;
  paid_at?: string | null;
  booking_items: unknown;
  users: unknown;
  monthly_payment_amount?: number | null;
  monthly_payments_remaining?: number | null;
  next_payment_date?: string | null;
  square_customer_id?: string | null;
  square_card_id?: string | null;
  square_invoice_id?: string | null;
  move_in_dorm?: string | null;
  move_in_room?: string | null;
  move_in_confirmed_at?: string | null;
};

export async function getBookings(
  page: number = 1,
  pageSize: number = 25,
  filters?: BookingsFilters,
  sortBy: 'move_out_date' | 'move_in_date' | 'created_at' = 'move_out_date',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<{ bookings: BookingWithCustomer[]; total: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { bookings: [], total: 0 };

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();
  if (!adminUser) return { bookings: [], total: 0 };

  // Service role: nested booking_items are hidden from admins under user JWT because RLS only allows
  // customers to SELECT their own line items (see docs/booking-backend.md).
  const db = createAdminClient();

  let query = db
    .from('bookings')
    .select(
      `
      id,
      status,
      payment_status,
      payment_plan,
      move_out_date,
      move_in_date,
      move_out_time_slot,
      move_in_time_slot,
      dorm,
      room,
      elevator_available,
      stairs_required,
      school,
      special_instructions,
      total_price,
      total_monthly_rate,
      storage_months,
      box_quantity,
      created_at,
      paid_at,
      monthly_payment_amount,
      monthly_payments_remaining,
      next_payment_date,
      square_customer_id,
      square_card_id,
      square_invoice_id,
      move_in_dorm,
      move_in_room,
      move_in_confirmed_at,
      booking_items (
        item_type,
        quantity,
        monthly_rate,
        subtotal
      ),
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

  const bookings: BookingWithCustomer[] = (data || []).map((row: AdminBookingJoinRow) => {
    const userRow = Array.isArray(row.users) ? row.users[0] : row.users;
    const customer = pickUser(userRow);
    const items = normalizeAdminBookingItems(row.booking_items);
    return {
      id: row.id,
      status: row.status,
      payment_status: row.payment_status,
      payment_plan: normalizePaymentPlan(row.payment_plan),
      move_out_date: row.move_out_date,
      move_in_date: row.move_in_date,
      move_out_time_slot: row.move_out_time_slot,
      move_in_time_slot: row.move_in_time_slot ?? null,
      dorm: row.dorm,
      room: row.room ?? null,
      elevator_available: row.elevator_available,
      stairs_required: row.stairs_required,
      school: row.school,
      special_instructions: row.special_instructions ?? null,
      total_price: typeof row.total_price === 'number' ? row.total_price : parseFloat(row.total_price || '0'),
      total_monthly_rate: typeof row.total_monthly_rate === 'number' ? row.total_monthly_rate : parseFloat(row.total_monthly_rate || '0'),
      storage_months: row.storage_months,
      box_quantity: row.box_quantity,
      created_at: row.created_at,
      paid_at: row.paid_at ?? null,
      items,
      monthly_payment_amount: row.monthly_payment_amount ?? null,
      monthly_payments_remaining: row.monthly_payments_remaining ?? null,
      next_payment_date: row.next_payment_date ?? null,
      square_customer_id: row.square_customer_id ?? null,
      square_card_id: row.square_card_id ?? null,
      square_invoice_id: row.square_invoice_id ?? null,
      move_in_dorm: row.move_in_dorm ?? null,
      move_in_room: row.move_in_room ?? null,
      move_in_confirmed_at: row.move_in_confirmed_at ?? null,
      customer,
    };
  });

  // Apply search filter — returns correct filtered count
  let filteredBookings = bookings;
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    filteredBookings = bookings.filter((b) => {
      if (
        b.customer?.full_name?.toLowerCase().includes(searchLower) ||
        b.customer?.email?.toLowerCase().includes(searchLower) ||
        b.customer?.phone?.includes(searchLower)
      ) {
        return true;
      }
      const itemsLine = b.items.map((i) => `${i.quantity} ${i.item_type}`).join(' ').toLowerCase();
      return itemsLine.includes(searchLower);
    });
  }

  return { bookings: filteredBookings, total: filters?.search ? filteredBookings.length : (count || 0) };
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

  // Monthly revenue trend (last 6 months) — per-school, all schools included
  monthlyRevenue: { month: string; revenue: number; bookings: number; schoolData: Record<string, { revenue: number; bookings: number }> }[];

  // Booking status breakdown
  byStatus: { status: string; count: number }[];

  // Box quantity distribution
  boxDistribution: { range: string; count: number }[];
};

type AnalyticsBookingRow = {
  id: string;
  status: string;
  payment_status: string;
  school: string | null;
  total_price: number | string;
  total_monthly_rate?: number | string;
  box_quantity: number | null;
  storage_months?: number | null;
  created_at: string;
  move_out_date?: string;
  paid_at: string | null;
};

type AnalyticsBookingRowFallback = Omit<AnalyticsBookingRow, 'paid_at'>;

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
  let bookings: AnalyticsBookingRow[] | null = null;
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
    bookings = (fallback || []).map((r: AnalyticsBookingRowFallback): AnalyticsBookingRow => ({ ...r, paid_at: null }));
  } else if (err1) {
    console.error('[getAnalyticsData]', err1);
    return emptyAnalytics();
  } else {
    bookings = (withPaidAt || []) as AnalyticsBookingRow[];
  }

  const allSchoolNames = SCHOOLS.map(s => s.name);
  if (!bookings.length) return emptyAnalytics(allSchoolNames);

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  // Revenue date: use paid_at if set, else created_at
  const getRevenueDate = (row: AnalyticsBookingRow): Date =>
    row.paid_at ? new Date(row.paid_at) : row.created_at ? new Date(row.created_at) : new Date(0);

  const paidBookings = bookings.filter((b) => b.payment_status === 'paid');

  // KPIs — revenue is ONLY from paid bookings (consistent with Bookings dashboard)
  let totalRevenue = 0, revenueThisMonth = 0, revenueLastMonth = 0;
  let totalBoxes = 0;
  paidBookings.forEach((b) => {
    const price = typeof b.total_price === 'number' ? b.total_price : parseFloat(String(b.total_price || '0'));
    totalRevenue += price;
    const d = getRevenueDate(b);
    if (d >= thisMonthStart) revenueThisMonth += price;
    if (d >= lastMonthStart && d <= lastMonthEnd) revenueLastMonth += price;
  });
  bookings.forEach((b) => { totalBoxes += b.box_quantity ?? 0; });

  const bookingsThisMonth = bookings.filter((b) => new Date(b.created_at) >= thisMonthStart).length;
  const bookingsLastMonth = bookings.filter((b) => {
    const d = new Date(b.created_at); return d >= lastMonthStart && d <= lastMonthEnd;
  }).length;
  const avgBoxesPerBooking = bookings.length ? Math.round((totalBoxes / bookings.length) * 10) / 10 : 0;

  // By school — bookings/boxes = all active, revenue = paid only
  const schoolMap: Record<string, { bookings: number; revenue: number; boxes: number }> = {};
  bookings.forEach((b) => {
    const s = b.school || 'Unknown';
    if (!schoolMap[s]) schoolMap[s] = { bookings: 0, revenue: 0, boxes: 0 };
    schoolMap[s].bookings++;
    schoolMap[s].boxes += b.box_quantity ?? 0;
  });
  paidBookings.forEach((b) => {
    const s = b.school || 'Unknown';
    if (!schoolMap[s]) schoolMap[s] = { bookings: 0, revenue: 0, boxes: 0 };
    schoolMap[s].revenue += typeof b.total_price === 'number' ? b.total_price : parseFloat(String(b.total_price || '0'));
  });
  const bySchool = Object.entries(schoolMap).map(([school, v]) => ({ school, ...v }))
    .sort((a, b) => b.bookings - a.bookings);

  // Monthly revenue — last 6 months (revenue = paid only, bookings = all active)
  // Include ALL schools from config, with 0 for months with no data
  const monthlyRevenue: { month: string; revenue: number; bookings: number; schoolData: Record<string, { revenue: number; bookings: number }> }[] = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const label = start.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

    const schoolData: Record<string, { revenue: number; bookings: number }> = {};
    allSchoolNames.forEach(name => { schoolData[name] = { revenue: 0, bookings: 0 }; });

    const schoolSet = new Set(allSchoolNames);
    bookings.forEach((b) => {
      const d = b.created_at ? new Date(b.created_at) : new Date(0);
      if (d >= start && d <= end) {
        const s = b.school != null && schoolSet.has(b.school) ? b.school : 'Other';
        if (!schoolData[s]) schoolData[s] = { revenue: 0, bookings: 0 };
        schoolData[s].bookings++;
      }
    });
    paidBookings.forEach((b) => {
      const d = getRevenueDate(b);
      if (d >= start && d <= end) {
        const s = b.school != null && schoolSet.has(b.school) ? b.school : 'Other';
        const price = typeof b.total_price === 'number' ? b.total_price : parseFloat(String(b.total_price || '0'));
        if (!schoolData[s]) schoolData[s] = { revenue: 0, bookings: 0 };
        schoolData[s].revenue += price;
      }
    });

    const revenue = Object.values(schoolData).reduce((sum, v) => sum + v.revenue, 0);
    const totalBookingsInMonth = Object.values(schoolData).reduce((sum, v) => sum + v.bookings, 0);
    monthlyRevenue.push({ month: label, revenue, bookings: totalBookingsInMonth, schoolData });
  }

  // By status
  const statusMap: Record<string, number> = {};
  bookings.forEach((b) => {
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
    count: bookings.filter((b) => (b.box_quantity ?? 0) >= r.min && (b.box_quantity ?? 0) <= r.max).length,
  }));

  return {
    totalRevenue, revenueThisMonth, revenueLastMonth,
    totalBookings: bookings.length, bookingsThisMonth, bookingsLastMonth,
    avgBoxesPerBooking, totalBoxes,
    bySchool, monthlyRevenue, byStatus, boxDistribution,
  };
}

function emptyAnalytics(allSchoolNames?: string[]): AnalyticsData {
  const now = new Date();
  const schoolList = allSchoolNames ?? SCHOOLS.map(s => s.name);
  const monthlyRevenue = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = start.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const schoolData: Record<string, { revenue: number; bookings: number }> = {};
    schoolList.forEach(name => { schoolData[name] = { revenue: 0, bookings: 0 }; });
    monthlyRevenue.push({ month: label, revenue: 0, bookings: 0, schoolData });
  }
  return {
    totalRevenue: 0, revenueThisMonth: 0, revenueLastMonth: 0,
    totalBookings: 0, bookingsThisMonth: 0, bookingsLastMonth: 0,
    avgBoxesPerBooking: 0, totalBoxes: 0,
    bySchool: [], monthlyRevenue, byStatus: [], boxDistribution: [],
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

  const db = createAdminClient();
  const { data, error } = await db
    .from('bookings')
    .select(`
      id,
      status,
      payment_status,
      payment_plan,
      move_out_date,
      move_in_date,
      move_out_time_slot,
      move_in_time_slot,
      dorm,
      room,
      elevator_available,
      stairs_required,
      school,
      special_instructions,
      total_price,
      total_monthly_rate,
      storage_months,
      box_quantity,
      created_at,
      paid_at,
      monthly_payment_amount,
      monthly_payments_remaining,
      next_payment_date,
      square_customer_id,
      square_card_id,
      square_invoice_id,
      move_in_dorm,
      move_in_room,
      move_in_confirmed_at,
      booking_items (
        item_type,
        quantity,
        monthly_rate,
        subtotal
      ),
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

  return (data || []).map((row: AdminBookingJoinRow) => {
    const userRow = Array.isArray(row.users) ? row.users[0] : row.users;
    return {
      id: row.id,
      status: row.status,
      payment_status: row.payment_status,
      payment_plan: normalizePaymentPlan(row.payment_plan),
      move_out_date: row.move_out_date,
      move_in_date: row.move_in_date,
      move_out_time_slot: row.move_out_time_slot,
      move_in_time_slot: row.move_in_time_slot ?? null,
      dorm: row.dorm,
      room: row.room ?? null,
      elevator_available: row.elevator_available,
      stairs_required: row.stairs_required,
      school: row.school,
      special_instructions: row.special_instructions ?? null,
      total_price: typeof row.total_price === 'number' ? row.total_price : parseFloat(row.total_price || '0'),
      total_monthly_rate: typeof row.total_monthly_rate === 'number' ? row.total_monthly_rate : parseFloat(row.total_monthly_rate || '0'),
      storage_months: row.storage_months,
      box_quantity: row.box_quantity,
      created_at: row.created_at,
      paid_at: row.paid_at ?? null,
      items: normalizeAdminBookingItems(row.booking_items),
      monthly_payment_amount: row.monthly_payment_amount ?? null,
      monthly_payments_remaining: row.monthly_payments_remaining ?? null,
      next_payment_date: row.next_payment_date ?? null,
      square_customer_id: row.square_customer_id ?? null,
      square_card_id: row.square_card_id ?? null,
      square_invoice_id: row.square_invoice_id ?? null,
      move_in_dorm: row.move_in_dorm ?? null,
      move_in_room: row.move_in_room ?? null,
      move_in_confirmed_at: row.move_in_confirmed_at ?? null,
      customer: pickUser(userRow),
    };
  });
}
