-- Run this in Supabase SQL Editor to add scheduling columns to your existing bookings table.
-- Your schema already has: id, user_id, school, status, box_quantity, storage_months, total_monthly_rate, total_price, payment_status, academic_year, notes, created_at, updated_at.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS move_out_date date,
  ADD COLUMN IF NOT EXISTS move_in_date date,
  ADD COLUMN IF NOT EXISTS move_out_time_slot text,
  ADD COLUMN IF NOT EXISTS dorm text,
  ADD COLUMN IF NOT EXISTS elevator_available boolean,
  ADD COLUMN IF NOT EXISTS stairs_required boolean;
