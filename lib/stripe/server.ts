import 'server-only';
import Stripe from 'stripe';
import { STRIPE_API_VERSION, getStripeMode } from './config';

let cached: Stripe | null = null;

/**
 * Returns a cached Stripe SDK instance. Secret key is resolved at call time so
 * a missing env var throws a clear error only when Stripe is actually used,
 * not at module load (which would crash pages that don't touch payments).
 */
export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY is not set. Add it to .env.local / Vercel before using Stripe.',
    );
  }
  if (getStripeMode() === 'live' && !key.startsWith('sk_live_')) {
    throw new Error(
      'STRIPE_ENV=live but STRIPE_SECRET_KEY is not a live key (expected sk_live_*).',
    );
  }
  if (getStripeMode() === 'test' && !key.startsWith('sk_test_')) {
    throw new Error(
      'STRIPE_ENV=test (or unset) but STRIPE_SECRET_KEY is not a test key (expected sk_test_*).',
    );
  }
  cached = new Stripe(key, {
    apiVersion: STRIPE_API_VERSION,
    typescript: true,
    appInfo: {
      name: 'NoTime Storage',
      url: 'https://notimestorage.co',
    },
  });
  return cached;
}

/** Webhook signing secret — different per endpoint + per mode. */
export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error(
      'STRIPE_WEBHOOK_SECRET is not set. Copy the signing secret from Stripe Dashboard → Developers → Webhooks.',
    );
  }
  return secret;
}
