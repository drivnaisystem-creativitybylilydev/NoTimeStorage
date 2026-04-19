-- Stripe deposit provenance on public.users
--
-- The deposit payments row is inserted inside createBooking() *after* the booking
-- exists, but the actual deposit is paid earlier (via Stripe Checkout or manually
-- reconciled via Venmo). We need somewhere to stash "how was this deposit paid"
-- between those two moments so createBooking() can stamp the correct provider +
-- Stripe IDs onto the deposit payments row.
--
-- Nullable on purpose: legacy rows (and users who haven't paid yet) stay NULL.
-- Safe to run multiple times.

BEGIN;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS deposit_provider              text,
  ADD COLUMN IF NOT EXISTS deposit_stripe_session_id     text,
  ADD COLUMN IF NOT EXISTS deposit_stripe_payment_intent_id text;

-- Constrain values so we can trust them in code.
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_deposit_provider_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_deposit_provider_check
  CHECK (deposit_provider IS NULL OR deposit_provider IN ('stripe','venmo','manual'));

COMMENT ON COLUMN public.users.deposit_provider IS
  'Rail used to collect the $50 deposit: stripe | venmo | manual. NULL until paid.';
COMMENT ON COLUMN public.users.deposit_stripe_session_id IS
  'Stripe Checkout session id (cs_...) for the deposit payment. Only set when deposit_provider = stripe.';
COMMENT ON COLUMN public.users.deposit_stripe_payment_intent_id IS
  'Stripe PaymentIntent id (pi_...) for the deposit payment. Only set when deposit_provider = stripe.';

COMMIT;

-- Rollback (ad-hoc):
-- ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_deposit_provider_check;
-- ALTER TABLE public.users DROP COLUMN IF EXISTS deposit_stripe_payment_intent_id;
-- ALTER TABLE public.users DROP COLUMN IF EXISTS deposit_stripe_session_id;
-- ALTER TABLE public.users DROP COLUMN IF EXISTS deposit_provider;
