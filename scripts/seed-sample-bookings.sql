-- ============================================================
-- NoTime Storage — Sample Booking Seed Data
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Safe to re-run: uses ON CONFLICT DO NOTHING
-- ============================================================

DO $$
DECLARE
  u1 uuid := 'aaaaaaaa-0001-0001-0001-000000000001';
  u2 uuid := 'aaaaaaaa-0002-0002-0002-000000000002';
  u3 uuid := 'aaaaaaaa-0003-0003-0003-000000000003';
  u4 uuid := 'aaaaaaaa-0004-0004-0004-000000000004';

  b1 uuid := 'bbbbbbbb-0001-0001-0001-000000000001';
  b2 uuid := 'bbbbbbbb-0002-0002-0002-000000000002';
  b3 uuid := 'bbbbbbbb-0003-0003-0003-000000000003';
  b4 uuid := 'bbbbbbbb-0004-0004-0004-000000000004';
  b5 uuid := 'bbbbbbbb-0005-0005-0005-000000000005';
  b6 uuid := 'bbbbbbbb-0006-0006-0006-000000000006';
BEGIN

-- ── Test Users ─────────────────────────────────────────────
INSERT INTO public.users (id, full_name, email, phone)
VALUES
  (u1, 'Emma Richardson',  'emma.richardson@gmail.com',    '+1 (617) 555-0101'),
  (u2, 'Marcus Johnson',   'marcus.j.johnson@gmail.com',   '+1 (203) 555-0142'),
  (u3, 'Sophia Chen',      'sophia.chen@gmail.com',        '+1 (617) 555-0187'),
  (u4, 'Jake Williams',    'jake.williams@gmail.com',      '+1 (203) 555-0163')
ON CONFLICT (id) DO NOTHING;

-- ── Booking 1 ──────────────────────────────────────────────
-- Emma / Stonehill / 5 boxes / confirmed + paid / May 10
INSERT INTO public.bookings (
  id, user_id, school, status, payment_status,
  box_quantity, storage_months, total_monthly_rate, total_price,
  move_out_date, move_in_date, move_out_time_slot,
  dorm, elevator_available, stairs_required, created_at, updated_at
) VALUES (
  b1, u1, 'Stonehill College', 'confirmed', 'paid',
  5, 3, 300.00, 900.00,
  '2026-05-10', '2026-08-20', '09:00',
  'Boland Hall', true, false, now(), now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
VALUES (gen_random_uuid(), b1, 'box', 'box', 5, 60.00, 300.00)
ON CONFLICT DO NOTHING;

-- ── Booking 2 ──────────────────────────────────────────────
-- Marcus / UNH / 3 boxes / pending + unpaid / May 15
INSERT INTO public.bookings (
  id, user_id, school, status, payment_status,
  box_quantity, storage_months, total_monthly_rate, total_price,
  move_out_date, move_in_date, move_out_time_slot,
  dorm, elevator_available, stairs_required, created_at, updated_at
) VALUES (
  b2, u2, 'University of New Haven', 'pending', 'unpaid',
  3, 3, 165.00, 495.00,
  '2026-05-15', '2026-08-20', '10:00',
  'Bergami Hall', false, true, now(), now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
VALUES (gen_random_uuid(), b2, 'box', 'box', 3, 55.00, 165.00)
ON CONFLICT DO NOTHING;

-- ── Booking 3 ──────────────────────────────────────────────
-- Sophia / Stonehill / 8 boxes + 2 medium items / confirmed + unpaid / May 18
INSERT INTO public.bookings (
  id, user_id, school, status, payment_status,
  box_quantity, storage_months, total_monthly_rate, total_price,
  move_out_date, move_in_date, move_out_time_slot,
  dorm, elevator_available, stairs_required, created_at, updated_at
) VALUES (
  b3, u3, 'Stonehill College', 'confirmed', 'unpaid',
  8, 4, 498.00, 1992.00,
  '2026-05-18', '2026-09-10', '08:00',
  'Duffy Hall', true, false, now(), now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
VALUES
  (gen_random_uuid(), b3, 'box',  'box',              8, 60.00,  480.00),
  (gen_random_uuid(), b3, 'item', 'medium_with_box',  2,  9.00,   18.00)
ON CONFLICT DO NOTHING;

-- ── Booking 4 ──────────────────────────────────────────────
-- Jake / UNH / 2 boxes + 1 large item / pending + unpaid / May 12
INSERT INTO public.bookings (
  id, user_id, school, status, payment_status,
  box_quantity, storage_months, total_monthly_rate, total_price,
  move_out_date, move_in_date, move_out_time_slot,
  dorm, elevator_available, stairs_required, created_at, updated_at
) VALUES (
  b4, u4, 'University of New Haven', 'pending', 'unpaid',
  2, 3, 125.00, 375.00,
  '2026-05-12', '2026-08-20', '14:00',
  'Westside Hall', false, true, now(), now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
VALUES
  (gen_random_uuid(), b4, 'box',  'box',   2, 55.00, 110.00),
  (gen_random_uuid(), b4, 'item', 'large', 1, 15.00,  15.00)
ON CONFLICT DO NOTHING;

-- ── Booking 5 ──────────────────────────────────────────────
-- Marcus (2nd booking) / UNH / 6 boxes / confirmed + paid / May 20
INSERT INTO public.bookings (
  id, user_id, school, status, payment_status,
  box_quantity, storage_months, total_monthly_rate, total_price,
  move_out_date, move_in_date, move_out_time_slot,
  dorm, elevator_available, stairs_required, created_at, updated_at
) VALUES (
  b5, u2, 'University of New Haven', 'confirmed', 'paid',
  6, 3, 360.00, 1080.00,
  '2026-05-20', '2026-08-20', '11:00',
  'Gerber Hall', true, false, now(), now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
VALUES (gen_random_uuid(), b5, 'box', 'box', 6, 60.00, 360.00)
ON CONFLICT DO NOTHING;

-- ── Booking 6 ──────────────────────────────────────────────
-- Sophia (2nd booking) / Stonehill / 4 boxes + small items / pending + unpaid / May 22
INSERT INTO public.bookings (
  id, user_id, school, status, payment_status,
  box_quantity, storage_months, total_monthly_rate, total_price,
  move_out_date, move_in_date, move_out_time_slot,
  dorm, elevator_available, stairs_required, created_at, updated_at
) VALUES (
  b6, u3, 'Stonehill College', 'pending', 'unpaid',
  4, 3, 258.00, 774.00,
  '2026-05-22', '2026-08-25', '09:20',
  'Corning Hall', false, true, now(), now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
VALUES
  (gen_random_uuid(), b6, 'box',  'box',             4, 60.00, 240.00),
  (gen_random_uuid(), b6, 'item', 'small_with_box',  3,  9.00,  27.00)
ON CONFLICT DO NOTHING;

END $$;
