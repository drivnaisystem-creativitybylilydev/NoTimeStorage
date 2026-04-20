import type Stripe from 'stripe';

/**
 * Shared Checkout Session tweaks for clearer wallet vs card UX on mobile Safari.
 * Hosted Checkout UI is still Stripe-controlled; this nudges copy and origin hints.
 */
export const checkoutSessionUiHints = {
  origin_context: 'web' as const,
  custom_text: {
    submit: {
      message:
        'If you see Apple Pay or Google Pay, you can use that and skip the card form—only fill card details for a regular card.',
    },
  },
} satisfies Partial<Stripe.Checkout.SessionCreateParams>;
