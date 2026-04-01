-- =============================================================================
-- Manual test user: deposit paid + confirmed paid booking (for local / QA)
-- =============================================================================
-- 1) Supabase → Authentication → Users → Add user
--    - Email + password you choose
--    - Turn ON "Auto Confirm User" (or confirm after creation)
-- 2) Copy that user's UUID from the Users table (id column)
-- 3) Replace :AUTH_USER_ID below with that UUID (keep the quotes)
-- 4) Run this whole script in SQL Editor
--
-- Log in on the app with the same email/password you set in step 1.
-- =============================================================================

DO $$
DECLARE
  auth_uid uuid := 'PASTE-YOUR-AUTH-USERS-ID-HERE'::uuid;
  user_email text;
  profile_id uuid;
  new_booking_id uuid := gen_random_uuid();
  move_out date := (current_date + interval '2 months')::date;
  move_in  date := (current_date + interval '5 months')::date;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = auth_uid LIMIT 1;
  IF user_email IS NULL THEN
    RAISE EXCEPTION 'No auth.users row for id % — create the user in Authentication first', auth_uid;
  END IF;

  -- Profile row must match session: code uses id OR auth_id = auth.uid()
  -- Upsert on email so re-runs / leftover rows do not hit users_email_key (23505).
  INSERT INTO public.users (
    id,
    auth_id,
    full_name,
    email,
    phone,
    school,
    deposit_paid,
    parent_email
  )
  VALUES (
    auth_uid,
    auth_uid,
    '🧪 SQL Test Student',
    user_email,
    '+15550009999',
    'Stonehill College',
    true,
    NULL
  )
  ON CONFLICT (email) DO UPDATE SET
    auth_id = EXCLUDED.auth_id,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    deposit_paid = true,
    school = EXCLUDED.school,
    parent_email = COALESCE(EXCLUDED.parent_email, public.users.parent_email);

  -- Bookings.user_id must equal public.users.id (may differ from auth.users.id if row pre-existed)
  SELECT id INTO profile_id
  FROM public.users
  WHERE auth_id = auth_uid
  LIMIT 1;

  IF profile_id IS NULL THEN
    SELECT id INTO profile_id FROM public.users WHERE id = auth_uid LIMIT 1;
  END IF;

  IF profile_id IS NULL THEN
    RAISE EXCEPTION 'Could not resolve public.users.id after upsert';
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
    dorm,
    elevator_available,
    stairs_required,
    special_instructions,
    created_at,
    updated_at
  ) VALUES (
    new_booking_id,
    profile_id,
    'Stonehill College',
    'confirmed',
    'paid',
    'full',
    3,
    3,
    49.00,
    147.00,
    move_out,
    move_in,
    '10:00',
    'Test Dorm (SQL seed)',
    true,
    false,
    '🧪 SQL TEST BOOKING — safe to delete',
    now(),
    now()
  );

  DELETE FROM public.booking_items WHERE booking_id = new_booking_id;

  INSERT INTO public.booking_items (
    booking_id,
    item_category,
    item_type,
    quantity,
    monthly_rate,
    subtotal
  ) VALUES
    (new_booking_id, 'box', 'box', 3, 15.00, 45.00),
    (new_booking_id, 'item', 'suitcase', 1, 4.00, 4.00);

  RAISE NOTICE 'Done. Booking id: %', new_booking_id;
END $$;
