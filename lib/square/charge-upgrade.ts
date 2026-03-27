'use server';

import { squareClient, squareConfig } from './client';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { BookingItemInput } from '@/lib/booking/types';
import { validateBookingLineItems } from '@/lib/booking/addon-pricing';
import { randomUUID } from 'crypto';

export type ChargeUpgradeResult =
  | { success: true; paymentId: string }
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
 * For a PAID booking: update items and charge only the delta (newMonthly - origMonthly) × months.
 * For an UNPAID booking: just update items, no charge.
 */
export async function chargeBookingUpgrade(
  bookingId: string,
  newItems: BookingItemInput[],
  sourceId: string | null, // null = no charge needed (no increase or unpaid)
  deltaAmountCents: number,
): Promise<ChargeUpgradeResult> {
  // Auth check via anon client (reads session cookie)
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return { success: false, error: 'Not logged in.' };

  // All DB reads/writes via admin client (bypasses RLS — safe in server actions only)
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
    .select('id, user_id, payment_status, move_out_date, move_in_date, total_monthly_rate, total_price')
    .eq('id', bookingId)
    .single();

  if (!booking) return { success: false, error: 'Booking not found.' };
  if (booking.user_id !== profile.id) return { success: false, error: 'Unauthorized.' };

  const lineErr = validateBookingLineItems(newItems);
  if (lineErr) return { success: false, error: lineErr };

  // Charge Square if needed
  let squarePaymentId: string | null = null;
  if (sourceId && deltaAmountCents > 0) {
    try {
      const { payment, errors } = await squareClient.payments.create({
        sourceId,
        idempotencyKey: randomUUID(),
        amountMoney: {
          amount: BigInt(deltaAmountCents),
          currency: 'USD',
        },
        locationId: squareConfig.locationId!,
        note: `NoTime Storage – upgrade booking ${bookingId}`,
      });

      if (errors?.length || !payment?.id) {
        return { success: false, error: errors?.[0]?.detail ?? 'Payment failed. Please try again.' };
      }
      squarePaymentId = payment.id;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unexpected payment error.';
      console.error('[chargeBookingUpgrade] Square error:', err);
      return { success: false, error: msg };
    }
  }

  // Recalculate totals
  const months = storageMonths(booking.move_out_date, booking.move_in_date);
  const newMonthlyRate = newItems.reduce((sum, i) => sum + (i.unit_price_cents / 100) * i.quantity, 0);
  const newTotalPrice = newMonthlyRate * months;
  const boxItem = newItems.find(i => i.item_type === 'box');
  const boxQty = boxItem?.quantity ?? 0;

  // Replace booking_items
  await supabase.from('booking_items').delete().eq('booking_id', bookingId);
  await supabase.from('booking_items').insert(
    newItems.map(item => ({
      booking_id: bookingId,
      item_category: getItemCategory(item.item_type),
      item_type: item.item_type,
      quantity: item.quantity,
      monthly_rate: item.unit_price_cents / 100,
      subtotal: (item.unit_price_cents / 100) * item.quantity,
    }))
  );

  // Update booking totals
  await supabase.from('bookings').update({
    box_quantity: boxQty,
    total_monthly_rate: newMonthlyRate,
    total_price: newTotalPrice,
    storage_months: months,
    updated_at: new Date().toISOString(),
  }).eq('id', bookingId);

  // Record upgrade payment
  if (squarePaymentId && deltaAmountCents > 0) {
    await supabase.from('payments').insert({
      booking_id: bookingId,
      amount: deltaAmountCents / 100,
      payment_type: 'full_payment',
      stripe_transaction_id: squarePaymentId,
      status: 'succeeded',
    });
  }

  return { success: true, paymentId: squarePaymentId ?? 'no-charge' };
}
