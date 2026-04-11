-- Run once in Supabase SQL Editor (required for deposit reminder cron).
-- Tracks last automated "complete your deposit" email so we don't spam.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS deposit_reminder_last_sent_at timestamptz;

COMMENT ON COLUMN public.users.deposit_reminder_last_sent_at IS
  'Set by /api/cron/deposit-reminders when a nudge email is sent; used to throttle (e.g. every 7 days).';

-- Deposit nudge emails use Supabase Admin magic links → /auth/callback?next=/deposit
-- In Supabase Dashboard → Authentication → URL Configuration, ensure Redirect URLs include:
--   https://notimestorage.co/auth/callback
-- (and http://localhost:3000/auth/callback for local testing if needed)
