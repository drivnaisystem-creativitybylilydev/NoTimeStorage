'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import type { BookingItemType, BookingItemInput } from './types';
import { validateBookingLineItems } from './addon-pricing';
import { computeStorageBillMonths } from '@/lib/booking/storage-bill-months';

export type ActionResult = { success: true } | { success: false; error: string };

function getItemCategory(itemType: BookingItemType): string {
  return itemType === 'box' ? 'box' : 'item';
}

/** Verify ownership only — no payment status restriction. Used for date/cancellation changes. */
async function getBookingOwnership(authClient: Awaited<ReturnType<typeof createClient>>, bookingId: string) {
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return { ok: false as const, error: 'You must be logged in.' };

  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .or(`id.eq.${user.id},auth_id.eq.${user.id}`)
    .limit(1)
    .single();
  if (!profile?.id) return { ok: false as const, error: 'Account not found.' };

  const { data: booking, error } = await supabase
    .from('bookings')
    .select('id, user_id, payment_status')
    .eq('id', bookingId)
    .single();
  if (error || !booking) return { ok: false as const, error: 'Booking not found.' };
  if (booking.user_id !== profile.id) return { ok: false as const, error: 'You can only edit your own booking.' };

  return { ok: true as const, profileId: profile.id, isPaid: booking.payment_status === 'paid' };
}

/** Verify ownership AND that booking is unpaid (for item changes on unpaid bookings). */
async function getUnpaidBookingOwnership(authClient: Awaited<ReturnType<typeof createClient>>, bookingId: string) {
  const check = await getBookingOwnership(authClient, bookingId);
  if (!check.ok) return check;
  if (check.isPaid) return { ok: false as const, error: 'Paid bookings cannot be changed this way.' };
  return check;
}

export async function deleteBooking(bookingId: string): Promise<ActionResult> {
  const authClient = await createClient();
  const check = await getBookingOwnership(authClient, bookingId);
  if (!check.ok) return { success: false, error: check.error };

  const supabase = createAdminClient();

  // Cascade: schedules and payments have ON DELETE CASCADE; booking_items may not
  await supabase.from('booking_items').delete().eq('booking_id', bookingId);
  await supabase.from('schedules').delete().eq('booking_id', bookingId);

  const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
  if (error) {
    console.error('[deleteBooking] bookings', error);
    return { success: false, error: error.message };
  }
  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateBookingDates(
  bookingId: string,
  move_out_date: string,
  move_in_date: string,
  move_out_time_slot: string
): Promise<ActionResult> {
  const authClient = await createClient();
  const check = await getBookingOwnership(authClient, bookingId);
  if (!check.ok) return { success: false, error: check.error };

  const supabase = createAdminClient();

  const { data: booking } = await supabase
    .from('bookings')
    .select('total_monthly_rate, dorm')
    .eq('id', bookingId)
    .single();

  const dorm = (booking?.dorm as string) ?? '';
  const slotCheck = await import('@/lib/booking/availability').then((m) =>
    m.isTimeSlotAvailable(move_out_date, move_out_time_slot, dorm, bookingId)
  );
  if (!slotCheck.available) {
    return { success: false, error: slotCheck.error ?? 'This time slot is not available.' };
  }

  const months = computeStorageBillMonths(move_out_date, move_in_date);
  const totalMonthlyRate = (booking?.total_monthly_rate as number) ?? 0;
  const totalPrice = totalMonthlyRate * months;

  // Update booking dates and recalculated total
  const { error: bookingErr } = await supabase
    .from('bookings')
    .update({
      move_out_date,
      move_in_date,
      move_out_time_slot,
      storage_months: months,
      total_price: totalPrice,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);
  if (bookingErr) {
    console.error('[updateBookingDates]', bookingErr);
    return { success: false, error: bookingErr.message };
  }

  // Keep schedules in sync — update dates on both move_out and move_in rows
  await supabase
    .from('schedules')
    .update({ date: move_out_date, time_slot: move_out_time_slot, updated_at: new Date().toISOString() })
    .eq('booking_id', bookingId)
    .eq('schedule_type', 'move_out');

  await supabase
    .from('schedules')
    .update({ date: move_in_date, updated_at: new Date().toISOString() })
    .eq('booking_id', bookingId)
    .eq('schedule_type', 'move_in');

  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateBookingItems(bookingId: string, items: BookingItemInput[]): Promise<ActionResult> {
  const authClient = await createClient();
  const check = await getUnpaidBookingOwnership(authClient, bookingId);
  if (!check.ok) return { success: false, error: check.error };
  if (!items?.length) return { success: false, error: 'At least one item is required.' };

  const lineErr = validateBookingLineItems(items);
  if (lineErr) return { success: false, error: lineErr };

  const boxItem = items.find((i) => i.item_type === 'box');
  const boxQuantity = boxItem ? boxItem.quantity : 0;

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from('bookings')
    .select('move_out_date, move_in_date')
    .eq('id', bookingId)
    .single();
  const moveOut = existing?.move_out_date ?? '';
  const moveIn = existing?.move_in_date ?? '';
  const months = computeStorageBillMonths(moveOut, moveIn);
  const totalMonthlyRate = items.reduce((sum, i) => sum + (i.unit_price_cents / 100) * i.quantity, 0);
  const totalPrice = totalMonthlyRate * months;

  const { error: delError } = await supabase.from('booking_items').delete().eq('booking_id', bookingId);
  if (delError) {
    console.error('[updateBookingItems] delete', delError);
    return { success: false, error: delError.message };
  }

  const itemsToInsert = items.map((item) => {
    const monthlyRate = item.unit_price_cents / 100;
    const subtotal = monthlyRate * item.quantity;
    const itemCategory = getItemCategory(item.item_type as BookingItemType);
    return {
      booking_id: bookingId,
      item_category: itemCategory,
      item_type: item.item_type,
      quantity: item.quantity,
      monthly_rate: monthlyRate,
      subtotal,
    };
  });
  const { error: insertError } = await supabase.from('booking_items').insert(itemsToInsert);
  if (insertError) {
    console.error('[updateBookingItems] insert', insertError);
    return { success: false, error: insertError.message };
  }

  const { error: updateError } = await supabase
    .from('bookings')
    .update({
      box_quantity: boxQuantity,
      total_monthly_rate: totalMonthlyRate,
      total_price: totalPrice,
      storage_months: months,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);
  if (updateError) {
    console.error('[updateBookingItems] update booking', updateError);
    return { success: false, error: updateError.message };
  }
  revalidatePath('/dashboard');
  revalidatePath(`/booking/edit/${bookingId}`);
  return { success: true };
}
