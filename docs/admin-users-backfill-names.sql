-- Run in Supabase SQL Editor to copy name and phone from auth.users into public.users.
-- Do this when Admin Customers or Bookings show email instead of name, or "—" for phone.
--
-- Step 1 (optional): In Supabase go to Authentication → Users → click the user.
--   Under "User Metadata" add:  "full_name": "Your Name"  and  "phone": "555-123-4567"
--   if they're missing. Save.
--
-- Step 2: Run this SQL. It links auth.users to public.users by auth_id or id.

UPDATE public.users u
SET
  full_name = COALESCE(
    NULLIF(TRIM(a.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(COALESCE(a.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(a.raw_user_meta_data->>'last_name', '')), ''),
    u.full_name
  ),
  phone = COALESCE(NULLIF(TRIM(a.raw_user_meta_data->>'phone'), ''), u.phone),
  email = COALESCE(NULLIF(TRIM(a.email), ''), u.email)
FROM auth.users a
WHERE (u.auth_id = a.id OR u.id = a.id);
