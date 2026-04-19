/**
 * Poll whether a Stripe upgrade Checkout session has been applied by the webhook.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id');
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }

  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('users')
    .select('id')
    .or(`id.eq.${user.id},auth_id.eq.${user.id}`)
    .limit(1)
    .maybeSingle();
  if (!profile?.id) {
    return NextResponse.json({ error: 'Account not found' }, { status: 403 });
  }

  const { data: pending, error } = await admin
    .from('pending_stripe_booking_upgrades')
    .select('id, booking_id, owner_user_id, consumed_at')
    .eq('stripe_checkout_session_id', sessionId)
    .maybeSingle();

  if (error) {
    console.error('[upgrade-status]', error);
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
  }

  if (!pending) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (pending.owner_user_id !== profile.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  return NextResponse.json({
    applied: pending.consumed_at != null,
    booking_id: pending.booking_id,
  });
}
