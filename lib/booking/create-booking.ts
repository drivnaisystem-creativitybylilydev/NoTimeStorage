'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { CreateBookingInput, BookingWithItems, BookingItemType } from './types';
import { onBookingCreated } from './integrations';
import { isTimeSlotAvailable } from './availability';

export type CreateBookingResult =
  | { success: true; bookingId: string; debug?: Record<string, unknown> }
  | { success: false; error: string; debug?: Record<string, unknown> };

function getItemCategory(itemType: BookingItemType): string {
  return itemType === 'box' ? 'box' : 'item';
}

function storageMonths(moveOut: string, moveIn: string): number {
  const start = new Date(moveOut);
  const end = new Date(moveIn);
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return Math.max(1, months);
}

export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  console.log('[createBooking] server action called');
  // Auth check via anon client
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return { success: false, error: 'You must be logged in to create a booking.' };
  }
  // All DB writes via admin client (bypasses RLS)
  const supabase = createAdminClient();

  if (input.user_id !== user.id) {
    return { success: false, error: 'User ID does not match session.' };
  }

  if (!input.items?.length) {
    return { success: false, error: 'At least one item (boxes or additional items) is required.' };
  }

  const slotCheck = await isTimeSlotAvailable(
    input.move_out_date,
    input.move_out_time_slot,
    input.dorm
  );
  if (!slotCheck.available) {
    return { success: false, error: slotCheck.error ?? 'This time slot is not available.' };
  }

  // Bookings RLS expects user_id = public.users.id. Match by id or auth_id (schema varies).
  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .or(`id.eq.${user.id},auth_id.eq.${user.id}`)
    .limit(1)
    .single();

  if (!profile?.id) {
    return { success: false, error: 'Account not found. Please sign out and sign in again.' };
  }

  const boxItem = input.items.find((i) => i.item_type === 'box');
  const boxQuantity = boxItem ? boxItem.quantity : 0;
  const months = storageMonths(input.move_out_date, input.move_in_date);
  const totalMonthlyRate = input.monthly_total_cents / 100;
  const totalPrice = totalMonthlyRate * months;

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      user_id: profile.id,
      school: input.school,
      status: 'pending',
      box_quantity: boxQuantity,
      storage_months: months,
      total_monthly_rate: totalMonthlyRate,
      total_price: totalPrice,
      payment_status: 'unpaid',
      payment_plan: input.payment_plan ?? 'full',
      room: input.room ?? null,
      special_instructions: input.special_instructions ?? null,
      move_out_date: input.move_out_date,
      move_in_date: input.move_in_date,
      move_out_time_slot: input.move_out_time_slot,
      move_in_time_slot: input.move_in_time_slot ?? null,
      dorm: input.dorm,
      elevator_available: input.elevator_available,
      stairs_required: input.stairs_required,
    })
    .select('id, user_id, status, move_out_date, move_in_date, move_out_time_slot, dorm, room, elevator_available, stairs_required, school, total_monthly_rate, special_instructions, created_at, updated_at')
    .single();

  if (bookingError) {
    console.error('[createBooking] booking insert error', bookingError);
    return {
      success: false,
      error: bookingError.message,
      debug: process.env.NODE_ENV === 'development'
        ? { stage: 'insert_booking', bookingError }
        : undefined,
    };
  }

  console.log('[createBooking] booking inserted', booking.id);

  const itemsToInsert = input.items.map((item) => {
    const monthlyRate = item.unit_price_cents / 100;
    const subtotal = monthlyRate * item.quantity;
    const itemCategory = getItemCategory(item.item_type);
    return {
      booking_id: booking.id,
      item_category: itemCategory,
      item_type: item.item_type,
      quantity: item.quantity,
      monthly_rate: monthlyRate,
      subtotal,
    };
  });

  const { error: itemsError } = await supabase.from('booking_items').insert(itemsToInsert);

  if (itemsError) {
    console.error('[createBooking] booking_items insert error', itemsError);
    await supabase.from('bookings').delete().eq('id', booking.id);
    return {
      success: false,
      error: itemsError.message,
      debug: process.env.NODE_ENV === 'development'
        ? { stage: 'insert_items', itemsError }
        : undefined,
    };
  }

  // ── Schedules ───────────────────────────────────────────────────────────────
  // Create one row for move-out and one for move-in so the schedules table
  // has a complete record of both events for this booking.
  const schedulesToInsert = [
    {
      booking_id: booking.id,
      schedule_type: 'move_out',
      date: input.move_out_date,
      time_slot: input.move_out_time_slot,
      dorm_name: input.dorm,
      room_number: input.room ?? null,
      has_elevator: input.elevator_available,
      has_stairs: input.stairs_required,
      special_notes: input.special_instructions ?? null,
      status: 'scheduled',
    },
    {
      booking_id: booking.id,
      schedule_type: 'move_in',
      date: input.move_in_date,
      time_slot: input.move_in_time_slot ?? '09:00:00',
      dorm_name: input.dorm,
      room_number: input.room ?? null,
      has_elevator: input.elevator_available,
      has_stairs: input.stairs_required,
      special_notes: null,
      status: 'scheduled',
    },
  ];

  const { error: schedulesError } = await supabase
    .from('schedules')
    .insert(schedulesToInsert);

  if (schedulesError) {
    console.error('[createBooking] schedules insert error', schedulesError);
    // Non-fatal — booking already created, don't roll back
  }

  // ── Payments ─────────────────────────────────────────────────────────────
  // Record the deposit as already paid (collected before booking was created).
  // stripe_transaction_id stores the Square payment ID — column will be
  // renamed in a future migration.
  const { error: paymentError } = await supabase
    .from('payments')
    .insert({
      booking_id: booking.id,
      amount: 50,
      payment_type: 'deposit',
      square_payment_id: null,
      status: 'succeeded',
    });

  if (paymentError) {
    console.error('[createBooking] payments insert error', paymentError);
    // Non-fatal — booking already created, don't roll back
  }

  const bookingForHooks: BookingWithItems = {
    id: booking.id,
    user_id: booking.user_id,
    status: booking.status as BookingWithItems['status'],
    move_out_date: booking.move_out_date,
    move_in_date: booking.move_in_date,
    move_out_time_slot: booking.move_out_time_slot,
    dorm: booking.dorm,
    room: booking.room ?? null,
    elevator_available: booking.elevator_available,
    stairs_required: booking.stairs_required,
    school: booking.school,
    monthly_total_cents: Math.round(totalMonthlyRate * 100),
    total_monthly_rate: totalMonthlyRate,
    total_price: totalPrice,
    box_quantity: boxQuantity,
    payment_plan: (input.payment_plan ?? 'full') as 'full' | 'monthly',
    special_instructions: booking.special_instructions ?? null,
    created_at: booking.created_at,
    updated_at: booking.updated_at,
    items: input.items,
  };

  const debug: Record<string, unknown> | undefined =
    process.env.NODE_ENV === 'development'
      ? {
          stage: 'after_insert',
          emailTo: process.env.BOOKING_NOTIFY_EMAIL ?? null,
          hasResendApiKey: !!process.env.RESEND_API_KEY,
        }
      : undefined;

  try {
    await onBookingCreated(bookingForHooks);
    if (debug) {
      debug.integrationHook = 'ok';
    }
  } catch (err) {
    console.error('[createBooking] integration hook error', err);
    if (debug) {
      debug.integrationHook = 'error';
      debug.integrationError = err instanceof Error ? err.message : String(err);
    }
  }

  return { success: true, bookingId: booking.id, debug };
}
