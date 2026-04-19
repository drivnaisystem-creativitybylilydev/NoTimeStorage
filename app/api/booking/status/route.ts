/**
 * Read-only booking status lookup. Used by the /booking/confirmed page to poll
 * after a Stripe Checkout success, waiting for the webhook to flip the row.
 * Returns only fields safe to expose to the booking owner.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const bookingId = url.searchParams.get('bookingId');
  if (!bookingId) {
    return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
  }

  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('users')
    .select('id')
    .or(`id.eq.${user.id},auth_id.eq.${user.id}`)
    .limit(1)
    .maybeSingle();
  if (!profile?.id) {
    return NextResponse.json({ error: 'Account not found' }, { status: 403 });
  }

  const { data: booking, error } = await admin
    .from('bookings')
    .select('id, user_id, payment_status, status, total_price, total_monthly_rate, storage_months, school, move_out_date, dorm, box_quantity')
    .eq('id', bookingId)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  if (booking.user_id !== profile.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  return NextResponse.json({
    id: booking.id,
    payment_status: booking.payment_status,
    status: booking.status,
    total_price: Number(booking.total_price) || 0,
    total_monthly_rate: Number(booking.total_monthly_rate) || 0,
    storage_months: booking.storage_months ?? null,
    school: booking.school,
    move_out_date: booking.move_out_date,
    dorm: booking.dorm,
    box_quantity: booking.box_quantity ?? 0,
  });
}
