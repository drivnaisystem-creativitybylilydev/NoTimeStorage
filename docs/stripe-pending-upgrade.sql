-- Pending paid booking upgrades paid via Stripe Checkout.
-- Run in Supabase SQL editor after docs/stripe-migration.sql.
-- The webhook loads `new_items` + `delta_cents` after payment succeeds.

BEGIN;

CREATE TABLE IF NOT EXISTS public.pending_stripe_booking_upgrades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL,
  new_items jsonb NOT NULL,
  delta_cents integer NOT NULL CHECK (delta_cents > 0),
  stripe_checkout_session_id text UNIQUE,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pending_stripe_booking_upgrades_booking_open_idx
  ON public.pending_stripe_booking_upgrades (booking_id)
  WHERE consumed_at IS NULL;

-- Lock to service-role only: app code uses createAdminClient(); anon/auth keys get no policies.
ALTER TABLE public.pending_stripe_booking_upgrades ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.pending_stripe_booking_upgrades IS
  'Holds target line items for a Stripe-paid booking upgrade until checkout.session.completed applies them.';

COMMIT;
