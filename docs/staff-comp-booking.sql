-- =============================================================================
-- Staff / partner comp booking — $0, does NOT add to revenue analytics
-- =============================================================================
-- Revenue in admin analytics = sum(total_price) only where payment_status = 'paid'.
-- This script creates: payment_status = unpaid, total_price = 0 → $0 revenue.
-- It does NOT insert payments rows (no fake deposit / full pay).
--
-- BEFORE YOU RUN:
-- 1) Read docs/STAFF-COMP-BOOKING.md
-- 2) Edit ONLY the "YOUR CAMPUS & SCHEDULE" section in the DECLARE block below
--    (school, dorm, room, move-out/in dates, times, months, elevator/stairs).
--    Lines in this file are EXAMPLES — replace with your real pickup / delivery plan.
-- 3) Run in Supabase → SQL Editor as a user with permission to INSERT.
--
-- School names must match the app exactly — see lib/schools/config.ts (SCHOOL_NAMES / dorms).
--
-- To undo: delete by booking id (shown in NOTICE) or:
--   DELETE FROM public.schedules WHERE booking_id = '…';
--   DELETE FROM public.booking_items WHERE booking_id = '…';
--   DELETE FROM public.bookings WHERE id = '…';
-- =============================================================================

DO $$
DECLARE
  -- ▓▓▓ YOUR ACCOUNT (already set for Finn) ▓▓▓
  -- public.users.id — must match Table Editor → users → id for this person.
  v_user_id uuid := 'ae5a0ba8-dfbe-46c8-9297-a568585a34e0';

  -- ═══════════════════════════════════════════════════════════════════════════
  -- ►►► YOUR CAMPUS & SCHEDULE — EDIT THESE BEFORE RUNNING ◄◄◄
  -- ═══════════════════════════════════════════════════════════════════════════
  -- Campus + dates below are Finn’s comp template; change if reusing for someone else.
  v_school   text := 'Stonehill College';
  v_dorm     text := 'Corr Hall';
  v_room     text := NULL;  -- e.g. '204' or leave NULL

  v_move_out date := '2026-05-07';
  v_move_in  date := '2026-08-03';
  -- Move-out time (on the app’s 20‑minute grid: last daytime slot before 5 PM).
  v_time_out text := '16:40';
  -- Placeholder ~noon; tweak in Supabase or with owner when move-in is firm (12:00 matches app grid).
  v_time_in  text := '12:00';

  -- Whole storage term length in months (display / metadata only; money fields stay 0).
  v_storage_months int := 3;

  v_elevator boolean := true;   -- building has elevator for pickup/delivery
  v_stairs   boolean := false;  -- stairs-only segment if applicable

  v_booking_id uuid := gen_random_uuid();
BEGIN
  IF v_user_id = '00000000-0000-0000-0000-000000000000'::uuid THEN
    RAISE EXCEPTION 'Edit staff-comp-booking.sql: set v_user_id to your public.users.id';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = v_user_id) THEN
    RAISE EXCEPTION 'public.users.id not found: %', v_user_id;
  END IF;

  INSERT INTO public.bookings (
    id,
    user_id,
    school,
    status,
    payment_status,
    payment_plan,
    box_quantity,
    storage_months,
    total_monthly_rate,
    total_price,
    move_out_date,
    move_in_date,
    move_out_time_slot,
    move_in_time_slot,
    dorm,
    room,
    elevator_available,
    stairs_required,
    special_instructions,
    created_at,
    updated_at
  ) VALUES (
    v_booking_id,
    v_user_id,
    v_school,
    'confirmed',
    'unpaid',
    'full',
    1,
    v_storage_months,
    0,
    0,
    v_move_out,
    v_move_in,
    v_time_out,
    v_time_in,
    v_dorm,
    v_room,
    v_elevator,
    v_stairs,
    'Staff comp — $0 — not revenue. Items: 1 box + 1 medium (e.g. floor lamp).',
    now(),
    now()
  );

  INSERT INTO public.booking_items (
    booking_id,
    item_category,
    item_type,
    quantity,
    monthly_rate,
    subtotal
  ) VALUES
    (v_booking_id, 'box',  'box',             1, 0, 0),
    (v_booking_id, 'item', 'medium_with_box', 1, 0, 0);

  -- schedules.time_slot is `time` in production; cast HH:MM text from bookings.
  INSERT INTO public.schedules (
    booking_id,
    schedule_type,
    date,
    time_slot,
    dorm_name,
    room_number,
    has_elevator,
    has_stairs,
    special_notes,
    status
  ) VALUES
    (
      v_booking_id,
      'move_out',
      v_move_out,
      v_time_out::time,
      v_dorm,
      v_room,
      v_elevator,
      v_stairs,
      'Staff comp — $0 booking',
      'scheduled'
    ),
    (
      v_booking_id,
      'move_in',
      v_move_in,
      v_time_in::time,
      v_dorm,
      v_room,
      v_elevator,
      v_stairs,
      NULL,
      'scheduled'
    );

  RAISE NOTICE 'Created staff comp booking id: %', v_booking_id;
END $$;
