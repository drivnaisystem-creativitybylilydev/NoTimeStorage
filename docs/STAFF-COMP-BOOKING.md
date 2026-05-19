# Staff / partner comp booking (Finn template)

Use this when someone gets **free storage** and should appear in **Customers**, **Bookings**, and **Admin calendar**, but **must not add to revenue**.

Analytics revenue only counts bookings with `payment_status = 'paid'`. This flow uses **`unpaid`** and **`total_price = 0`**, and **does not** create `payments` rows.

---

## Step 1 — You already exist as a customer

1. Sign up / log in on the site as yourself (the email you want on file).
2. In **Supabase Dashboard** → **Table Editor** → **`users`**, find your row (search by your email).
3. Copy the **`id`** (UUID). That is `public.users.id` — **not** always the same as `auth.users.id`, but often is when the app links them.

**Pre-filled for Finn:** `docs/staff-comp-booking.sql` already uses `ae5a0ba8-dfbe-46c8-9297-a568585a34e0` (`id` / `auth_id` on your `users` row). If you reuse the script for another person, change `v_user_id`.

If you have **no row** in `users` yet, complete onboarding once (or ask someone to run the profile backfill from `docs/booking-backend.md`).

---

## Step 2 — Deposit flag (optional)

- **Student app / booking flow:** some routes expect `deposit_paid`. If you need that for testing the app as yourself, an admin can mark deposit paid on **Customers** (or set `deposit_paid = true` in SQL). For **admin-only** visibility, you can skip this.
- Comp booking script below does **not** create a fake `$50` payment row.

---

## Step 3 — Edit the SQL template

The script ships with **example** school/dorm/dates (e.g. Stonehill / Boland). **Replace them with your real pickup and delivery plan** before running — the only place to do that is **`docs/staff-comp-booking.sql`**.

1. Open **`docs/staff-comp-booking.sql`** in this repo.
2. In the `DECLARE` block, under **“YOUR CAMPUS & SCHEDULE”**, set:
   - **`v_user_id`** — paste the UUID from Step 1 (pre-filled for Finn).
   - **`v_school`**, **`v_dorm`**, **`v_room`** — campus data (`v_school` must match the app **exactly**; see `lib/schools/config.ts` for `SCHOOL_NAMES` and each school’s dorm list).
   - **`v_move_out`**, **`v_move_in`** — dates (`YYYY-MM-DD`).
   - **`v_time_out`**, **`v_time_in`** — use slots your app already allows (e.g. `10:00`, `14:20`).
   - **`v_storage_months`** — integer for display (e.g. `3` for summer).
   - **`v_elevator`**, **`v_stairs`** — match the building / route for ops.

3. Save the file.

---

## Step 4 — Run in Supabase

1. **Supabase Dashboard** → **SQL Editor** → **New query**.
2. Paste the full contents of **`docs/staff-comp-booking.sql`**.
3. Click **Run**.
4. Check **Messages** for: `Created staff comp booking id: …` (copy UUID if you need it).

If **`schedules` insert** errors (column mismatch in your DB), comment out the whole `INSERT INTO public.schedules` block and run again — **admin calendar still reads `bookings`**, so you will still show there.

---

## Step 5 — Verify

1. **Admin** → **Bookings** — find the row; payment should show **Unpaid**, total **$0.00** (or similar).
2. **Admin** → **Calendar** — pickup/delivery dates should appear.
3. **Admin** → **Analytics** — totals should be unchanged (this booking is not **paid**).

---

## Reverse (delete mistake)

```sql
-- Replace BOOKING_UUID
DELETE FROM public.schedules WHERE booking_id = 'BOOKING_UUID';
DELETE FROM public.booking_items WHERE booking_id = 'BOOKING_UUID';
DELETE FROM public.bookings WHERE id = 'BOOKING_UUID';
```

---

## Google Calendar / Airtable

Those run from app code when **`createBooking`** runs. This script **does not** call them. If Jermaine uses Google Calendar for ops, add the events manually or trigger your usual process outside the app.
