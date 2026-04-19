-- ============================================================
-- Stripe migration: add provider + Stripe reference columns to `payments`.
-- Run this in the Supabase SQL editor (Production database) before deploying
-- the Stripe code. Safe to re-run.
--
-- Post-run state:
--   - payments.provider tracks which rail a row came from (stripe | venmo | manual).
--   - Existing rows default to 'venmo' since all current payments came in via Venmo.
--   - stripe_checkout_session_id is UNIQUE where not null → webhook idempotency.
--   - stripe_payment_intent_id is nullable — filled by the webhook.
-- ============================================================

BEGIN;

-- 1. Add the provider column with a sensible default for new rows.
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'manual';

-- 2. Back-fill: everything that came in before Stripe was Venmo.
--    (Deposit rows inserted from create-booking.ts were 'succeeded' with no
--    Square id; balance rows are 'pending' waiting for manual confirmation.)
UPDATE public.payments
SET provider = 'venmo'
WHERE provider = 'manual';

-- 3. Stripe reference columns.
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;

-- 4. Idempotency: a single checkout session can only map to one payments row.
--    The webhook uses this to detect and skip duplicate event deliveries.
CREATE UNIQUE INDEX IF NOT EXISTS payments_stripe_checkout_session_id_key
  ON public.payments (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

-- 5. Lookup index — occasionally useful in the admin panel.
CREATE INDEX IF NOT EXISTS payments_stripe_payment_intent_id_idx
  ON public.payments (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- 6. Guard: provider values we allow.
ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_provider_check;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_provider_check
  CHECK (provider IN ('stripe', 'venmo', 'manual'));

COMMIT;

-- ============================================================
-- Rollback (if ever needed):
--
-- BEGIN;
-- ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_provider_check;
-- DROP INDEX IF EXISTS payments_stripe_checkout_session_id_key;
-- DROP INDEX IF EXISTS payments_stripe_payment_intent_id_idx;
-- ALTER TABLE public.payments DROP COLUMN IF EXISTS stripe_checkout_session_id;
-- ALTER TABLE public.payments DROP COLUMN IF EXISTS stripe_payment_intent_id;
-- ALTER TABLE public.payments DROP COLUMN IF EXISTS provider;
-- COMMIT;
-- ============================================================
