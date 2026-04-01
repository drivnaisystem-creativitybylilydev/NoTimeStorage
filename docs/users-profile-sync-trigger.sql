-- =============================================================================
-- Optional: auto-create public.users when auth.users is created (belt + suspenders)
-- =============================================================================
-- Run in Supabase → SQL Editor if you want a DB-level guarantee that every new
-- Auth signup gets a profile row even if the Next.js app never runs (tab closed,
-- mobile flake, etc.). The app also upserts via syncUserProfile (service role).
--
-- Safe to re-run: uses CREATE OR REPLACE and DROP TRIGGER IF EXISTS.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    auth_id,
    email,
    full_name,
    phone,
    school,
    parent_email
  )
  VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), ''),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'phone', '')), ''),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'school', '')), ''),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'parent_email', '')), '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.users.email),
    auth_id = EXCLUDED.auth_id,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    phone = COALESCE(EXCLUDED.phone, public.users.phone),
    school = COALESCE(EXCLUDED.school, public.users.school),
    parent_email = COALESCE(EXCLUDED.parent_email, public.users.parent_email);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- If your Postgres errors on EXECUTE FUNCTION, use:
-- EXECUTE PROCEDURE public.handle_new_auth_user();
