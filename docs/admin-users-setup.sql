-- Create admin_users table for NoTime Storage
-- This table stores which users have admin/owner access (separate from public.users)

CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin_users (for now, we'll use service role in admin queries)
-- Or allow authenticated users to check if they are an admin:
CREATE POLICY "Users can check if they are admin"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_auth_user_id ON public.admin_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);

-- Example: Insert an admin user (replace with your actual email and auth.users.id)
-- First, get the auth.users.id from Supabase Dashboard → Authentication → Users
-- Then run:
-- INSERT INTO public.admin_users (auth_user_id, email, role)
-- VALUES ('<auth-users-uuid-here>', 'your-email@example.com', 'owner');
