import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMoveInReminderUser } from '@/lib/email/send';

// Called daily by Vercel Cron. Sends reminder emails to students whose
// move-in date is exactly 28 days away and who haven't yet confirmed.
export async function GET(req: NextRequest) {
  // Protect the cron route from public access
  const authHeader = req.headers.get('authorization');
  const expectedSecret = process.env.CRON_SECRET?.trim();
  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Target date: 28 days from today (date only, ignoring time)
  const target = new Date();
  target.setDate(target.getDate() + 28);
  const targetStr = target.toISOString().slice(0, 10); // YYYY-MM-DD

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id,
      move_in_date,
      move_in_confirmed_at,
      school,
      dorm,
      status,
      users (
        full_name,
        email,
        parent_email
      )
    `)
    .eq('status', 'confirmed')
    .gte('move_in_date', `${targetStr}T00:00:00`)
    .lte('move_in_date', `${targetStr}T23:59:59`)
    .is('move_in_confirmed_at', null);

  if (error) {
    console.error('[cron/move-in-reminders] DB error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No bookings to remind today' });
  }

  let sent = 0;
  const failed: string[] = [];

  for (const booking of bookings) {
    const user = Array.isArray(booking.users) ? booking.users[0] : booking.users;
    if (!user?.email) continue;

    try {
      await sendMoveInReminderUser({
        to: user.email,
        parentEmail: user.parent_email ?? null,
        customerName: user.full_name ?? 'there',
        moveInDate: booking.move_in_date,
        school: booking.school ?? '',
        currentDorm: booking.dorm ?? undefined,
      });
      sent++;
    } catch (err) {
      console.error(`[cron/move-in-reminders] Failed for booking ${booking.id}:`, err);
      failed.push(booking.id);
    }
  }

  console.log(`[cron/move-in-reminders] Sent ${sent} reminders, ${failed.length} failed`);
  return NextResponse.json({ sent, failed });
}
