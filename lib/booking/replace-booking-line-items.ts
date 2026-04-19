import type { SupabaseClient } from '@supabase/supabase-js';
import type { BookingItemInput } from '@/lib/booking/types';
import { validateBookingLineItems } from '@/lib/booking/addon-pricing';

export function storageMonthsForBooking(moveOut: string, moveIn: string): number {
  const start = new Date(moveOut);
  const end = new Date(moveIn);
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return Math.max(1, months);
}

function getItemCategory(itemType: string): string {
  return itemType === 'box' ? 'box' : 'item';
}

export type ReplaceLineItemsResult =
  | { ok: true; newMonthlyRate: number; newTotalPrice: number; boxQty: number }
  | { ok: false; error: string };

/**
 * Replaces `booking_items` and updates booking totals. Used by Venmo upgrade,
 * Stripe upgrade webhook, and no-charge edits on paid bookings.
 */
export async function replaceBookingLineItems(
  admin: SupabaseClient,
  bookingId: string,
  moveOutDate: string,
  moveInDate: string,
  newItems: BookingItemInput[],
): Promise<ReplaceLineItemsResult> {
  const lineErr = validateBookingLineItems(newItems);
  if (lineErr) return { ok: false, error: lineErr };

  const months = storageMonthsForBooking(moveOutDate, moveInDate);
  const newMonthlyRate = newItems.reduce((sum, i) => sum + (i.unit_price_cents / 100) * i.quantity, 0);
  const newTotalPrice = newMonthlyRate * months;
  const boxItem = newItems.find((i) => i.item_type === 'box');
  const boxQty = boxItem?.quantity ?? 0;

  await admin.from('booking_items').delete().eq('booking_id', bookingId);
  const { error: insertErr } = await admin.from('booking_items').insert(
    newItems.map((item) => ({
      booking_id: bookingId,
      item_category: getItemCategory(item.item_type),
      item_type: item.item_type,
      quantity: item.quantity,
      monthly_rate: item.unit_price_cents / 100,
      subtotal: (item.unit_price_cents / 100) * item.quantity,
    })),
  );
  if (insertErr) {
    console.error('[replaceBookingLineItems] insert', insertErr);
    return { ok: false, error: insertErr.message };
  }

  const { error: updateErr } = await admin
    .from('bookings')
    .update({
      box_quantity: boxQty,
      total_monthly_rate: newMonthlyRate,
      total_price: newTotalPrice,
      storage_months: months,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);

  if (updateErr) {
    console.error('[replaceBookingLineItems] booking update', updateErr);
    return { ok: false, error: updateErr.message };
  }

  return { ok: true, newMonthlyRate, newTotalPrice, boxQty };
}
