-- ============================================================
-- Remove demo / seed accounts and their bookings & payments
-- Run in: Supabase Dashboard → SQL Editor
--
-- Matches public.users that are NOT real customers:
--   • email domain is @notimestorage.demo (all seeded demo inboxes), OR
--   • id uses the seed prefix aaaaaaaa-... (see scripts/seed-all-schools-demo.sql)
--
-- Real addresses (gmail, stonehill.edu, etc.) are never selected.
--
-- Skips profiles whose auth_id is in public.admin_users.
--
-- Deletes in order: booking_items, schedules, payments, bookings;
-- reminder_signups + contact_submissions tied to demo emails;
-- public.users; then auth.users for collected auth_ids (usually empty for demos).
--
-- STEP 1: Run only the PREVIEW queries.
-- STEP 2: Run BEGIN … COMMIT block when satisfied.
-- ============================================================

-- ── PREVIEW: profiles ───────────────────────────────────────

SELECT id AS profile_id, auth_id, full_name, email
FROM public.users u
WHERE (
    u.email ILIKE '%@notimestorage.demo'
    OR u.id::text LIKE 'aaaaaaaa-%'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.admin_users au WHERE au.auth_user_id = u.auth_id
  )
ORDER BY u.email;

-- ── PREVIEW: bookings ───────────────────────────────────────

SELECT b.id AS booking_id, b.user_id, u.email, b.school, b.status
FROM public.bookings b
JOIN public.users u ON u.id = b.user_id
WHERE (
    u.email ILIKE '%@notimestorage.demo'
    OR u.id::text LIKE 'aaaaaaaa-%'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.admin_users au WHERE au.auth_user_id = u.auth_id
  );

-- ════════════════════════════════════════════════════════════
-- STEP 2: DELETE ALL (run as one script)
-- ════════════════════════════════════════════════════════════

BEGIN;

CREATE TEMP TABLE _demo_profile_ids ON COMMIT DROP AS
SELECT u.id AS profile_id
FROM public.users u
WHERE (
    u.email ILIKE '%@notimestorage.demo'
    OR u.id::text LIKE 'aaaaaaaa-%'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.admin_users au WHERE au.auth_user_id = u.auth_id
  );

CREATE TEMP TABLE _demo_booking_ids ON COMMIT DROP AS
SELECT b.id AS booking_id
FROM public.bookings b
WHERE b.user_id IN (SELECT profile_id FROM _demo_profile_ids);

CREATE TEMP TABLE _demo_auth_ids ON COMMIT DROP AS
SELECT DISTINCT u.auth_id AS id
FROM public.users u
WHERE u.id IN (SELECT profile_id FROM _demo_profile_ids)
  AND u.auth_id IS NOT NULL;

DELETE FROM public.booking_items
WHERE booking_id IN (SELECT booking_id FROM _demo_booking_ids);

DELETE FROM public.schedules
WHERE booking_id IN (SELECT booking_id FROM _demo_booking_ids);

DELETE FROM public.payments
WHERE booking_id IN (SELECT booking_id FROM _demo_booking_ids);

DELETE FROM public.bookings
WHERE id IN (SELECT booking_id FROM _demo_booking_ids);

-- Optional list signups / contact rows that used demo addresses (safe patterns only).
DELETE FROM public.reminder_signups
WHERE email ILIKE '%@notimestorage.demo'
   OR lower(split_part(coalesce(email, ''), '@', 1)) LIKE 'demo.%'
   OR lower(split_part(coalesce(email, ''), '@', 1)) = 'demo';

DELETE FROM public.contact_submissions
WHERE email ILIKE '%@notimestorage.demo'
   OR lower(split_part(coalesce(email, ''), '@', 1)) LIKE 'demo.%'
   OR lower(split_part(coalesce(email, ''), '@', 1)) = 'demo';

DELETE FROM public.users
WHERE id IN (SELECT profile_id FROM _demo_profile_ids);

DELETE FROM auth.users a
WHERE a.id IN (SELECT id FROM _demo_auth_ids);

COMMIT;

-- If DELETE FROM auth.users fails with permission denied, delete those users in
-- Dashboard → Authentication → Users (use emails from the preview), or run the
-- same DELETE using the Supabase SQL editor with a role that owns auth schema.
