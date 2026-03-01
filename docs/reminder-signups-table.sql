-- Reminder / email signups table for NoTime Storage
-- Used for "Get Reminders for Next Semester" and future email marketing.
-- Run in Supabase: SQL Editor → New query → paste → Run.

create table if not exists public.reminder_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'season_reminder',
  school text,
  created_at timestamptz not null default now(),
  constraint reminder_signups_email_source_unique unique (email, source)
);

comment on table public.reminder_signups is 'Email signups for season reminders and email marketing. One row per (email, source).';
comment on column public.reminder_signups.source is 'e.g. season_reminder, newsletter, campaign_xyz';
comment on column public.reminder_signups.school is 'Optional: campus/school for segmentation.';

alter table public.reminder_signups enable row level security;

-- No policies: only backend (service_role) reads/writes. Admin can query in SQL/dashboard.

create index if not exists reminder_signups_created_at_idx
  on public.reminder_signups (created_at desc);

create index if not exists reminder_signups_source_idx
  on public.reminder_signups (source);
