-- NoTime Storage demo: Cmd+A to select all, paste in Supabase SQL Editor, Run.
DO $$
DECLARE
  -- User IDs (2 per school)
  u_stonehill_1  uuid := 'aaaaaaaa-0001-0001-0001-000000000001';
  u_stonehill_2  uuid := 'aaaaaaaa-0001-0001-0001-000000000002';
  u_unh_1        uuid := 'aaaaaaaa-0002-0002-0002-000000000001';
  u_unh_2        uuid := 'aaaaaaaa-0002-0002-0002-000000000002';
  u_dayton_1     uuid := 'aaaaaaaa-0003-0003-0003-000000000001';
  u_dayton_2     uuid := 'aaaaaaaa-0003-0003-0003-000000000002';
  u_umass_1      uuid := 'aaaaaaaa-0004-0004-0004-000000000001';
  u_umass_2      uuid := 'aaaaaaaa-0004-0004-0004-000000000002';
  u_brevard_1    uuid := 'aaaaaaaa-0005-0005-0005-000000000001';
  u_brevard_2    uuid := 'aaaaaaaa-0005-0005-0005-000000000002';
  u_gordon_1     uuid := 'aaaaaaaa-0006-0006-0006-000000000001';
  u_gordon_2     uuid := 'aaaaaaaa-0006-0006-0006-000000000002';
  u_ccsu_1       uuid := 'aaaaaaaa-0007-0007-0007-000000000001';
  u_ccsu_2       uuid := 'aaaaaaaa-0007-0007-0007-000000000002';
  u_shu_1        uuid := 'aaaaaaaa-0008-0008-0008-000000000001';
  u_shu_2        uuid := 'aaaaaaaa-0008-0008-0008-000000000002';
  u_towson_1     uuid := 'aaaaaaaa-0009-0009-0009-000000000001';
  u_towson_2     uuid := 'aaaaaaaa-0009-0009-0009-000000000002';
  u_notredame_1  uuid := 'aaaaaaaa-0010-0010-0010-000000000001';
  u_notredame_2  uuid := 'aaaaaaaa-0010-0010-0010-000000000002';
  u_jmu_1        uuid := 'aaaaaaaa-0011-0011-0011-000000000001';
  u_jmu_2        uuid := 'aaaaaaaa-0011-0011-0011-000000000002';
  u_bridgewater_1 uuid := 'aaaaaaaa-0012-0012-0012-000000000001';
  u_bridgewater_2 uuid := 'aaaaaaaa-0012-0012-0012-000000000002';

  -- Booking IDs (2 per school)
  b_stonehill_1  uuid := 'bbbbbbbb-0001-0001-0001-000000000001';
  b_stonehill_2  uuid := 'bbbbbbbb-0001-0001-0001-000000000002';
  b_unh_1        uuid := 'bbbbbbbb-0002-0002-0002-000000000001';
  b_unh_2        uuid := 'bbbbbbbb-0002-0002-0002-000000000002';
  b_dayton_1     uuid := 'bbbbbbbb-0003-0003-0003-000000000001';
  b_dayton_2     uuid := 'bbbbbbbb-0003-0003-0003-000000000002';
  b_umass_1      uuid := 'bbbbbbbb-0004-0004-0004-000000000001';
  b_umass_2      uuid := 'bbbbbbbb-0004-0004-0004-000000000002';
  b_brevard_1    uuid := 'bbbbbbbb-0005-0005-0005-000000000001';
  b_brevard_2    uuid := 'bbbbbbbb-0005-0005-0005-000000000002';
  b_gordon_1     uuid := 'bbbbbbbb-0006-0006-0006-000000000001';
  b_gordon_2     uuid := 'bbbbbbbb-0006-0006-0006-000000000002';
  b_ccsu_1       uuid := 'bbbbbbbb-0007-0007-0007-000000000001';
  b_ccsu_2       uuid := 'bbbbbbbb-0007-0007-0007-000000000002';
  b_shu_1        uuid := 'bbbbbbbb-0008-0008-0008-000000000001';
  b_shu_2        uuid := 'bbbbbbbb-0008-0008-0008-000000000002';
  b_towson_1     uuid := 'bbbbbbbb-0009-0009-0009-000000000001';
  b_towson_2     uuid := 'bbbbbbbb-0009-0009-0009-000000000002';
  b_notredame_1  uuid := 'bbbbbbbb-0010-0010-0010-000000000001';
  b_notredame_2  uuid := 'bbbbbbbb-0010-0010-0010-000000000002';
  b_jmu_1        uuid := 'bbbbbbbb-0011-0011-0011-000000000001';
  b_jmu_2        uuid := 'bbbbbbbb-0011-0011-0011-000000000002';
  b_bridgewater_1 uuid := 'bbbbbbbb-0012-0012-0012-000000000001';
  b_bridgewater_2 uuid := 'bbbbbbbb-0012-0012-0012-000000000002';
BEGIN

-- ── Users (2 per school) ─────────────────────────────────────
INSERT INTO public.users (id, full_name, email, phone, school, deposit_paid)
VALUES
  (u_stonehill_1,  'Emma Richardson',   'demo.stonehill1@notimestorage.demo',   '+1 (508) 555-0101', 'Stonehill College', true),
  (u_stonehill_2,  'Jake Morrison',     'demo.stonehill2@notimestorage.demo',   '+1 (508) 555-0102', 'Stonehill College', true),
  (u_unh_1,       'Marcus Johnson',    'demo.unh1@notimestorage.demo',         '+1 (203) 555-0141', 'University of New Haven', true),
  (u_unh_2,       'Sofia Martinez',    'demo.unh2@notimestorage.demo',         '+1 (203) 555-0142', 'University of New Haven', true),
  (u_dayton_1,    'Jordan Miller',     'demo.dayton1@notimestorage.demo',      '+1 (937) 555-0151', 'University of Dayton', true),
  (u_dayton_2,    'Taylor Davis',      'demo.dayton2@notimestorage.demo',      '+1 (937) 555-0152', 'University of Dayton', true),
  (u_umass_1,     'Alex Chen',         'demo.umass1@notimestorage.demo',       '+1 (413) 555-0161', 'University of Massachusetts', true),
  (u_umass_2,     'Jamie Park',        'demo.umass2@notimestorage.demo',       '+1 (413) 555-0162', 'University of Massachusetts', true),
  (u_brevard_1,   'Morgan Walsh',      'demo.brevard1@notimestorage.demo',     '+1 (828) 555-0171', 'Brevard College', true),
  (u_brevard_2,   'Casey Rodriguez',   'demo.brevard2@notimestorage.demo',     '+1 (828) 555-0172', 'Brevard College', true),
  (u_gordon_1,    'Riley O''Brien',    'demo.gordon1@notimestorage.demo',      '+1 (978) 555-0181', 'Gordon College', true),
  (u_gordon_2,    'Quinn Thompson',     'demo.gordon2@notimestorage.demo',      '+1 (978) 555-0182', 'Gordon College', true),
  (u_ccsu_1,      'Drew Sullivan',     'demo.ccsu1@notimestorage.demo',        '+1 (860) 555-0191', 'Central Connecticut State University', true),
  (u_ccsu_2,      'Sam Williams',      'demo.ccsu2@notimestorage.demo',        '+1 (860) 555-0192', 'Central Connecticut State University', true),
  (u_shu_1,       'Jordan Lee',        'demo.shu1@notimestorage.demo',         '+1 (203) 555-0201', 'Sacred Heart University', true),
  (u_shu_2,       'Avery Clark',        'demo.shu2@notimestorage.demo',         '+1 (203) 555-0202', 'Sacred Heart University', true),
  (u_towson_1,    'Blake Anderson',    'demo.towson1@notimestorage.demo',      '+1 (410) 555-0211', 'Towson University', true),
  (u_towson_2,    'Reese Mitchell',     'demo.towson2@notimestorage.demo',      '+1 (410) 555-0212', 'Towson University', true),
  (u_notredame_1, 'Cameron Hayes',      'demo.notredame1@notimestorage.demo',   '+1 (574) 555-0221', 'University of Notre Dame', true),
  (u_notredame_2, 'Parker Brooks',      'demo.notredame2@notimestorage.demo',   '+1 (574) 555-0222', 'University of Notre Dame', true),
  (u_jmu_1,       'Morgan Reed',        'demo.jmu1@notimestorage.demo',         '+1 (540) 555-0231', 'James Madison University', true),
  (u_jmu_2,       'Alex Turner',       'demo.jmu2@notimestorage.demo',         '+1 (540) 555-0232', 'James Madison University', true),
  (u_bridgewater_1, 'Jordan Kim',       'demo.bridgewater1@notimestorage.demo',  '+1 (508) 555-0241', 'Bridgewater State University', true),
  (u_bridgewater_2, 'Taylor Nguyen',    'demo.bridgewater2@notimestorage.demo', '+1 (508) 555-0242', 'Bridgewater State University', true)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  school = EXCLUDED.school,
  deposit_paid = EXCLUDED.deposit_paid;

-- ── Bookings (2 per school, move-out in window, move-in = move-out + 90 days) ──
-- Stonehill (window: 2026-05-04 to 2026-05-09) — SAME DORM, 5-min interval (09:00, 09:05)
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, move_in_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_stonehill_1, u_stonehill_1, 'Stonehill College', 'confirmed', 'paid', 2, 3, 110.00, 330.00, '2026-05-05', '2026-08-03', '09:00', '09:00', 'Boland Hall', true, false, now(), now())
ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id, school=EXCLUDED.school, status=EXCLUDED.status, payment_status=EXCLUDED.payment_status, box_quantity=EXCLUDED.box_quantity, storage_months=EXCLUDED.storage_months, total_monthly_rate=EXCLUDED.total_monthly_rate, total_price=EXCLUDED.total_price, move_out_date=EXCLUDED.move_out_date, move_in_date=EXCLUDED.move_in_date, move_out_time_slot=EXCLUDED.move_out_time_slot, move_in_time_slot=EXCLUDED.move_in_time_slot, dorm=EXCLUDED.dorm, elevator_available=EXCLUDED.elevator_available, stairs_required=EXCLUDED.stairs_required, updated_at=EXCLUDED.updated_at;
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, move_in_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_stonehill_2, u_stonehill_2, 'Stonehill College', 'confirmed', 'paid', 3, 3, 165.00, 495.00, '2026-05-05', '2026-08-03', '09:05', '09:05', 'Boland Hall', true, false, now(), now())
ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id, school=EXCLUDED.school, status=EXCLUDED.status, payment_status=EXCLUDED.payment_status, box_quantity=EXCLUDED.box_quantity, storage_months=EXCLUDED.storage_months, total_monthly_rate=EXCLUDED.total_monthly_rate, total_price=EXCLUDED.total_price, move_out_date=EXCLUDED.move_out_date, move_in_date=EXCLUDED.move_in_date, move_out_time_slot=EXCLUDED.move_out_time_slot, move_in_time_slot=EXCLUDED.move_in_time_slot, dorm=EXCLUDED.dorm, elevator_available=EXCLUDED.elevator_available, stairs_required=EXCLUDED.stairs_required, updated_at=EXCLUDED.updated_at;

-- UNH (window: 2026-05-06 to 2026-05-13) — different dorms
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, move_in_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_unh_1, u_unh_1, 'University of New Haven', 'confirmed', 'paid', 2, 3, 110.00, 330.00, '2026-05-07', '2026-08-05', '09:00', '09:00', 'Bergami Hall', false, true, now(), now())
ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id, school=EXCLUDED.school, status=EXCLUDED.status, payment_status=EXCLUDED.payment_status, box_quantity=EXCLUDED.box_quantity, storage_months=EXCLUDED.storage_months, total_monthly_rate=EXCLUDED.total_monthly_rate, total_price=EXCLUDED.total_price, move_out_date=EXCLUDED.move_out_date, move_in_date=EXCLUDED.move_in_date, move_out_time_slot=EXCLUDED.move_out_time_slot, move_in_time_slot=EXCLUDED.move_in_time_slot, dorm=EXCLUDED.dorm, elevator_available=EXCLUDED.elevator_available, stairs_required=EXCLUDED.stairs_required, updated_at=EXCLUDED.updated_at;
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, move_in_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_unh_2, u_unh_2, 'University of New Haven', 'confirmed', 'paid', 3, 3, 165.00, 495.00, '2026-05-08', '2026-08-06', '10:00', '10:00', 'Celentano Hall', true, false, now(), now())
ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id, school=EXCLUDED.school, status=EXCLUDED.status, payment_status=EXCLUDED.payment_status, box_quantity=EXCLUDED.box_quantity, storage_months=EXCLUDED.storage_months, total_monthly_rate=EXCLUDED.total_monthly_rate, total_price=EXCLUDED.total_price, move_out_date=EXCLUDED.move_out_date, move_in_date=EXCLUDED.move_in_date, move_out_time_slot=EXCLUDED.move_out_time_slot, move_in_time_slot=EXCLUDED.move_in_time_slot, dorm=EXCLUDED.dorm, elevator_available=EXCLUDED.elevator_available, stairs_required=EXCLUDED.stairs_required, updated_at=EXCLUDED.updated_at;

-- Dayton (window: 2026-05-04 to 2026-05-09)
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, move_in_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_dayton_1, u_dayton_1, 'University of Dayton', 'confirmed', 'paid', 4, 3, 240.00, 720.00, '2026-05-05', '2026-08-03', '09:00', '09:00', 'Marianist Hall', true, false, now(), now())
ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id, school=EXCLUDED.school, status=EXCLUDED.status, payment_status=EXCLUDED.payment_status, box_quantity=EXCLUDED.box_quantity, storage_months=EXCLUDED.storage_months, total_monthly_rate=EXCLUDED.total_monthly_rate, total_price=EXCLUDED.total_price, move_out_date=EXCLUDED.move_out_date, move_in_date=EXCLUDED.move_in_date, move_out_time_slot=EXCLUDED.move_out_time_slot, move_in_time_slot=EXCLUDED.move_in_time_slot, dorm=EXCLUDED.dorm, elevator_available=EXCLUDED.elevator_available, stairs_required=EXCLUDED.stairs_required, updated_at=EXCLUDED.updated_at;
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, move_in_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_dayton_2, u_dayton_2, 'University of Dayton', 'confirmed', 'paid', 2, 3, 110.00, 330.00, '2026-05-06', '2026-08-04', '10:00', '10:00', 'Marycrest Complex', true, false, now(), now())
ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id, school=EXCLUDED.school, status=EXCLUDED.status, payment_status=EXCLUDED.payment_status, box_quantity=EXCLUDED.box_quantity, storage_months=EXCLUDED.storage_months, total_monthly_rate=EXCLUDED.total_monthly_rate, total_price=EXCLUDED.total_price, move_out_date=EXCLUDED.move_out_date, move_in_date=EXCLUDED.move_in_date, move_out_time_slot=EXCLUDED.move_out_time_slot, move_in_time_slot=EXCLUDED.move_in_time_slot, dorm=EXCLUDED.dorm, elevator_available=EXCLUDED.elevator_available, stairs_required=EXCLUDED.stairs_required, updated_at=EXCLUDED.updated_at;

-- UMass (window: 2026-05-08 to 2026-05-16)
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, move_in_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_umass_1, u_umass_1, 'University of Massachusetts', 'pending', 'unpaid', 1, 3, 80.00, 240.00, '2026-05-10', '2026-08-08', '14:00', '14:00', 'Baker Hall (Central)', true, false, now(), now())
ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id, school=EXCLUDED.school, status=EXCLUDED.status, payment_status=EXCLUDED.payment_status, box_quantity=EXCLUDED.box_quantity, storage_months=EXCLUDED.storage_months, total_monthly_rate=EXCLUDED.total_monthly_rate, total_price=EXCLUDED.total_price, move_out_date=EXCLUDED.move_out_date, move_in_date=EXCLUDED.move_in_date, move_out_time_slot=EXCLUDED.move_out_time_slot, move_in_time_slot=EXCLUDED.move_in_time_slot, dorm=EXCLUDED.dorm, elevator_available=EXCLUDED.elevator_available, stairs_required=EXCLUDED.stairs_required, updated_at=EXCLUDED.updated_at;
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, move_in_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_umass_2, u_umass_2, 'University of Massachusetts', 'confirmed', 'paid', 2, 3, 110.00, 330.00, '2026-05-12', '2026-08-10', '09:00', '09:00', 'Chadbourne Hall (Central)', true, false, now(), now())
ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id, school=EXCLUDED.school, status=EXCLUDED.status, payment_status=EXCLUDED.payment_status, box_quantity=EXCLUDED.box_quantity, storage_months=EXCLUDED.storage_months, total_monthly_rate=EXCLUDED.total_monthly_rate, total_price=EXCLUDED.total_price, move_out_date=EXCLUDED.move_out_date, move_in_date=EXCLUDED.move_in_date, move_out_time_slot=EXCLUDED.move_out_time_slot, move_in_time_slot=EXCLUDED.move_in_time_slot, dorm=EXCLUDED.dorm, elevator_available=EXCLUDED.elevator_available, stairs_required=EXCLUDED.stairs_required, updated_at=EXCLUDED.updated_at;

-- Brevard (window: 2026-05-01 to 2026-05-07)
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, move_in_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_brevard_1, u_brevard_1, 'Brevard College', 'confirmed', 'paid', 2, 3, 110.00, 330.00, '2026-05-02', '2026-07-31', '09:00', '09:00', 'Beam Residence Hall', false, true, now(), now())
ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id, school=EXCLUDED.school, status=EXCLUDED.status, payment_status=EXCLUDED.payment_status, box_quantity=EXCLUDED.box_quantity, storage_months=EXCLUDED.storage_months, total_monthly_rate=EXCLUDED.total_monthly_rate, total_price=EXCLUDED.total_price, move_out_date=EXCLUDED.move_out_date, move_in_date=EXCLUDED.move_in_date, move_out_time_slot=EXCLUDED.move_out_time_slot, move_in_time_slot=EXCLUDED.move_in_time_slot, dorm=EXCLUDED.dorm, elevator_available=EXCLUDED.elevator_available, stairs_required=EXCLUDED.stairs_required, updated_at=EXCLUDED.updated_at;
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, move_in_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_brevard_2, u_brevard_2, 'Brevard College', 'confirmed', 'paid', 1, 3, 80.00, 240.00, '2026-05-04', '2026-08-02', '10:00', '10:00', 'Jones Hall', false, true, now(), now())
ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id, school=EXCLUDED.school, status=EXCLUDED.status, payment_status=EXCLUDED.payment_status, box_quantity=EXCLUDED.box_quantity, storage_months=EXCLUDED.storage_months, total_monthly_rate=EXCLUDED.total_monthly_rate, total_price=EXCLUDED.total_price, move_out_date=EXCLUDED.move_out_date, move_in_date=EXCLUDED.move_in_date, move_out_time_slot=EXCLUDED.move_out_time_slot, move_in_time_slot=EXCLUDED.move_in_time_slot, dorm=EXCLUDED.dorm, elevator_available=EXCLUDED.elevator_available, stairs_required=EXCLUDED.stairs_required, updated_at=EXCLUDED.updated_at;

-- Gordon (window: 2026-05-08 to 2026-05-14)
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, move_in_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_gordon_1, u_gordon_1, 'Gordon College', 'confirmed', 'unpaid', 3, 4, 165.00, 660.00, '2026-05-09', '2026-08-07', '10:00', '10:00', 'Nyland Hall', true, false, now(), now())
ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id, school=EXCLUDED.school, status=EXCLUDED.status, payment_status=EXCLUDED.payment_status, box_quantity=EXCLUDED.box_quantity, storage_months=EXCLUDED.storage_months, total_monthly_rate=EXCLUDED.total_monthly_rate, total_price=EXCLUDED.total_price, move_out_date=EXCLUDED.move_out_date, move_in_date=EXCLUDED.move_in_date, move_out_time_slot=EXCLUDED.move_out_time_slot, move_in_time_slot=EXCLUDED.move_in_time_slot, dorm=EXCLUDED.dorm, elevator_available=EXCLUDED.elevator_available, stairs_required=EXCLUDED.stairs_required, updated_at=EXCLUDED.updated_at;
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, move_in_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_gordon_2, u_gordon_2, 'Gordon College', 'confirmed', 'paid', 2, 3, 110.00, 330.00, '2026-05-11', '2026-08-09', '09:00', '09:00', 'Fulton Hall', true, false, now(), now())
ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id, school=EXCLUDED.school, status=EXCLUDED.status, payment_status=EXCLUDED.payment_status, box_quantity=EXCLUDED.box_quantity, storage_months=EXCLUDED.storage_months, total_monthly_rate=EXCLUDED.total_monthly_rate, total_price=EXCLUDED.total_price, move_out_date=EXCLUDED.move_out_date, move_in_date=EXCLUDED.move_in_date, move_out_time_slot=EXCLUDED.move_out_time_slot, move_in_time_slot=EXCLUDED.move_in_time_slot, dorm=EXCLUDED.dorm, elevator_available=EXCLUDED.elevator_available, stairs_required=EXCLUDED.stairs_required, updated_at=EXCLUDED.updated_at;

-- CCSU (window: 2026-05-11 to 2026-05-18)
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, move_in_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_ccsu_1, u_ccsu_1, 'Central Connecticut State University', 'pending', 'unpaid', 2, 3, 110.00, 330.00, '2026-05-12', '2026-08-10', '08:00', '08:00', 'Mildred Barrows Hall', false, true, now(), now())
ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id, school=EXCLUDED.school, status=EXCLUDED.status, payment_status=EXCLUDED.payment_status, box_quantity=EXCLUDED.box_quantity, storage_months=EXCLUDED.storage_months, total_monthly_rate=EXCLUDED.total_monthly_rate, total_price=EXCLUDED.total_price, move_out_date=EXCLUDED.move_out_date, move_in_date=EXCLUDED.move_in_date, move_out_time_slot=EXCLUDED.move_out_time_slot, move_in_time_slot=EXCLUDED.move_in_time_slot, dorm=EXCLUDED.dorm, elevator_available=EXCLUDED.elevator_available, stairs_required=EXCLUDED.stairs_required, updated_at=EXCLUDED.updated_at;
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, move_in_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_ccsu_2, u_ccsu_2, 'Central Connecticut State University', 'confirmed', 'paid', 3, 3, 165.00, 495.00, '2026-05-14', '2026-08-12', '10:00', '10:00', 'Catharine Beecher Hall', false, true, now(), now())
ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id, school=EXCLUDED.school, status=EXCLUDED.status, payment_status=EXCLUDED.payment_status, box_quantity=EXCLUDED.box_quantity, storage_months=EXCLUDED.storage_months, total_monthly_rate=EXCLUDED.total_monthly_rate, total_price=EXCLUDED.total_price, move_out_date=EXCLUDED.move_out_date, move_in_date=EXCLUDED.move_in_date, move_out_time_slot=EXCLUDED.move_out_time_slot, move_in_time_slot=EXCLUDED.move_in_time_slot, dorm=EXCLUDED.dorm, elevator_available=EXCLUDED.elevator_available, stairs_required=EXCLUDED.stairs_required, updated_at=EXCLUDED.updated_at;

-- Sacred Heart (window: 2026-04-28 to 2026-05-05)
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, move_in_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_shu_1, u_shu_1, 'Sacred Heart University', 'confirmed', 'paid', 1, 3, 80.00, 240.00, '2026-04-30', '2026-07-29', '12:00', '12:00', 'Elizabeth Ann Seton Hall', true, false, now(), now())
ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id, school=EXCLUDED.school, status=EXCLUDED.status, payment_status=EXCLUDED.payment_status, box_quantity=EXCLUDED.box_quantity, storage_months=EXCLUDED.storage_months, total_monthly_rate=EXCLUDED.total_monthly_rate, total_price=EXCLUDED.total_price, move_out_date=EXCLUDED.move_out_date, move_in_date=EXCLUDED.move_in_date, move_out_time_slot=EXCLUDED.move_out_time_slot, move_in_time_slot=EXCLUDED.move_in_time_slot, dorm=EXCLUDED.dorm, elevator_available=EXCLUDED.elevator_available, stairs_required=EXCLUDED.stairs_required, updated_at=EXCLUDED.updated_at;
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, move_in_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_shu_2, u_shu_2, 'Sacred Heart University', 'confirmed', 'paid', 2, 3, 110.00, 330.00, '2026-05-02', '2026-07-31', '09:00', '09:00', 'Thomas Merton Hall', true, false, now(), now())
ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id, school=EXCLUDED.school, status=EXCLUDED.status, payment_status=EXCLUDED.payment_status, box_quantity=EXCLUDED.box_quantity, storage_months=EXCLUDED.storage_months, total_monthly_rate=EXCLUDED.total_monthly_rate, total_price=EXCLUDED.total_price, move_out_date=EXCLUDED.move_out_date, move_in_date=EXCLUDED.move_in_date, move_out_time_slot=EXCLUDED.move_out_time_slot, move_in_time_slot=EXCLUDED.move_in_time_slot, dorm=EXCLUDED.dorm, elevator_available=EXCLUDED.elevator_available, stairs_required=EXCLUDED.stairs_required, updated_at=EXCLUDED.updated_at;

-- Towson (window: 2026-05-12 to 2026-05-20)
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, move_in_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_towson_1, u_towson_1, 'Towson University', 'confirmed', 'paid', 4, 3, 240.00, 720.00, '2026-05-13', '2026-08-11', '13:00', '13:00', 'Millennium Hall', true, false, now(), now())
ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id, school=EXCLUDED.school, status=EXCLUDED.status, payment_status=EXCLUDED.payment_status, box_quantity=EXCLUDED.box_quantity, storage_months=EXCLUDED.storage_months, total_monthly_rate=EXCLUDED.total_monthly_rate, total_price=EXCLUDED.total_price, move_out_date=EXCLUDED.move_out_date, move_in_date=EXCLUDED.move_in_date, move_out_time_slot=EXCLUDED.move_out_time_slot, move_in_time_slot=EXCLUDED.move_in_time_slot, dorm=EXCLUDED.dorm, elevator_available=EXCLUDED.elevator_available, stairs_required=EXCLUDED.stairs_required, updated_at=EXCLUDED.updated_at;
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, move_in_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_towson_2, u_towson_2, 'Towson University', 'confirmed', 'paid', 2, 3, 110.00, 330.00, '2026-05-15', '2026-08-13', '09:00', '09:00', 'Barton House', true, false, now(), now())
ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id, school=EXCLUDED.school, status=EXCLUDED.status, payment_status=EXCLUDED.payment_status, box_quantity=EXCLUDED.box_quantity, storage_months=EXCLUDED.storage_months, total_monthly_rate=EXCLUDED.total_monthly_rate, total_price=EXCLUDED.total_price, move_out_date=EXCLUDED.move_out_date, move_in_date=EXCLUDED.move_in_date, move_out_time_slot=EXCLUDED.move_out_time_slot, move_in_time_slot=EXCLUDED.move_in_time_slot, dorm=EXCLUDED.dorm, elevator_available=EXCLUDED.elevator_available, stairs_required=EXCLUDED.stairs_required, updated_at=EXCLUDED.updated_at;

-- Notre Dame (window: 2026-04-30 to 2026-05-08)
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, move_in_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_notredame_1, u_notredame_1, 'University of Notre Dame', 'pending', 'unpaid', 2, 3, 110.00, 330.00, '2026-05-02', '2026-07-31', '09:00', '09:00', 'Alumni Hall', true, false, now(), now())
ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id, school=EXCLUDED.school, status=EXCLUDED.status, payment_status=EXCLUDED.payment_status, box_quantity=EXCLUDED.box_quantity, storage_months=EXCLUDED.storage_months, total_monthly_rate=EXCLUDED.total_monthly_rate, total_price=EXCLUDED.total_price, move_out_date=EXCLUDED.move_out_date, move_in_date=EXCLUDED.move_in_date, move_out_time_slot=EXCLUDED.move_out_time_slot, move_in_time_slot=EXCLUDED.move_in_time_slot, dorm=EXCLUDED.dorm, elevator_available=EXCLUDED.elevator_available, stairs_required=EXCLUDED.stairs_required, updated_at=EXCLUDED.updated_at;
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, move_in_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_notredame_2, u_notredame_2, 'University of Notre Dame', 'confirmed', 'paid', 3, 3, 165.00, 495.00, '2026-05-05', '2026-08-03', '10:00', '10:00', 'Dillon Hall', true, false, now(), now())
ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id, school=EXCLUDED.school, status=EXCLUDED.status, payment_status=EXCLUDED.payment_status, box_quantity=EXCLUDED.box_quantity, storage_months=EXCLUDED.storage_months, total_monthly_rate=EXCLUDED.total_monthly_rate, total_price=EXCLUDED.total_price, move_out_date=EXCLUDED.move_out_date, move_in_date=EXCLUDED.move_in_date, move_out_time_slot=EXCLUDED.move_out_time_slot, move_in_time_slot=EXCLUDED.move_in_time_slot, dorm=EXCLUDED.dorm, elevator_available=EXCLUDED.elevator_available, stairs_required=EXCLUDED.stairs_required, updated_at=EXCLUDED.updated_at;

-- JMU (window: 2026-05-06 to 2026-05-16)
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, move_in_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_jmu_1, u_jmu_1, 'James Madison University', 'confirmed', 'paid', 3, 3, 165.00, 495.00, '2026-05-08', '2026-08-06', '11:00', '11:00', 'Alger Hall', false, true, now(), now())
ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id, school=EXCLUDED.school, status=EXCLUDED.status, payment_status=EXCLUDED.payment_status, box_quantity=EXCLUDED.box_quantity, storage_months=EXCLUDED.storage_months, total_monthly_rate=EXCLUDED.total_monthly_rate, total_price=EXCLUDED.total_price, move_out_date=EXCLUDED.move_out_date, move_in_date=EXCLUDED.move_in_date, move_out_time_slot=EXCLUDED.move_out_time_slot, move_in_time_slot=EXCLUDED.move_in_time_slot, dorm=EXCLUDED.dorm, elevator_available=EXCLUDED.elevator_available, stairs_required=EXCLUDED.stairs_required, updated_at=EXCLUDED.updated_at;
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, move_in_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_jmu_2, u_jmu_2, 'James Madison University', 'confirmed', 'paid', 2, 3, 110.00, 330.00, '2026-05-10', '2026-08-08', '09:00', '09:00', 'Potomac Hall', true, false, now(), now())
ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id, school=EXCLUDED.school, status=EXCLUDED.status, payment_status=EXCLUDED.payment_status, box_quantity=EXCLUDED.box_quantity, storage_months=EXCLUDED.storage_months, total_monthly_rate=EXCLUDED.total_monthly_rate, total_price=EXCLUDED.total_price, move_out_date=EXCLUDED.move_out_date, move_in_date=EXCLUDED.move_in_date, move_out_time_slot=EXCLUDED.move_out_time_slot, move_in_time_slot=EXCLUDED.move_in_time_slot, dorm=EXCLUDED.dorm, elevator_available=EXCLUDED.elevator_available, stairs_required=EXCLUDED.stairs_required, updated_at=EXCLUDED.updated_at;

-- Bridgewater (window: 2026-05-04 to 2026-05-12)
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, move_in_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_bridgewater_1, u_bridgewater_1, 'Bridgewater State University', 'confirmed', 'paid', 2, 3, 110.00, 330.00, '2026-05-05', '2026-08-03', '10:00', '10:00', 'Miles Hall', true, false, now(), now())
ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id, school=EXCLUDED.school, status=EXCLUDED.status, payment_status=EXCLUDED.payment_status, box_quantity=EXCLUDED.box_quantity, storage_months=EXCLUDED.storage_months, total_monthly_rate=EXCLUDED.total_monthly_rate, total_price=EXCLUDED.total_price, move_out_date=EXCLUDED.move_out_date, move_in_date=EXCLUDED.move_in_date, move_out_time_slot=EXCLUDED.move_out_time_slot, move_in_time_slot=EXCLUDED.move_in_time_slot, dorm=EXCLUDED.dorm, elevator_available=EXCLUDED.elevator_available, stairs_required=EXCLUDED.stairs_required, updated_at=EXCLUDED.updated_at;
INSERT INTO public.bookings (id, user_id, school, status, payment_status, box_quantity, storage_months, total_monthly_rate, total_price, move_out_date, move_in_date, move_out_time_slot, move_in_time_slot, dorm, elevator_available, stairs_required, created_at, updated_at)
VALUES (b_bridgewater_2, u_bridgewater_2, 'Bridgewater State University', 'confirmed', 'paid', 1, 3, 80.00, 240.00, '2026-05-08', '2026-08-06', '09:00', '09:00', 'DiNardo Hall', true, false, now(), now())
ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id, school=EXCLUDED.school, status=EXCLUDED.status, payment_status=EXCLUDED.payment_status, box_quantity=EXCLUDED.box_quantity, storage_months=EXCLUDED.storage_months, total_monthly_rate=EXCLUDED.total_monthly_rate, total_price=EXCLUDED.total_price, move_out_date=EXCLUDED.move_out_date, move_in_date=EXCLUDED.move_in_date, move_out_time_slot=EXCLUDED.move_out_time_slot, move_in_time_slot=EXCLUDED.move_in_time_slot, dorm=EXCLUDED.dorm, elevator_available=EXCLUDED.elevator_available, stairs_required=EXCLUDED.stairs_required, updated_at=EXCLUDED.updated_at;

-- ── Booking items (ensure each booking has items) ─────────────
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_stonehill_1, 'box', 'box', 2, 55.00, 110.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_stonehill_1);
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_stonehill_2, 'box', 'box', 3, 55.00, 165.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_stonehill_2);
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_unh_1, 'box', 'box', 2, 55.00, 110.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_unh_1);
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_unh_2, 'box', 'box', 3, 55.00, 165.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_unh_2);
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_dayton_1, 'box', 'box', 4, 60.00, 240.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_dayton_1);
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_dayton_2, 'box', 'box', 2, 55.00, 110.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_dayton_2);
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_umass_1, 'box', 'box', 1, 80.00, 80.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_umass_1);
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_umass_2, 'box', 'box', 2, 55.00, 110.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_umass_2);
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_brevard_1, 'box', 'box', 2, 55.00, 110.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_brevard_1);
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_brevard_2, 'box', 'box', 1, 80.00, 80.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_brevard_2);
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_gordon_1, 'box', 'box', 3, 55.00, 165.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_gordon_1);
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_gordon_2, 'box', 'box', 2, 55.00, 110.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_gordon_2);
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_ccsu_1, 'box', 'box', 2, 55.00, 110.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_ccsu_1);
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_ccsu_2, 'box', 'box', 3, 55.00, 165.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_ccsu_2);
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_shu_1, 'box', 'box', 1, 80.00, 80.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_shu_1);
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_shu_2, 'box', 'box', 2, 55.00, 110.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_shu_2);
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_towson_1, 'box', 'box', 4, 60.00, 240.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_towson_1);
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_towson_2, 'box', 'box', 2, 55.00, 110.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_towson_2);
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_notredame_1, 'box', 'box', 2, 55.00, 110.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_notredame_1);
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_notredame_2, 'box', 'box', 3, 55.00, 165.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_notredame_2);
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_jmu_1, 'box', 'box', 3, 55.00, 165.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_jmu_1);
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_jmu_2, 'box', 'box', 2, 55.00, 110.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_jmu_2);
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_bridgewater_1, 'box', 'box', 2, 55.00, 110.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_bridgewater_1);
INSERT INTO public.booking_items (id, booking_id, item_category, item_type, quantity, monthly_rate, subtotal)
SELECT gen_random_uuid(), b_bridgewater_2, 'box', 'box', 1, 80.00, 80.00 WHERE NOT EXISTS (SELECT 1 FROM public.booking_items WHERE booking_id = b_bridgewater_2);

END $$;
