'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { BookingItemInput } from '@/lib/booking/types';
import { validateBookingLineItems } from '@/lib/booking/addon-pricing';
import { getStripe } from './server';
import { STRIPE_PRODUCT_NAMES, getSiteUrl, type StripeSessionMetadata } from './config';
import { checkoutSessionUiHints } from './checkout-session-ui';
import { storageMonthsForBooking } from '@/lib/booking/replace-booking-line-items';

export type CreateUpgradeCheckoutResult =
  | { success: true; url: string }
  | { success: false; error: string };

/**
 * Stripe Checkout for a paid-booking item upgrade (delta only).
 * Inserts `pending_stripe_booking_upgrades` so the webhook can apply
 * `new_items` after payment — the DB is not changed until then.
 */
export async function createUpgradeCheckoutSession(
  bookingId: string,
  newItems: BookingItemInput[],
): Promise<CreateUpgradeCheckoutResult> {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) {
    return { success: false, error: 'You must be logged in.' };
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('users')
    .select('id, email')
    .or(`id.eq.${user.id},auth_id.eq.${user.id}`)
    .limit(1)
    .single();
  if (!profile?.id) {
    return { success: false, error: 'Account not found.' };
  }

  const { data: booking, error: bookingErr } = await admin
    .from('bookings')
    .select('id, user_id, payment_status, move_out_date, move_in_date, total_price')
    .eq('id', bookingId)
    .single();

  if (bookingErr || !booking) {
    return { success: false, error: 'Booking not found.' };
  }
  if (booking.user_id !== profile.id) {
    return { success: false, error: 'Unauthorized.' };
  }
  if (booking.payment_status !== 'paid') {
    return { success: false, error: 'Upgrade checkout is only for paid bookings.' };
  }

  const lineErr = validateBookingLineItems(newItems);
  if (lineErr) return { success: false, error: lineErr };

  const months = storageMonthsForBooking(booking.move_out_date, booking.move_in_date);
  const newMonthlyRate = newItems.reduce((sum, i) => sum + (i.unit_price_cents / 100) * i.quantity, 0);
  const newTotalPrice = newMonthlyRate * months;
  const oldTotal = Number(booking.total_price);
  const deltaCents = Math.round((newTotalPrice - oldTotal) * 100);
  if (deltaCents <= 0) {
    return { success: false, error: 'No charge for this change. Use Save without checkout.' };
  }

  const { data: pending, error: pendingErr } = await admin
    .from('pending_stripe_booking_upgrades')
    .insert({
      booking_id: bookingId,
      owner_user_id: profile.id,
      new_items: newItems,
      delta_cents: deltaCents,
    })
    .select('id')
    .single();

  if (pendingErr || !pending) {
    console.error('[createUpgradeCheckoutSession] pending insert', pendingErr);
    return {
      success: false,
      error:
        pendingErr?.message?.includes('pending_stripe_booking_upgrades') || pendingErr?.code === '42P01'
          ? 'Database migration required: run docs/stripe-pending-upgrade.sql in Supabase.'
          : (pendingErr?.message ?? 'Could not start upgrade checkout.'),
    };
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch (err) {
    console.error('[createUpgradeCheckoutSession] Stripe init', err);
    await admin.from('pending_stripe_booking_upgrades').delete().eq('id', pending.id);
    return { success: false, error: 'Online payment is not configured. Please try Venmo or contact support.' };
  }

  const metadata: Extract<StripeSessionMetadata, { kind: 'upgrade' }> = {
    kind: 'upgrade',
    user_id: user.id,
    booking_id: booking.id,
    pending_upgrade_id: pending.id,
    delta_cents: String(deltaCents),
  };

  const siteUrl = getSiteUrl();

  try {
    const session = await stripe.checkout.sessions.create({
      ...checkoutSessionUiHints,
      mode: 'payment',
      customer_email: profile.email ?? user.email ?? undefined,
      client_reference_id: `${booking.id}:${pending.id}`,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: deltaCents,
            product_data: {
              name: STRIPE_PRODUCT_NAMES.upgrade,
              description: 'Storage upgrade — added boxes or items.',
            },
          },
          quantity: 1,
        },
      ],
      billing_address_collection: 'required',
      allow_promotion_codes: false,
      metadata,
      payment_intent_data: { metadata },
      success_url: `${siteUrl}/booking/edit/${bookingId}?upgrade_session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/booking/edit/${bookingId}?upgrade_cancelled=1`,
    });

    if (!session.id) {
      await admin.from('pending_stripe_booking_upgrades').delete().eq('id', pending.id);
      return { success: false, error: 'Stripe did not return a session id.' };
    }

    await admin
      .from('pending_stripe_booking_upgrades')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', pending.id);

    if (!session.url) {
      await admin.from('pending_stripe_booking_upgrades').delete().eq('id', pending.id);
      return { success: false, error: 'Stripe did not return a checkout URL.' };
    }

    return { success: true, url: session.url };
  } catch (err) {
    console.error('[createUpgradeCheckoutSession] Stripe error', err);
    await admin.from('pending_stripe_booking_upgrades').delete().eq('id', pending.id);
    const msg = err instanceof Error ? err.message : 'Could not start checkout.';
    return { success: false, error: msg };
  }
}
