/**
 * Stripe webhook handler.
 *
 * Must use the Node runtime — Stripe signature verification needs the raw
 * request body (no JSON parsing), which Next.js App Router exposes via
 * `request.text()` on Node runtime routes.
 *
 * Events handled:
 *   - `checkout.session.completed` → deposit / booking balance / paid upgrade
 *   - `checkout.session.expired` / `async_payment_failed` → log only
 *
 * Idempotency: we never trust metadata alone. Every handler re-validates
 * ownership server-side and short-circuits if the expected flip is already in
 * place (replayed events, double delivery from Stripe).
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripe, getWebhookSecret } from '@/lib/stripe/server';
import type { StripeSessionMetadata } from '@/lib/stripe/config';
import type { BookingItemInput } from '@/lib/booking/types';
import { replaceBookingLineItems, storageMonthsForBooking } from '@/lib/booking/replace-booking-line-items';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch (err) {
    console.error('[stripe-webhook] failed to read raw body', err);
    return NextResponse.json({ error: 'Could not read request body' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, getWebhookSecret());
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[stripe-webhook] signature verification failed:', msg);
    return NextResponse.json({ error: `Webhook signature verification failed: ${msg}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'checkout.session.expired':
        console.warn('[stripe-webhook] session expired', {
          id: (event.data.object as Stripe.Checkout.Session).id,
          metadata: (event.data.object as Stripe.Checkout.Session).metadata,
        });
        break;

      case 'checkout.session.async_payment_failed':
        console.error('[stripe-webhook] async payment failed', {
          id: (event.data.object as Stripe.Checkout.Session).id,
          metadata: (event.data.object as Stripe.Checkout.Session).metadata,
        });
        break;

      default:
        if (process.env.NODE_ENV === 'development') {
          console.log('[stripe-webhook] ignored event', event.type);
        }
    }
  } catch (err) {
    console.error('[stripe-webhook] handler error', err);
    return NextResponse.json({ error: 'Handler failure' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ---------------------------------------------------------------------------

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata as Partial<StripeSessionMetadata> | null;
  const kind = metadata?.kind;

  if (!kind) {
    console.warn('[stripe-webhook] checkout.session.completed missing metadata.kind', session.id);
    return;
  }

  if (kind === 'deposit') {
    await handleDepositCompleted(session);
    return;
  }

  if (kind === 'booking') {
    await handleBookingCompleted(session);
    return;
  }

  if (kind === 'upgrade') {
    await handleUpgradeCompleted(session);
    return;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[stripe-webhook] unhandled kind', kind, session.id);
  }
}

// ---------------------------------------------------------------------------

async function handleDepositCompleted(session: Stripe.Checkout.Session) {
  const userId = (session.metadata as Partial<StripeSessionMetadata> | null)?.user_id;
  if (!userId) {
    console.error('[stripe-webhook] deposit session missing user_id metadata', session.id);
    return;
  }

  if (session.payment_status !== 'paid') {
    console.warn('[stripe-webhook] deposit session completed but payment_status !== paid', {
      id: session.id,
      payment_status: session.payment_status,
    });
    return;
  }

  const admin = createAdminClient();

  // Match users.id = auth.user.id OR users.auth_id = auth.user.id (schema varies).
  const { data: target, error: fetchErr } = await admin
    .from('users')
    .select('id, full_name, email, phone, school, parent_email, deposit_paid')
    .or(`id.eq.${userId},auth_id.eq.${userId}`)
    .limit(1)
    .single();

  if (fetchErr || !target) {
    console.error('[stripe-webhook] deposit user not found', { userId, fetchErr });
    return;
  }

  // Idempotency: already flipped → skip the DB write + email.
  if (target.deposit_paid === true) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[stripe-webhook] deposit already paid — skipping', { userId });
    }
    return;
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const { error: updateErr } = await admin
    .from('users')
    .update({
      deposit_paid: true,
      deposit_provider: 'stripe',
      deposit_stripe_session_id: session.id,
      deposit_stripe_payment_intent_id: paymentIntentId,
    })
    .eq('id', target.id);

  if (updateErr) {
    console.error('[stripe-webhook] deposit flip error', updateErr);
    throw updateErr;
  }

  // Emails — fire once, log but don't throw on failure.
  try {
    const { sendDepositConfirmedUser, sendDepositPaidAdmin } = await import('@/lib/email/send');
    const customerName = target.full_name?.trim() || target.email || 'Customer';
    if (target.email) {
      await sendDepositConfirmedUser({
        to: target.email,
        parentEmail: target.parent_email ?? null,
        customerName,
        depositAmount: 50,
      });
    }
    await sendDepositPaidAdmin({
      customerName,
      customerEmail: target.email ?? '',
      customerPhone: target.phone ?? undefined,
      school: target.school ?? '—',
      depositAmount: 50,
      userId: target.id,
      paidAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[stripe-webhook] deposit email error (non-fatal)', err);
  }

  // Note: we intentionally do NOT insert a payments row for the deposit here.
  // `payments.booking_id` is NOT NULL in the current schema. The $50 deposit
  // row is inserted later by createBooking when the user completes a booking;
  // it reads users.deposit_provider + deposit_stripe_* (set above) to stamp
  // the correct provider and Stripe IDs on that row.
}

// ---------------------------------------------------------------------------

async function handleBookingCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata as Partial<StripeSessionMetadata> | null;
  const bookingId = metadata && 'booking_id' in metadata ? metadata.booking_id : undefined;

  if (!bookingId) {
    console.error('[stripe-webhook] booking session missing booking_id', session.id);
    return;
  }

  if (session.payment_status !== 'paid') {
    console.warn('[stripe-webhook] booking session completed but payment_status !== paid', {
      id: session.id,
      payment_status: session.payment_status,
    });
    return;
  }

  const admin = createAdminClient();

  // Idempotency check #1: have we already recorded this exact session?
  const { data: existingPayment } = await admin
    .from('payments')
    .select('id')
    .eq('stripe_checkout_session_id', session.id)
    .limit(1);

  if (existingPayment && existingPayment.length > 0) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[stripe-webhook] session already recorded — skipping', session.id);
    }
    return;
  }

  const { data: booking } = await admin
    .from('bookings')
    .select(
      'id, user_id, total_price, total_monthly_rate, payment_status, status, school, dorm, room, elevator_available, stairs_required, move_out_date, move_in_date, move_out_time_slot, move_in_time_slot, special_instructions, box_quantity, created_at, updated_at, payment_plan, booking_items(item_type, quantity, monthly_rate, subtotal)',
    )
    .eq('id', bookingId)
    .single();

  if (!booking) {
    console.error('[stripe-webhook] booking not found', { bookingId, sessionId: session.id });
    return;
  }

  // Idempotency check #2: booking already marked paid (earlier admin action?).
  if (booking.payment_status === 'paid') {
    if (process.env.NODE_ENV === 'development') {
      console.log('[stripe-webhook] booking already paid — skipping', { bookingId });
    }
    return;
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const now = new Date().toISOString();

  const { error: updateErr } = await admin
    .from('bookings')
    .update({
      payment_status: 'paid',
      status: 'confirmed',
      paid_at: now,
      updated_at: now,
    })
    .eq('id', bookingId);

  if (updateErr) {
    console.error('[stripe-webhook] booking flip error', updateErr);
    throw updateErr;
  }

  // Promote the pre-inserted `pending` row (from createBooking) if present;
  // otherwise insert a fresh succeeded row.
  const { data: pendingRows } = await admin
    .from('payments')
    .select('id')
    .eq('booking_id', bookingId)
    .eq('payment_type', 'full_payment')
    .eq('status', 'pending');

  if (pendingRows && pendingRows.length > 0) {
    const { error: promoteErr } = await admin
      .from('payments')
      .update({
        amount: booking.total_price,
        status: 'succeeded',
        provider: 'stripe',
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: paymentIntentId,
      })
      .eq('id', pendingRows[0].id);
    if (promoteErr) {
      console.error('[stripe-webhook] payments promote error', promoteErr);
    }
  } else {
    const { error: insertErr } = await admin
      .from('payments')
      .insert({
        booking_id: bookingId,
        amount: booking.total_price,
        payment_type: 'full_payment',
        status: 'succeeded',
        provider: 'stripe',
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: paymentIntentId,
      });
    if (insertErr) {
      console.error('[stripe-webhook] payments insert error', insertErr);
    }
  }

  // Fire the order-confirmed customer email. Re-use the same helper the admin
  // path uses so the email template stays consistent.
  try {
    const { sendBookingConfirmationToCustomer } = await import('@/lib/booking/integrations');
    const items = (((booking as unknown as { booking_items?: Array<{ item_type: string; quantity: number; monthly_rate: number | string }> }).booking_items) ?? []).map((r) => ({
      item_type: r.item_type as unknown as import('@/lib/booking/types').BookingItemType,
      quantity: Number(r.quantity) || 0,
      unit_price_cents: Math.round(
        (typeof r.monthly_rate === 'number' ? r.monthly_rate : parseFloat(String(r.monthly_rate || 0))) * 100,
      ),
    }));
    const monthlyRateNum =
      typeof booking.total_monthly_rate === 'number'
        ? booking.total_monthly_rate
        : parseFloat(String(booking.total_monthly_rate || 0));
    await sendBookingConfirmationToCustomer({
      id: booking.id,
      user_id: booking.user_id,
      status: 'confirmed',
      move_out_date: booking.move_out_date,
      move_in_date: booking.move_in_date,
      move_out_time_slot: booking.move_out_time_slot,
      dorm: booking.dorm,
      room: booking.room ?? null,
      elevator_available: !!booking.elevator_available,
      stairs_required: !!booking.stairs_required,
      school: booking.school,
      monthly_total_cents: Math.round(monthlyRateNum * 100),
      total_monthly_rate: monthlyRateNum,
      total_price:
        typeof booking.total_price === 'number'
          ? booking.total_price
          : parseFloat(String(booking.total_price)) || 0,
      box_quantity: booking.box_quantity ?? 0,
      payment_plan: (booking.payment_plan as 'full' | 'monthly') ?? 'full',
      special_instructions: booking.special_instructions ?? null,
      created_at: booking.created_at,
      updated_at: booking.updated_at,
      items,
    });
  } catch (err) {
    console.error('[stripe-webhook] booking confirmation email error', err);
  }
}

// ---------------------------------------------------------------------------

async function handleUpgradeCompleted(session: Stripe.Checkout.Session) {
  const meta = session.metadata as Partial<Extract<StripeSessionMetadata, { kind: 'upgrade' }>> | null;
  const pendingId = meta?.pending_upgrade_id;
  const bookingId = meta?.booking_id;
  if (!pendingId || !bookingId) {
    console.error('[stripe-webhook] upgrade session missing pending_upgrade_id or booking_id', session.id);
    return;
  }

  if (session.payment_status !== 'paid') {
    console.warn('[stripe-webhook] upgrade session completed but payment_status !== paid', {
      id: session.id,
      payment_status: session.payment_status,
    });
    return;
  }

  const admin = createAdminClient();

  const { data: existingPayment } = await admin
    .from('payments')
    .select('id')
    .eq('stripe_checkout_session_id', session.id)
    .limit(1);

  if (existingPayment && existingPayment.length > 0) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[stripe-webhook] upgrade session already recorded — skipping', session.id);
    }
    return;
  }

  const { data: pending, error: pendingErr } = await admin
    .from('pending_stripe_booking_upgrades')
    .select('id, booking_id, owner_user_id, new_items, delta_cents, stripe_checkout_session_id, consumed_at')
    .eq('id', pendingId)
    .single();

  if (pendingErr || !pending) {
    console.error('[stripe-webhook] pending upgrade not found', { pendingId, pendingErr });
    return;
  }

  if (pending.consumed_at) {
    return;
  }

  if (pending.booking_id !== bookingId) {
    console.error('[stripe-webhook] upgrade booking_id metadata mismatch', { pendingId, bookingId });
    return;
  }

  if (pending.stripe_checkout_session_id && pending.stripe_checkout_session_id !== session.id) {
    console.error('[stripe-webhook] upgrade session id does not match pending row', {
      session: session.id,
      pending: pending.stripe_checkout_session_id,
    });
    return;
  }

  const amountTotal = session.amount_total;
  if (amountTotal == null || amountTotal !== pending.delta_cents) {
    console.error('[stripe-webhook] upgrade amount mismatch', {
      amountTotal,
      expected: pending.delta_cents,
      sessionId: session.id,
    });
    return;
  }

  const { data: booking } = await admin
    .from('bookings')
    .select('id, user_id, payment_status, move_out_date, move_in_date, total_price')
    .eq('id', bookingId)
    .single();

  if (!booking) {
    console.error('[stripe-webhook] upgrade booking not found', bookingId);
    return;
  }

  if (booking.user_id !== pending.owner_user_id) {
    console.error('[stripe-webhook] upgrade owner mismatch', { bookingId, pendingId });
    return;
  }

  if (booking.payment_status !== 'paid') {
    console.error('[stripe-webhook] upgrade booking is not paid — refusing to apply items', bookingId);
    return;
  }

  const newItems = pending.new_items as unknown as BookingItemInput[];
  const oldTotal = Number(booking.total_price);
  const newMonthlyRate = newItems.reduce((sum, i) => sum + (i.unit_price_cents / 100) * i.quantity, 0);
  const months = storageMonthsForBooking(booking.move_out_date, booking.move_in_date);
  const newTotalPrice = newMonthlyRate * months;
  const expectedDelta = Math.round((newTotalPrice - oldTotal) * 100);
  if (expectedDelta !== pending.delta_cents) {
    console.error('[stripe-webhook] upgrade delta drift — refusing apply (booking changed since checkout?)', {
      expectedDelta,
      lockedDelta: pending.delta_cents,
      bookingId,
    });
    return;
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const applied = await replaceBookingLineItems(
    admin,
    bookingId,
    booking.move_out_date,
    booking.move_in_date,
    newItems,
  );

  if (!applied.ok) {
    console.error('[stripe-webhook] upgrade replace line items failed', applied.error);
    throw new Error(applied.error);
  }

  const { error: payErr } = await admin.from('payments').insert({
    booking_id: bookingId,
    amount: pending.delta_cents / 100,
    payment_type: 'full_payment',
    status: 'succeeded',
    provider: 'stripe',
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: paymentIntentId,
  });

  if (payErr) {
    console.error('[stripe-webhook] upgrade payment insert error', payErr);
  }

  const { error: consumeErr } = await admin
    .from('pending_stripe_booking_upgrades')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', pendingId);

  if (consumeErr) {
    console.error('[stripe-webhook] pending upgrade consume error', consumeErr);
  }
}
