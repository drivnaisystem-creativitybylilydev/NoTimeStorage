/**
 * Shared Stripe config + types used by server actions and the webhook handler.
 * Single source of truth for live-vs-test selection, siteUrl resolution, and
 * the `metadata.kind` contract the webhook relies on.
 */

export type StripeMode = 'test' | 'live';

/** 'live' only when STRIPE_ENV is exactly 'live'. Everything else = test mode. */
export function getStripeMode(): StripeMode {
  return process.env.STRIPE_ENV === 'live' ? 'live' : 'test';
}

/** Base URL used to build absolute success/cancel redirects. */
export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    'https://notimestorage.co';
  return raw.replace(/\/$/, '');
}

/** Link into the Stripe Dashboard for a given PaymentIntent (used in admin UI). */
export function stripeDashboardPaymentUrl(paymentIntentId: string): string {
  const prefix = getStripeMode() === 'live' ? 'payments' : 'test/payments';
  return `https://dashboard.stripe.com/${prefix}/${paymentIntentId}`;
}

/**
 * Feature flag controlling whether the Stripe button renders on customer pages.
 * Must be readable on the client, so it uses a NEXT_PUBLIC_ env var.
 * Default OFF — safe deploys; flip to true in Vercel Production when ready.
 */
export function isStripeEnabledClient(): boolean {
  const v = process.env.NEXT_PUBLIC_STRIPE_PAYMENTS_ENABLED;
  return v === 'true' || v === '1';
}

/**
 * `metadata.kind` is the webhook's trust boundary — every Checkout session we
 * create tags itself so the webhook knows which flow completed.
 */
export type CheckoutKind = 'deposit' | 'booking' | 'upgrade';

export type StripeSessionMetadata =
  | {
      kind: 'deposit';
      user_id: string;
    }
  | {
      kind: 'booking';
      user_id: string;
      booking_id: string;
    }
  | {
      kind: 'upgrade';
      user_id: string;
      booking_id: string;
      pending_upgrade_id: string;
      delta_cents: string;
    };

/**
 * Product names shown on the hosted Checkout page. Keep these short and
 * customer-friendly — they appear on the payment page and the receipt.
 */
export const STRIPE_PRODUCT_NAMES = {
  deposit: 'NoTime Storage — $50 Commitment Deposit',
  booking: 'NoTime Storage — Booking Balance',
  upgrade: 'NoTime Storage — Booking Upgrade',
} as const;

/** Flat deposit amount used everywhere. Keep in sync with the UI copy. */
export const DEPOSIT_AMOUNT_CENTS = 5000;

/** Stripe API version we pin to. Change deliberately. Must match stripe SDK's LatestApiVersion. */
export const STRIPE_API_VERSION = '2026-03-25.dahlia' as const;
