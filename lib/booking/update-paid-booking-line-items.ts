'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { BookingItemInput } from '@/lib/booking/types';
import { validateBookingLineItems } from '@/lib/booking/addon-pricing';
import { replaceBookingLineItems, storageMonthsForBooking } from '@/lib/booking/replace-booking-line-items';

export type UpdatePaidBookingItemsResult = { success: true } | { success: false; error: string };

/**
 * For a **paid** booking: replace line items when there is no extra charge
 * (same or lower total). Use Stripe/Venmo flows when the total increases.
 */
export async function updatePaidBookingLineItems(
  bookingId: string,
  newItems: BookingItemInput[],
): Promise<UpdatePaidBookingItemsResult> {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) return { success: false, error: 'Not logged in.' };

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('users')
    .select('id')
    .or(`id.eq.${user.id},auth_id.eq.${user.id}`)
    .limit(1)
    .single();
  if (!profile?.id) return { success: false, error: 'Account not found.' };

  const { data: booking } = await admin
    .from('bookings')
    .select('id, user_id, payment_status, move_out_date, move_in_date, total_price')
    .eq('id', bookingId)
    .single();

  if (!booking) return { success: false, error: 'Booking not found.' };
  if (booking.user_id !== profile.id) return { success: false, error: 'Unauthorized.' };
  if (booking.payment_status !== 'paid') {
    return { success: false, error: 'This action only applies to paid bookings.' };
  }

  const lineErr = validateBookingLineItems(newItems);
  if (lineErr) return { success: false, error: lineErr };

  const months = storageMonthsForBooking(booking.move_out_date, booking.move_in_date);
  const newMonthlyRate = newItems.reduce((sum, i) => sum + (i.unit_price_cents / 100) * i.quantity, 0);
  const newTotalPrice = newMonthlyRate * months;
  const oldTotal = Number(booking.total_price);
  const deltaCents = Math.round((newTotalPrice - oldTotal) * 100);
  if (deltaCents > 0) {
    return { success: false, error: 'A payment is required for this upgrade. Use the checkout button.' };
  }

  const applied = await replaceBookingLineItems(
    admin,
    bookingId,
    booking.move_out_date,
    booking.move_in_date,
    newItems,
  );
  if (!applied.ok) return { success: false, error: applied.error };

  return { success: true };
}
