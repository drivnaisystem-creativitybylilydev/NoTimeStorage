-- Contact form submissions table for NoTime Storage
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query), then run it.

-- Table: stores name, email, subject, optional custom subject, and message
create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  subject_other text,
  message text not null,
  created_at timestamptz not null default now()
);

-- Optional: add a comment so the table is self-documenting
comment on table public.contact_submissions is 'Contact form submissions from the website (Get in Touch section).';

-- RLS: only the backend (service_role) can insert/read; no public access
alter table public.contact_submissions enable row level security;

-- No policies for anon/authenticated: only service_role can access.
-- Your server action will use createAdminClient() (service_role), which bypasses RLS.

-- Optional: index for listing by newest first (e.g. in a future admin contact inbox)
create index if not exists contact_submissions_created_at_idx
  on public.contact_submissions (created_at desc);
