'use server';

import { createClient } from '@/lib/supabase/server';

/** Interval in minutes: different dorms must be at least this far apart */
const INTERVAL_DIFFERENT_DORM_MIN = 20;
/** Interval in minutes: same dorm can be this close or same time (0 = same time OK) */
const INTERVAL_SAME_DORM_MIN = 5;

/** Parse "HH:mm" to minutes since midnight */
function timeToMinutes(time: string): number {
  const [h, m] = time.trim().split(':').map((s) => parseInt(s, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return -1;
  return h * 60 + m;
}

import { getDefaultTimeSlots } from './time-slots';

/**
 * Returns which time slots are available for a given move-out date and dorm.
 * Rules:
 * - Different dorm: 20 minutes must separate this slot from any other booking.
 * - Same dorm: 5 minutes separation or same time is allowed.
 */
export async function getAvailableTimeSlots(
  moveOutDate: string,
  dorm: string,
  excludeBookingId?: string
): Promise<{ value: string; label: string }[]> {
  if (!moveOutDate || !dorm) return getDefaultTimeSlots();

  const supabase = await createClient();

  let query = supabase
    .from('bookings')
    .select('move_out_time_slot, dorm')
    .eq('move_out_date', moveOutDate)
    .not('move_out_time_slot', 'is', null)
    .neq('status', 'cancelled');

  if (excludeBookingId) {
    query = query.neq('id', excludeBookingId);
  }

  const { data: existing, error } = await query;

  if (error) {
    console.error('[getAvailableTimeSlots]', error);
    return getDefaultTimeSlots();
  }

  const allSlots = getDefaultTimeSlots();
  const existingList = (existing || []).filter(
    (r) => r.move_out_time_slot && r.dorm
  ) as { move_out_time_slot: string; dorm: string }[];

  const available = allSlots.filter((slot) => {
    const slotMin = timeToMinutes(slot.value);
    if (slotMin < 0) return false;

    for (const e of existingList) {
      const existingMin = timeToMinutes(e.move_out_time_slot);
      if (existingMin < 0) continue;

      const diff = Math.abs(slotMin - existingMin);
      const sameDorm = e.dorm.trim().toLowerCase() === dorm.trim().toLowerCase();

      if (sameDorm) {
        if (diff > 0 && diff < INTERVAL_SAME_DORM_MIN) return false;
      } else {
        if (diff < INTERVAL_DIFFERENT_DORM_MIN) return false;
      }
    }
    return true;
  });

  return available;
}

/**
 * Check if a specific (date, time, dorm) is allowed. Use when creating or updating a booking.
 */
export async function isTimeSlotAvailable(
  moveOutDate: string,
  moveOutTimeSlot: string,
  dorm: string,
  excludeBookingId?: string
): Promise<{ available: boolean; error?: string }> {
  const slots = await getAvailableTimeSlots(moveOutDate, dorm, excludeBookingId);
  const available = slots.some((s) => s.value === moveOutTimeSlot);
  return {
    available,
    error: available ? undefined : 'This time slot is no longer available. Please choose another.',
  };
}
