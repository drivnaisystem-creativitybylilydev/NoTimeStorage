# User sync – to fix

**Context:** Users are not being added to all tables they should be (auth schema and public). Customer name/phone often show as email or "—" in Admin because `public.users` is missing or out of sync. We need one clear flow that saves user details everywhere they’re needed.

---

## Schema (confirmed)

- **`public.users`**
  - `id` = `gen_random_uuid()` (internal PK; **this** is what other tables reference).
  - `auth_id` = link to `auth.users.id` (nullable). Look up "current user" by `auth_id.eq(auth.uid())`.
- **`bookings.user_id`** must reference **`public.users.id`** (the internal UUID), not `auth.users.id`.
- **Kept for later:** `dorms`, `payments`. **Optional to drop:** `schedules` only. See **`docs/schema-audit.md`** for details.

---

## Goal

When someone signs up (or a user is created), their details (name, email, phone) are stored in **every place that needs them**:

- **Auth:** `auth.users` (Supabase Auth) – email, and `raw_user_meta_data` (e.g. `full_name`, `phone`) from signup.
- **Public:** `public.users` – same user with `full_name`, `email`, `phone`, and a reliable link to auth (`id` and/or `auth_id`).

Admin (Customers, Bookings) and any other features should read from `public.users` and see correct name/phone without manual SQL.

---

## What to do tomorrow

1. **Map the current flow**
   - Schema is known (see **Schema (confirmed)** above; full audit in `docs/schema-audit.md`).
   - Still to confirm: Where is a user created? (signup → Auth only? Any trigger or app code that writes to `public.users`?) Check Supabase triggers on `auth.users` and the auth callback.

2. **Define the single source of truth**
   - Auth is the source for “who signed up” and their `full_name` / `phone` from signup.
   - Decide: is `public.users` created by a **DB trigger** on `auth.users` (and if so, does it copy `full_name` / `phone`?), or by **app code** (e.g. auth callback, API, server action)?

3. **Implement one reliable path**
   - Option A: **Trigger** – On `auth.users` insert (and maybe update), insert/update `public.users` with `id`/`auth_id`, `full_name`, `email`, `phone` from `auth.users` (and `raw_user_meta_data`). No duplicate logic in the app.
   - Option B: **App-only** – No trigger; after signup and after email verification (auth callback), app upserts into `public.users` with the same fields. Ensure signup sends `full_name` and `phone` in `options.data` and callback runs for every new user.
   - Whichever we choose, ensure **every** place that can create or update a user (signup, callback, “edit profile”, admin) writes to both auth (if applicable) and `public.users` so they stay in sync.

4. **Backfill existing users**
   - Once the flow is fixed, run a one-time script (or SQL) that copies from `auth.users` into `public.users` for existing rows where `full_name`/`phone` are missing, so Admin shows correct data without manual updates.

5. **Admin / Bookings**
   - Keep reading customer name/phone from `public.users` only. No manual SQL; if the sync is correct, the UI will show the right details.

---

## Files to check

- `app/auth/signup/page.tsx` – what we send in `options.data` (full_name, phone).
- `app/auth/callback/route.ts` – current sync from auth → `public.users`.
- `app/dashboard/page.tsx` – backfill on load.
- `lib/admin/actions.ts` – `syncCurrentUserProfile`, `getCustomers`, and how bookings join to users.
- Supabase: **Database → Tables → public.users** (columns, RLS); **Authentication → Users** (user_metadata); any **Triggers** on `auth.users`.

---

## Remember

- **Users must be added (and kept in sync) in all places that need them: auth schema and public.**
- **Details (name, email, phone) must be saved wherever they’re needed** – at minimum in auth metadata and in `public.users`, with one clear path so it’s not “all messed” and we don’t rely on manual SQL for correct names in Admin.
