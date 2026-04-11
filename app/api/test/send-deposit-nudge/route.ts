import { NextRequest, NextResponse } from 'next/server';
import { sendDepositNudgeUser } from '@/lib/email/send';

/**
 * One-off preview of the deposit reminder email. Same auth as cron.
 * Does NOT read or update Supabase (no deposit_reminder_last_sent_at).
 *
 * curl example:
 *   curl -sS -H "Authorization: Bearer $CRON_SECRET" \
 *     "https://notimestorage.co/api/test/send-deposit-nudge?to=you@example.com&name=Finn"
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const expectedSecret = process.env.CRON_SECRET?.trim();
  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const to = req.nextUrl.searchParams.get('to')?.trim();
  if (!to || !to.includes('@')) {
    return NextResponse.json(
      { error: 'Missing or invalid to= query param (email address)' },
      { status: 400 },
    );
  }

  const name = req.nextUrl.searchParams.get('name')?.trim() || 'there';

  const ok = await sendDepositNudgeUser({
    to,
    parentEmail: null,
    customerName: name,
    depositAmount: 50,
  });

  if (!ok) {
    return NextResponse.json(
      { error: 'Resend did not accept the send (check RESEND_API_KEY and logs)' },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, to, name });
}
