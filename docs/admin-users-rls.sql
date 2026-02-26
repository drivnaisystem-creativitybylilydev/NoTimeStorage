-- Run this in Supabase SQL Editor so the Admin Customers page can list all users.
-- Without this policy, getCustomers() returns an empty list because RLS blocks reading other users.

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT TO authenticated
  USING (
    auth.uid() IN (SELECT auth_user_id FROM public.admin_users)
  );
