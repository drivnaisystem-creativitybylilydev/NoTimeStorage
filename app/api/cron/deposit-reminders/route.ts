import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendDepositNudgeUser } from '@/lib/email/send';

/** Wait this long after signup before the first nudge (hours). */
const MIN_ACCOUNT_AGE_HOURS = 48;
/** Minimum gap between nudge emails for the same user (days). */
const REMINDER_GAP_DAYS = 7;

/**
 * Vercel Cron: email users who signed up but have not paid the deposit.
 * Throttled with `users.deposit_reminder_last_sent_at` (run docs/deposit-reminder-migration.sql).
 * Skips users with any non-cancelled booking (already in the funnel).
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const expectedSecret = process.env.CRON_SECRET?.trim();
  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const now = Date.now();
  const minCreatedAt = new Date(now - MIN_ACCOUNT_AGE_HOURS * 60 * 60 * 1000).toISOString();
  const reminderCutoff = new Date(now - REMINDER_GAP_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, full_name, parent_email, deposit_paid, created_at, deposit_reminder_last_sent_at');

  if (usersError) {
    console.error('[cron/deposit-reminders] users query:', usersError);
    const msg = usersError.message ?? '';
    if (msg.includes('deposit_reminder_last_sent_at') || msg.includes('column')) {
      return NextResponse.json(
        {
          error: 'Missing column deposit_reminder_last_sent_at — run docs/deposit-reminder-migration.sql in Supabase.',
          details: usersError.message,
        },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  const { data: bookingRows, error: bookingsError } = await supabase
    .from('bookings')
    .select('user_id')
    .neq('status', 'cancelled');

  if (bookingsError) {
    console.error('[cron/deposit-reminders] bookings query:', bookingsError);
    return NextResponse.json({ error: bookingsError.message }, { status: 500 });
  }

  const userIdsWithBooking = new Set((bookingRows ?? []).map((r) => r.user_id).filter(Boolean));

  const candidates = (users ?? []).filter((u) => {
    const email = (u.email as string | null)?.trim();
    if (!email) return false;
    if (u.deposit_paid === true) return false;
    if (userIdsWithBooking.has(u.id)) return false;
    const created = u.created_at ? new Date(u.created_at).getTime() : 0;
    if (!created || created > new Date(minCreatedAt).getTime()) return false;
    const last = u.deposit_reminder_last_sent_at
      ? new Date(u.deposit_reminder_last_sent_at as string).getTime()
      : 0;
    if (last && last > new Date(reminderCutoff).getTime()) return false;
    return true;
  });

  if (candidates.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No users due for a deposit reminder' });
  }

  let sent = 0;
  const failed: string[] = [];

  for (const u of candidates) {
    const email = String(u.email).trim();
    const name = (u.full_name as string | null)?.trim() || 'there';
    const ok = await sendDepositNudgeUser({
      to: email,
      parentEmail: (u.parent_email as string | null) ?? null,
      customerName: name,
      depositAmount: 50,
    });

    if (!ok) {
      failed.push(u.id);
      continue;
    }

    const { error: updErr } = await supabase
      .from('users')
      .update({ deposit_reminder_last_sent_at: new Date().toISOString() })
      .eq('id', u.id);

    if (updErr) {
      console.error(`[cron/deposit-reminders] Failed to stamp user ${u.id}:`, updErr);
      failed.push(u.id);
      continue;
    }
    sent++;
  }

  console.log(`[cron/deposit-reminders] Sent ${sent} nudges, ${failed.length} failed/skipped`);
  return NextResponse.json({ sent, failed, candidates: candidates.length });
}
