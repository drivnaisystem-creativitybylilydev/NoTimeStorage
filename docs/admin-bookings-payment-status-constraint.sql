-- Run this in Supabase SQL Editor if you get:
--   new row for relation "bookings" violates check constraint "bookings_payment_status_check"
-- The constraint currently only allows certain values; this allows 'unpaid' and 'paid'.

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_payment_status_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_payment_status_check
  CHECK (payment_status IN ('unpaid', 'paid'));
