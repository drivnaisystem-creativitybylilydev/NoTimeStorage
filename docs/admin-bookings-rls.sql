-- Run this in Supabase SQL Editor so admins can update bookings (e.g. Mark as paid).
-- Without these policies, "Mark as paid" does nothing because RLS blocks the update.
-- Safe to run multiple times: drops existing policies first.

DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
CREATE POLICY "Admins can view all bookings"
  ON public.bookings FOR SELECT TO authenticated
  USING (
    auth.uid() IN (SELECT auth_user_id FROM public.admin_users)
  );

DROP POLICY IF EXISTS "Admins can update bookings" ON public.bookings;
CREATE POLICY "Admins can update bookings"
  ON public.bookings FOR UPDATE TO authenticated
  USING (
    auth.uid() IN (SELECT auth_user_id FROM public.admin_users)
  );

DROP POLICY IF EXISTS "Admins can delete bookings" ON public.bookings;
CREATE POLICY "Admins can delete bookings"
  ON public.bookings FOR DELETE TO authenticated
  USING (
    auth.uid() IN (SELECT auth_user_id FROM public.admin_users)
  );
