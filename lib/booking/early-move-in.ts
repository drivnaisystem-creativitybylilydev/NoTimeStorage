'use server';

/** Early move-in: server + emails ready; student UI removed until client approves — re-wire BookingCard when launching. */

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type EarlyMoveInResult =
  | { success: true }
  | { success: false; error: string };

export async function requestEarlyMoveIn(
  bookingId: string,
  requestedDate: string,
  message?: string,
): Promise<EarlyMoveInResult> {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return { success: false, error: 'Not logged in.' };

  const supabase = createAdminClient();

  // Verify booking belongs to this user
  const { data: profile } = await supabase
    .from('users')
    .select('id, full_name, email, school, parent_email')
    .or(`id.eq.${user.id},auth_id.eq.${user.id}`)
    .limit(1)
    .single();

  if (!profile) return { success: false, error: 'Account not found.' };

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, move_in_date, move_out_date, school, dorm, status')
    .eq('id', bookingId)
    .eq('user_id', profile.id)
    .single();

  if (!booking) return { success: false, error: 'Booking not found.' };
  if (booking.status === 'cancelled') return { success: false, error: 'This booking has been cancelled.' };

  const { sendEarlyMoveInRequestAdmin, sendEarlyMoveInRequestUser } = await import('@/lib/email/send');

  const customerName = profile.full_name ?? user.email ?? 'Student';
  const customerEmail = profile.email ?? user.email ?? '';

  await Promise.all([
    sendEarlyMoveInRequestAdmin({
      customerName,
      customerEmail,
      bookingId,
      school: booking.school ?? profile.school ?? '—',
      dorm: booking.dorm ?? '—',
      currentMoveInDate: booking.move_in_date,
      requestedMoveInDate: requestedDate,
      message,
    }),
    customerEmail
      ? sendEarlyMoveInRequestUser({
          to: customerEmail,
          parentEmail: profile.parent_email ?? null,
          customerName,
          currentMoveInDate: booking.move_in_date,
          requestedMoveInDate: requestedDate,
        })
      : Promise.resolve(),
  ]).catch(console.error);

  return { success: true };
}
