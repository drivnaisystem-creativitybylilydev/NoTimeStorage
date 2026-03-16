-- ============================================================
-- NoTime Storage — Sample Data for ALL Schools (Admin Demo)
-- Run this in: Supabase Dashboard → SQL Editor → New Query
--
-- Creates one user + one booking per school so the admin dashboard
-- shows all 12 schools. Run this to demonstrate that the admin
-- logs all schools, not just Stonehill and UNH.
--
-- Schools: Stonehill, UNH, Dayton, UMass, Brevard, Gordon, CCSU,
--          Sacred Heart, Towson, Notre Dame, JMU, Bridgewater
--
-- Safe to re-run: uses ON CONFLICT DO NOTHING / DO UPDATE
-- ============================================================

DO $$
DECLARE
  u_stonehill  uuid := 'aaaaaaaa-0001-0001-0001-000000000001';
  u_unh        uuid := 'aaaaaaaa-0002-0002-0002-000000000002';
  u_dayton     uuid := 'aaaaaaaa-0003-0003-0003-000000000003';
  u_umass      uuid := 'aaaaaaaa-0004-0004-0004-000000000004';
  u_brevard    uuid := 'aaaaaaaa-0005-0005-0005-000000000005';
  u_gordon     uuid := 'aaaaaaaa-0006-0006-0006-000000000006';
  u_ccsu       uuid := 'aaaaaaaa-0007-0007-0007-000000000007';
  u_shu        uuid := 'aaaaaaaa-0008-0008-0008-000000000008';
  u_towson     uuid := 'aaaaaaaa-0009-0009-0009-000000000009';
  u_notredame  uuid := 'aaaaaaaa-0010-0010-0010-000000000010';
  u_jmu        uuid := 'aaaaaaaa-0011-0011-0011-000000000011';
  u_bridgewater uuid := 'aaaaaaaa-0012-0012-0012-000000000012';

  b_stonehill  uuid := 'bbbbbbbb-0001-0001-0001-000000000001';
  b_unh        uuid := 'bbbbbbbb-0002-0002-0002-000000000002';
  b_dayton     uuid := 'bbbbbbbb-0003-0003-0003-000000000003';
  b_umass      uuid := 'bbbbbbbb-0004-0004-0004-000000000004';
  b_brevard    uuid := 'bbbbbbbb-0005-0005-0005-000000000005';
  b_gordon     uuid := 'bbbbbbbb-0006-0006-0006-000000000006';
  b_ccsu       uuid := 'bbbbbbbb-0007-0007-0007-000000000007';
  b_shu        uuid := 'bbbbbbbb-0008-0008-0008-000000000008';
  b_towson     uuid := 'bbbbbbbb-0009-0009-0009-000000000009';
  b_notredame  uuid := 'bbbbbbbb-0010-0010-0010-000000000010';
  b_jmu        uuid := 'bbbbbbbb-0011-0011-0011-000000000011';
  b_bridgewater uuid := 'bbbbbbbb-0012-0012-0012-000000000012';
BEGIN

-- ── Users (one per school) ───────────────────────────────────
INSERT INTO public.users (id, full_name, email, phone, school, deposit_paid)
VALUES
  (u_stonehill,  'Emma Richardson',   'demo.stonehill@notimestorage.demo',   '+1 (508) 555-0101', 'Stonehill College', true),
  (u_unh,       'Marcus Johnson',    'demo.unh@notimestorage.demo',         '+1 (203) 555-0142', 'University of New Haven', true),
  (u_dayton,    'Jordan Miller',      'demo.dayton@notimestorage.demo',      '+1 (937) 555-0155', 'University of Dayton', true),
  (u_umass,     'Alex Chen',         'demo.umass@notimestorage.demo',       '+1 (413) 555-0166', 'University of Massachusetts', true),
  (u_brevard,   'Taylor Davis',       'demo.brevard@notimestorage.demo',    '+1 (828) 555-0177', 'Brevard College', true),
  (u_gordon,    'Morgan Walsh',       'demo.gordon@notimestorage.demo',     '+1 (978) 555-0188', 'Gordon College', true),
  (u_ccsu,      'Casey Rodriguez',    'demo.ccsu@notimestorage.demo',      '+1 (860) 555-0199', 'Central Connecticut State University', true),
  (u_shu,       'Riley O''Brien',     'demo.shu@notimestorage.demo',        '+1 (203) 555-0200', 'Sacred Heart University', true),
  (u_towson,    'Quinn Thompson',     'demo.towson@notimestorage.demo',     '+1 (410) 555-0211', 'Towson University', true),
  (u_notredame, 'Drew Sullivan',      'demo.notredame@notimestorage.demo',  '+1 (574) 555-0222', 'University of Notre Dame', true),
  (u_jmu,       'Sam Williams',        'demo.jmu@notimestorage.demo',       '+1 (540) 555-0233', 'James Madison University', true),
  (u_bridgewater, 'Jordan Lee',       'demo.bridgewater@notimestorage.demo','+1 (508) 555-0244', 'Bridgewater State University', true)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  school = EXCLUDED.school,
  deposit_paid = EXCLUDED.deposit_paid;

-- ── Bookings (one per school) ────────────────────────────────
-- Stonehill
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_stonehill, u_stonehill, 'Stonehill College', 'confirmed', 'paid', 2, 3, 110.00, 330.00, '2026-05-06', '2026-08-20', '09:00', 'Boland Hall', true, false, now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_stonehill, 'box', 'box', 2, 55.00, 110.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_stonehill);

-- UNH
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_unh, u_unh, 'University of New Haven', 'confirmed', 'paid', 3, 3, 165.00, 495.00, '2026-05-10', '2026-08-22', '10:00', 'Bergami Hall', false, true, now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_unh, 'box', 'box', 3, 55.00, 165.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_unh);

-- Dayton
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_dayton, u_dayton, 'University of Dayton', 'confirmed', 'paid', 4, 3, 240.00, 720.00, '2026-05-07', '2026-08-18', '11:00', 'Marianist Hall', true, false, now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_dayton, 'box', 'box', 4, 60.00, 240.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_dayton);

-- UMass
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_umass, u_umass, 'University of Massachusetts', 'pending', 'unpaid', 1, 3, 80.00, 240.00, '2026-05-12', '2026-08-25', '14:00', 'Baker Hall (Central)', true, false, now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_umass, 'box', 'box', 1, 80.00, 80.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_umass);

-- Brevard
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_brevard, u_brevard, 'Brevard College', 'confirmed', 'paid', 2, 3, 110.00, 330.00, '2026-05-05', '2026-08-15', '09:00', 'Beam Residence Hall', false, true, now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_brevard, 'box', 'box', 2, 55.00, 110.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_brevard);

-- Gordon
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_gordon, u_gordon, 'Gordon College', 'confirmed', 'unpaid', 3, 4, 165.00, 660.00, '2026-05-10', '2026-09-05', '10:00', 'Nyland Hall', true, false, now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_gordon, 'box', 'box', 3, 55.00, 165.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_gordon);

-- CCSU
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_ccsu, u_ccsu, 'Central Connecticut State University', 'pending', 'unpaid', 2, 3, 110.00, 330.00, '2026-05-15', '2026-08-20', '08:00', 'Mildred Barrows Hall', false, true, now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_ccsu, 'box', 'box', 2, 55.00, 110.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_ccsu);

-- Sacred Heart
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_shu, u_shu, 'Sacred Heart University', 'confirmed', 'paid', 1, 3, 80.00, 240.00, '2026-05-02', '2026-08-18', '12:00', 'Elizabeth Ann Seton Hall', true, false, now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_shu, 'box', 'box', 1, 80.00, 80.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_shu);

-- Towson
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_towson, u_towson, 'Towson University', 'confirmed', 'paid', 4, 3, 240.00, 720.00, '2026-05-15', '2026-08-22', '13:00', 'Millennium Hall', true, false, now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_towson, 'box', 'box', 4, 60.00, 240.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_towson);

-- Notre Dame
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_notredame, u_notredame, 'University of Notre Dame', 'pending', 'unpaid', 2, 3, 110.00, 330.00, '2026-05-05', '2026-08-20', '09:00', 'Alumni Hall', true, false, now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_notredame, 'box', 'box', 2, 55.00, 110.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_notredame);

-- JMU
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_jmu, u_jmu, 'James Madison University', 'confirmed', 'paid', 3, 3, 165.00, 495.00, '2026-05-12', '2026-08-25', '11:00', 'Alger Hall', false, true, now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_jmu, 'box', 'box', 3, 55.00, 165.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_jmu);

-- Bridgewater
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_bridgewater, u_bridgewater, 'Bridgewater State University', 'confirmed', 'paid', 2, 3, 110.00, 330.00, '2026-05-08', '2026-08-20', '10:00', 'Miles Hall', true, false, now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_bridgewater, 'box', 'box', 2, 55.00, 110.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_bridgewater);

END $$;
