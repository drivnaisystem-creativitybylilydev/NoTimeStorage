'use server';

import { createClient } from '@/lib/supabase/server';
import { getStripe } from './server';
import {
  DEPOSIT_AMOUNT_CENTS,
  STRIPE_PRODUCT_NAMES,
  getSiteUrl,
  type StripeSessionMetadata,
} from './config';

export type CreateDepositCheckoutResult =
  | { success: true; url: string }
  | { success: false; error: string };

/**
 * Creates a Stripe Checkout session for the $50 commitment deposit.
 * Customer is redirected to Stripe's hosted Checkout page; on success the
 * webhook flips `users.deposit_paid = true` and inserts a payments row.
 */
export async function createDepositCheckoutSession(): Promise<CreateDepositCheckoutResult> {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) {
    return { success: false, error: 'You must be logged in to pay the deposit.' };
  }

  const email = user.email ?? undefined;

  let stripe;
  try {
    stripe = getStripe();
  } catch (err) {
    console.error('[createDepositCheckoutSession] Stripe init failed', err);
    return { success: false, error: 'Online payment is not configured. Please try Venmo or contact support.' };
  }

  const metadata: Extract<StripeSessionMetadata, { kind: 'deposit' }> = {
    kind: 'deposit',
    user_id: user.id,
  };

  const siteUrl = getSiteUrl();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: DEPOSIT_AMOUNT_CENTS,
            product_data: {
              name: STRIPE_PRODUCT_NAMES.deposit,
              description: 'Credited in full toward your storage total at checkout.',
            },
          },
          quantity: 1,
        },
      ],
      billing_address_collection: 'required',
      allow_promotion_codes: false,
      metadata,
      payment_intent_data: { metadata },
      success_url: `${siteUrl}/deposit/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/deposit?cancelled=1`,
    });

    if (!session.url) {
      return { success: false, error: 'Stripe did not return a checkout URL. Please try again.' };
    }

    return { success: true, url: session.url };
  } catch (err) {
    console.error('[createDepositCheckoutSession] Stripe error', err);
    const msg = err instanceof Error ? err.message : 'Could not start checkout. Please try again.';
    return { success: false, error: msg };
  }
}
