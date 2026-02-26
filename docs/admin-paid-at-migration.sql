-- Run this in Supabase SQL Editor so "Mark as paid" records when payment was recorded
-- and "Revenue this month" on the admin dashboard counts bookings marked paid this month.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

COMMENT ON COLUMN public.bookings.paid_at IS 'Set when booking is marked paid (admin or payment webhook). Used for revenue this month.';
