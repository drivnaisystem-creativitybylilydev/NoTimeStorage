'use server';

import { createClient } from '@/lib/supabase/server';
import { sendMoveInDetailsUpdatedAdmin } from '@/lib/email/send';

export type MoveInDetailsInput = {
  bookingId: string;
  school: string;
  moveInDorm: string;
  moveInRoom: string;
  specialInstructions: string;
};

export type ActionResult = { success: true } | { success: false; error: string };

export async function updateMoveInDetails(input: MoveInDetailsInput): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Verify this booking belongs to the current user
  const { data: booking, error: fetchErr } = await supabase
    .from('bookings')
    .select('id, school, dorm, move_in_date, user_id, users!bookings_user_id_fkey(full_name, email)')
    .eq('id', input.bookingId)
    .single();

  if (fetchErr || !booking) return { success: false, error: 'Booking not found' };

  // Resolve public profile id
  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .or(`id.eq.${user.id},auth_id.eq.${user.id}`)
    .limit(1)
    .single();

  if (!profile || booking.user_id !== profile.id) {
    return { success: false, error: 'Not authorised' };
  }

  const now = new Date().toISOString();

  const { error: updateErr } = await supabase
    .from('bookings')
    .update({
      school: input.school,
      move_in_dorm: input.moveInDorm,
      move_in_room: input.moveInRoom,
      special_instructions: input.specialInstructions || null,
      move_in_confirmed_at: now,
      updated_at: now,
    })
    .eq('id', input.bookingId);

  if (updateErr) {
    console.error('[updateMoveInDetails]', updateErr);
    return { success: false, error: updateErr.message };
  }

  // Notify admin
  const userRow = Array.isArray((booking as any).users)
    ? (booking as any).users[0]
    : (booking as any).users;

  try {
    await sendMoveInDetailsUpdatedAdmin({
      studentName: userRow?.full_name || 'A student',
      studentEmail: userRow?.email || '',
      bookingId: input.bookingId,
      moveInDate: booking.move_in_date,
      school: input.school,
      moveInDorm: input.moveInDorm,
      moveInRoom: input.moveInRoom,
      specialInstructions: input.specialInstructions,
    });
  } catch (e) {
    console.error('[updateMoveInDetails] admin email failed', e);
  }

  return { success: true };
}
