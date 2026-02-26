# Backend schema audit – NoTime Storage

Based on your Supabase `public` schema and current app usage.

---

## Tables the app actually uses

| Table | Purpose | Columns used in code |
|-------|--------|----------------------|
| **users** | Customer profiles; link auth → public | `id`, `auth_id`, `full_name`, `email`, `phone`, `school` |
| **admin_users** | Who can access /admin | `id`, `auth_user_id`, `email`, `role` |
| **bookings** | One row per booking | `id`, `user_id`, `school`, `status`, `payment_status`, `box_quantity`, `storage_months`, `total_monthly_rate`, `total_price`, `notes`, `move_out_date`, `move_in_date`, `move_out_time_slot`, `dorm`, `elevator_available`, `stairs_required`, `created_at`, `updated_at`, and optionally `paid_at` |
| **booking_items** | Line items per booking | `booking_id`, `item_category`, `item_type`, `quantity`, `monthly_rate`, `subtotal` |

All of these are needed. No table in this list is redundant.

---

## Tables kept for future use (not yet used in app)

| Table | Columns | Plan |
|-------|---------|------|
| **dorms** | id, school, name, has_elevator, has_stairs, address, active, created_at | **Keep.** App currently uses a hardcoded `SCHOOL_DORMS` map; later you can switch to reading from this table for dorm options and metadata. |
| **payments** | id, booking_id, amount, payment_type, stripe_transaction_id, status, created_at | **Keep.** For tracking whether users paid (e.g. Stripe integration). Right now payment is only on `bookings.payment_status`; `payments` will support per-transaction history. |

---

## Table not used (optional to drop)

| Table | Columns | Note |
|-------|---------|------|
| **schedules** | id, booking_id, schedule_type, date, time_slot, dorm_id, dorm_name, room_number, has_elevator, has_stairs, special_notes, status, created_at, updated_at | Scheduling lives on `bookings` (move_out_date, move_in_date, move_out_time_slot, dorm, etc.). No code touches `schedules`. Drop if you won't add a "schedule slots" feature; otherwise leave in place. |

---

## Columns that might be unnecessary (optional clean-up)

- **bookings.academic_year** – Not selected or written in the app. Safe to drop if you don’t use it elsewhere.
- **users.role** – Default `'student'`. Not read in the app (admin check uses `admin_users` only). Can keep for future “student vs other” logic or drop.
- **admin_users.created_at / updated_at** – Not used in code. Harmless to keep.

Nothing here is blocking; this is optional tidying.

---

## Why user sync is broken (and what to fix)

**How `users` is set up**

- `users.id` = `gen_random_uuid()` (new UUID per row).
- `users.auth_id` = link to `auth.users.id` (nullable).
- So: one row per person; `auth_id` = that person’s auth user id; `id` = internal UUID used by `bookings.user_id`.

**What the app does**

- Resolves “current user” with:  
  `users` where `id.eq(auth.uid()) OR auth_id.eq(auth.uid())`.
- Creates bookings with `user_id = users.id` (the internal UUID).

So for each auth user there must be exactly one `public.users` row with `auth_id = auth.users.id`, and that row’s `id` is what we use for `bookings.user_id`. If that row is missing or created without `full_name`/`phone`, admin and bookings show wrong/missing data.

**What’s missing today**

1. **Guaranteed row creation** – When someone signs up in Auth, a row in `public.users` is not always created (or not with the right link). That can be by:
   - A trigger on `auth.users` that inserts into `public.users`, or
   - App code (e.g. auth callback) that upserts into `public.users` after signup/verification.
2. **Correct link** – The row must set `auth_id = auth.users.id` and use `users.id` (or keep `id = gen_random_uuid()`) so that:
   - Lookups by `auth_id.eq(auth.uid())` find the row.
   - `bookings.user_id` points at `users.id`.
3. **Synced fields** – `full_name`, `email`, `phone` (and optionally `school`) should be filled from auth (e.g. `raw_user_meta_data` and `email`) so admin and bookings show the right info.

**Concrete fix (for user-sync-todo)**

- Decide **one** place that creates/updates `public.users`:
  - **Option A:** DB trigger on `auth.users` (INSERT/UPDATE) that upserts `public.users` with `auth_id = new.id`, `full_name`, `email`, `phone` from `new.raw_user_meta_data` and `new.email`.
  - **Option B:** App-only: in auth callback (and maybe after signup if possible), upsert `public.users` with `auth_id = session.user.id`, plus `full_name`, `email`, `phone` from session.
- Ensure `bookings.user_id` always stores `public.users.id` (the row with that `auth_id`), and that the app never expects `bookings.user_id = auth.uid()`.
- After that, run a one-time backfill from `auth.users` → `public.users` for existing users (e.g. set `full_name`, `phone`, `email` where missing).

---

## Optional: `paid_at` on bookings

The app and docs assume a `bookings.paid_at` column for “revenue this month” and “mark as paid”. Your schema dump doesn’t show it. If it’s missing, run:

```sql
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;
```

(as in `docs/admin-paid-at-migration.sql`).

---

## Summary

- **Keep (in use):** `users`, `admin_users`, `bookings`, `booking_items` – all needed.
- **Keep (for later):** `dorms` (dorm options/metadata), `payments` (track whether users paid, per-transaction history).
- **Optional to drop:** `schedules` only, if you won't use it.
- **Optional column clean-up:** e.g. `bookings.academic_year`, `users.role` if you don’t need them.
- **User sync fix:** Ensure one `public.users` row per auth user with `auth_id` set and `full_name`/`email`/`phone` synced from auth (trigger or app), then backfill existing users.
