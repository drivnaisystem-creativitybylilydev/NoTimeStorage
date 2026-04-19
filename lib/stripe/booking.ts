'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripe } from './server';
import {
  STRIPE_PRODUCT_NAMES,
  getSiteUrl,
  type StripeSessionMetadata,
} from './config';

export type CreateBookingCheckoutResult =
  | { success: true; url: string }
  | { success: false; error: string };

/**
 * Creates a Stripe Checkout session for the remaining booking balance (total
 * minus the $50 deposit that was already applied). The booking row must exist
 * first — the caller (booking payment page) runs `createBooking()` before this.
 *
 * Safety checks (lessons from Square): we re-load the booking server-side and
 * recompute the balance instead of trusting the client-supplied amount.
 */
export async function createBookingCheckoutSession(
  bookingId: string,
): Promise<CreateBookingCheckoutResult> {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) {
    return { success: false, error: 'You must be logged in to pay.' };
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('users')
    .select('id, email')
    .or(`id.eq.${user.id},auth_id.eq.${user.id}`)
    .limit(1)
    .single();
  if (!profile?.id) {
    return { success: false, error: 'Account not found. Please sign out and sign in again.' };
  }

  const { data: booking, error: bookingError } = await admin
    .from('bookings')
    .select('id, user_id, total_price, payment_status, status')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    console.error('[createBookingCheckoutSession] booking lookup error', bookingError);
    return { success: false, error: 'Booking not found.' };
  }
  if (booking.user_id !== profile.id) {
    return { success: false, error: 'This booking belongs to another account.' };
  }
  if (booking.payment_status === 'paid') {
    return { success: false, error: 'This booking is already paid.' };
  }

  const totalCents = Math.round(Number(booking.total_price) * 100);
  const balanceCents = totalCents - 5000;
  if (balanceCents <= 0) {
    return { success: false, error: 'Booking balance is $0. Nothing to pay.' };
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch (err) {
    console.error('[createBookingCheckoutSession] Stripe init failed', err);
    return { success: false, error: 'Online payment is not configured. Please try Venmo or contact support.' };
  }

  const metadata: Extract<StripeSessionMetadata, { kind: 'booking' }> = {
    kind: 'booking',
    user_id: user.id,
    booking_id: booking.id,
  };

  const siteUrl = getSiteUrl();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: profile.email ?? user.email ?? undefined,
      client_reference_id: booking.id,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: balanceCents,
            product_data: {
              name: STRIPE_PRODUCT_NAMES.booking,
              description: 'Remaining balance after your $50 deposit.',
            },
          },
          quantity: 1,
        },
      ],
      billing_address_collection: 'required',
      allow_promotion_codes: false,
      metadata,
      payment_intent_data: { metadata },
      success_url: `${siteUrl}/booking/confirmed?session_id={CHECKOUT_SESSION_ID}&bookingId=${booking.id}`,
      cancel_url: `${siteUrl}/booking/payment?cancelled=1&bookingId=${booking.id}`,
    });

    if (!session.url) {
      return { success: false, error: 'Stripe did not return a checkout URL. Please try again.' };
    }

    return { success: true, url: session.url };
  } catch (err) {
    console.error('[createBookingCheckoutSession] Stripe error', err);
    const msg = err instanceof Error ? err.message : 'Could not start checkout. Please try again.';
    return { success: false, error: msg };
  }
}
