'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { BookingItemInput } from '@/lib/booking/types';
import { validateBookingLineItems } from '@/lib/booking/addon-pricing';

export type ApplyUpgradeVenmoResult =
  | { success: true }
  | { success: false; error: string };

function storageMonths(moveOut: string, moveIn: string): number {
  const start = new Date(moveOut);
  const end = new Date(moveIn);
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return Math.max(1, months);
}

function getItemCategory(itemType: string): string {
  return itemType === 'box' ? 'box' : 'item';
}

/**
 * After the customer pays the upgrade difference via Venmo (off-site),
 * applies new line items and totals for a paid booking. Verifies the
 * price increase server-side from the submitted line items.
 */
export async function applyPaidBookingItemUpgradeVenmo(
  bookingId: string,
  newItems: BookingItemInput[],
): Promise<ApplyUpgradeVenmoResult> {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return { success: false, error: 'Not logged in.' };

  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .or(`id.eq.${user.id},auth_id.eq.${user.id}`)
    .limit(1)
    .single();
  if (!profile?.id) return { success: false, error: 'Account not found.' };

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, user_id, payment_status, move_out_date, move_in_date, total_price')
    .eq('id', bookingId)
    .single();

  if (!booking) return { success: false, error: 'Booking not found.' };
  if (booking.user_id !== profile.id) return { success: false, error: 'Unauthorized.' };
  if (booking.payment_status !== 'paid') {
    return { success: false, error: 'This flow only applies to paid bookings.' };
  }

  const lineErr = validateBookingLineItems(newItems);
  if (lineErr) return { success: false, error: lineErr };

  const months = storageMonths(booking.move_out_date, booking.move_in_date);
  const newMonthlyRate = newItems.reduce((sum, i) => sum + (i.unit_price_cents / 100) * i.quantity, 0);
  const newTotalPrice = newMonthlyRate * months;
  const oldTotal = Number(booking.total_price);
  const deltaCents = Math.round((newTotalPrice - oldTotal) * 100);
  if (deltaCents <= 0) {
    return { success: false, error: 'No price increase to apply. Use save without upgrade payment.' };
  }

  const boxItem = newItems.find(i => i.item_type === 'box');
  const boxQty = boxItem?.quantity ?? 0;

  await supabase.from('booking_items').delete().eq('booking_id', bookingId);
  const { error: insertErr } = await supabase.from('booking_items').insert(
    newItems.map(item => ({
      booking_id: bookingId,
      item_category: getItemCategory(item.item_type),
      item_type: item.item_type,
      quantity: item.quantity,
      monthly_rate: item.unit_price_cents / 100,
      subtotal: (item.unit_price_cents / 100) * item.quantity,
    })),
  );
  if (insertErr) {
    console.error('[applyPaidBookingItemUpgradeVenmo] items insert', insertErr);
    return { success: false, error: insertErr.message };
  }

  const { error: updateErr } = await supabase.from('bookings').update({
    box_quantity: boxQty,
    total_monthly_rate: newMonthlyRate,
    total_price: newTotalPrice,
    storage_months: months,
    updated_at: new Date().toISOString(),
  }).eq('id', bookingId);

  if (updateErr) {
    console.error('[applyPaidBookingItemUpgradeVenmo] booking update', updateErr);
    return { success: false, error: updateErr.message };
  }

  // Audit trail: log the upgrade delta as a `pending` payment so admin can
  // reconcile when the Venmo transfer shows up. We do NOT mark succeeded
  // here — admin verifies manually in Venmo and then marks it in the DB.
  const { error: payErr } = await supabase
    .from('payments')
    .insert({
      booking_id: bookingId,
      amount: deltaCents / 100,
      payment_type: 'full_payment',
      status: 'pending',
    });
  if (payErr) {
    // Non-fatal; upgrade is already applied.
    console.warn('[applyPaidBookingItemUpgradeVenmo] pending payment insert skipped:', payErr.message);
  }

  return { success: true };
}
