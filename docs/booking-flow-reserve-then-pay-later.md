# Booking Flow: Configure → Deposit to Reserve → Pay Storage Later

This doc describes a **reserve-with-deposit-only** flow: users configure their full order and pay only the **$50 deposit** to reserve their spot; the **full storage payment** is collected later when the admin decides (e.g. when the season opens). It includes automations to notify users when their storage is ready to pay in full.

---

## 1. User journey (high level)

| Step | What happens |
|------|----------------|
| 1 | User signs in (or signs up). |
| 2 | **Configure** – Choose boxes and items. |
| 3 | **Schedule** – Pick move-out/move-in dates, dorm, times, elevator/stairs, room, instructions. |
| 4 | **Reserve** – Review order; pay **$50 deposit only** (no storage charge). Booking is created in a “reserved” state. |
| 5 | **Confirmation** – “You’re reserved. We’ll email you when your storage is ready to pay in full.” |
| 6 | **Later** – Admin opens collection (e.g. “season is open”). Automation sends emails to reserved users: “Your storage is ready — pay in full here.” |
| 7 | **Pay in full** – User clicks link, sees their reserved booking(s) and balance due, pays the storage total. Booking becomes fully paid and confirmed. |

Revenue is unchanged: $50 deposit (applied to the bill) + full storage total, just collected in two steps.

---

## 2. Booking and payment state

### 2.1 Booking status and payment_status

Today: `payment_status` is `'unpaid'` or `'paid'`.

To support “deposit paid, storage unpaid” cleanly, add a third value:

| payment_status   | Meaning |
|------------------|--------|
| `unpaid`         | No payment (e.g. abandoned draft; optional if you always take deposit at reserve). |
| `deposit_paid`   | **$50 deposit received; storage balance due.** User has “reserved” their spot. |
| `paid`           | Full storage paid; booking confirmed. |

- **SQL:** Extend the check constraint on `bookings.payment_status` to allow `'deposit_paid'` (see **Section 7**).
- **Create booking (reserve flow):** Insert booking with `payment_status: 'deposit_paid'` only after the deposit charge succeeds. Insert one row in `payments`: `payment_type: 'deposit'`, `amount: 50`, `status: 'succeeded'`.
- **Pay in full later:** When user pays the storage total, update booking to `payment_status: 'paid'`, `status: 'confirmed'`, and insert `payments` row `payment_type: 'full_payment'` (reuse existing `chargeBookingPayment` behavior).

Alternative (no schema change): keep `unpaid`/`paid` only and infer “deposit paid” by presence of a `payments` row with `payment_type = 'deposit'` and no `full_payment` yet. Admin and automations would query “unpaid bookings that have a deposit payment.” Adding `deposit_paid` is clearer and easier for reporting.

### 2.2 users.deposit_paid

- When a user pays the **deposit only** at reserve, set `users.deposit_paid = true` (same as today) so they can reserve more bookings without paying another deposit (if you allow multiple reserved bookings per user).
- When they “pay in full” for a booking, you do **not** need to change `deposit_paid`; it stays true.

### 2.3 What is stored in the booking

- `total_price` = **storage total** (monthly rate × months), i.e. the amount due when they “pay in full.” The $50 deposit is not subtracted from `total_price` in the DB; it’s applied at display/receipt time.
- So “pay in full” = charge `booking.total_price` (same as current `chargeBookingPayment` semantics).

---

## 3. Reserve flow (Configure → Schedule → Pay deposit only)

### 3.1 No deposit gate before booking

- **Layout** – Allow access to `/booking/configure`, `/booking/schedule`, and the reserve/payment step with **auth only** (no requirement to have paid the deposit beforehand). See `docs/booking-flow-deposit-at-end.md` for layout changes.
- **Reserve step** – After Schedule, user lands on a **“Reserve your spot”** page (or reuse `/booking/payment` with a “deposit only” mode).

### 3.2 Reserve step behavior

- Show order summary (boxes, items, dates, dorm, total storage amount).
- Copy: “Pay $50 deposit now to reserve. Your storage total ($X.XX) will be due when we open payments for the season.”
- Single Square charge: **$50 only**.
- On success:
  - Create the **booking** with:
    - `status: 'pending'` (or `'reserved'` if you add that status),
    - `payment_status: 'deposit_paid'`.
  - Insert **booking_items**, **schedules** (if you use them), and one **payments** row: `payment_type: 'deposit'`, `amount: 50`, `status: 'succeeded'`.
  - Set **users.deposit_paid = true** (if not already).
  - **Do not** call `chargeBookingPayment`; no storage charge here.
- Redirect to a **“You’re reserved”** page (e.g. `/booking/reserved?id=...`): “We’ll email you when your storage is ready to pay in full.”

### 3.3 Integrations (Calendar, Airtable, Slack) at reserve time

- **Option A:** Run `onBookingCreated` when the booking is created at reserve (deposit only). Calendar/Airtable show “reserved” state; when they pay in full, run `onBookingConfirmed` and update Airtable status to “confirmed.”
- **Option B:** Do not create calendar events until they pay in full; only create Airtable/Slack “New reservation (deposit paid)” for internal visibility. Choose based on client preference.

---

## 4. When does the admin “open” collection?

Admin needs a way to decide when storage is available to pay in full. Options:

### 4.1 Global “season open” flag

- Store a setting, e.g. in a small **settings** table or env-backed config: `storage_payment_open: boolean` (or `season_open_for_payment_at: timestamptz`).
- Admin UI: “Open storage payments for the season” / “Close storage payments.”
- Automations (below) consider only bookings where `payment_status = 'deposit_paid'` and, if you use a date, where move-out is in the open season.

### 4.2 Per-school or per-date

- e.g. “Open for Stonehill College” or “Open for move-out date &gt;= X.” Same idea: a flag or date that automations read to decide who is eligible for “pay in full” emails.

### 4.3 Manual “ready to charge” per booking

- Admin marks individual bookings as “ready to pay” (e.g. a column `ready_for_full_payment: boolean` or status). Automation sends “pay in full” only to those. Gives maximum control, more manual work.

Recommendation: start with **4.1** (global or season-based); add 4.2/4.3 if the client needs per-school or per-booking control.

---

## 5. Automations: inform users their storage is ready to pay in full

### 5.1 Trigger: “Collection opened”

When admin sets “storage payment open” (or equivalent):

1. **One-time “open” email**  
   - Find all bookings with `payment_status = 'deposit_paid'` (and any other filter: school, move-out date, etc.).  
   - For each, get the user (join `users` on `booking.user_id`).  
   - Send one email per user (dedupe if they have multiple reserved bookings):  
     - **Subject:** e.g. “Your NoTime Storage is ready — pay in full”  
     - **Body:** Short message that storage payment is now open; list their reserved booking(s) and balance due; **primary CTA: link to “Pay your storage” page** (e.g. `/booking/pay-remaining` or `/dashboard` with a prominent “Pay storage” section).

2. **Link target** – A page where the user is logged in, sees their reserved booking(s) with `payment_status = 'deposit_paid'`, and can pay the storage total (one card form per booking or one combined flow). Use existing `chargeBookingPayment(sourceId, bookingId, amountCents)` with `amountCents = booking.total_price * 100` (or stored cents).

### 5.2 Optional: scheduled reminder (cron)

- **Cron job** (e.g. daily or weekly):  
  - If “storage payment open” and there are bookings with `payment_status = 'deposit_paid'` that have **not** been sent a reminder in the last N days, send a reminder email: “Reminder: Your storage balance is due. Pay here.”
- Prefer one “open” email first; then reminders only for those who haven’t paid after X days.

### 5.3 Optional: move-out approaching

- For `deposit_paid` bookings whose `move_out_date` is in 7–14 days, send: “Your pickup is coming up. Please pay your storage in full if you haven’t already.” Link to pay page.

### 5.4 Implementation options for “run when admin opens”

- **Admin UI button** – “Open storage payments and notify customers.” Server action that: (1) sets the “payment open” flag, (2) runs the same logic as below (find eligible bookings, send emails).  
- **Background job** – If you use a queue (e.g. Inngest, Trigger.dev, or a cron that reads the flag): when flag becomes true, enqueue “send pay-in-full emails” for all eligible bookings.  
- **Simple:** No queue; admin button triggers a server action that loops over eligible bookings and sends emails (Resend). For small volume this is fine; for large lists, batch or queue.

---

## 6. “Pay in full” user flow

### 6.1 Where they pay

- **Option A – Dedicated page**  
  - Route: e.g. `/booking/pay-remaining` or `/dashboard/pay-storage`.  
  - User must be logged in. Load their bookings with `payment_status = 'deposit_paid'`. Show list with balance due (`total_price`), “Pay” button per booking (or one combined “Pay all”).  
  - On “Pay”: open card form (Square Web Payments SDK), tokenize, call `chargeBookingPayment(token, bookingId, totalPriceCents)`. On success, refresh or redirect; show “Paid” and optionally redirect to `/booking/confirmed?id=...`.

- **Option B – Dashboard**  
  - On dashboard, show a “Reserved – balance due” card per booking with `payment_status = 'deposit_paid'` and a “Pay in full” button that goes to a payment modal or `/booking/pay-remaining?bookingId=...`.

Reuse **`chargeBookingPayment`** in `lib/square/charge-booking.ts`: it already checks `payment_status !== 'paid'`, charges `amountCents`, updates booking to `paid`/`confirmed`, and inserts `full_payment` in `payments`. Pass `booking.total_price` (in cents) as the amount.

### 6.2 Email link

- “Pay in full” emails should link to the same page (e.g. `/booking/pay-remaining` or `/dashboard`). If you use a magic link or one-time token for non-logged-in users, land them on login then redirect to that page after auth.

---

## 7. Schema and SQL

### 7.1 Allow payment_status = 'deposit_paid'

Run in Supabase (adjust if your constraint name differs):

```sql
-- Allow deposit_paid in addition to unpaid and paid
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_payment_status_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_payment_status_check
  CHECK (payment_status IN ('unpaid', 'deposit_paid', 'paid'));
```

### 7.2 Optional: “payment open” setting

If you store the “season open” flag in the DB:

```sql
-- Optional: table for simple key-value settings
CREATE TABLE IF NOT EXISTS public.settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Example: open storage payments
INSERT INTO public.settings (key, value)
VALUES ('storage_payment_open', 'true')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
```

Admin (or a server action) can set `storage_payment_open` to `true`/`false` and automations read it.

---

## 8. Summary table

| Piece | Purpose |
|-------|--------|
| **Configure → Schedule** | Same as today; no deposit required to enter. |
| **Reserve step** | Charge $50 only; create booking with `payment_status: 'deposit_paid'`; insert deposit in `payments`; set `users.deposit_paid = true`. |
| **“You’re reserved” page** | Confirm deposit received; “We’ll email you when storage is ready to pay in full.” |
| **Admin: “Open storage payments”** | Set flag (or date); optionally trigger “notify reserved users” once. |
| **Automation: notify** | When open: find `payment_status = 'deposit_paid'`; send email with link to pay page. Optional: reminders after N days or before move-out. |
| **Pay-in-full page** | List reserved bookings; card form; call `chargeBookingPayment`; then show confirmed / redirect. |
| **chargeBookingPayment** | Already supports “charge this booking’s total”; use as-is for “pay storage” step. |

---

## 9. Implementation complexity and timing

### 9.1 How complicated is this?

**Overall: medium.** The flow is well-scoped and reuses a lot of existing code; the main work is wiring a new path and adding one new page plus admin control.

| Area | Effort | Notes |
|------|--------|--------|
| **Layout + reserve step** | 1–2 days | Remove deposit gate from booking layout; add “reserve” mode to payment step (or new page): charge $50 only, create booking with `payment_status: 'deposit_paid'`, no storage charge. |
| **“You’re reserved” page** | ~0.5 day | New route (e.g. `/booking/reserved`) with confirmation copy and link to dashboard. |
| **Schema** | ~0.5 day | One `ALTER` for `payment_status`; optional `settings` table. |
| **Pay-in-full page** | 1–2 days | New route (e.g. `/booking/pay-remaining`): load user’s `deposit_paid` bookings, show balance, Square form, call `chargeBookingPayment`. Reuse existing charge logic. |
| **Admin “open” + notify** | 1–2 days | Toggle or button in admin to set “storage payment open”; server action that finds eligible bookings and sends “pay in full” emails (Resend). Optional: store “last notified” to avoid duplicate emails. |
| **Dashboard/emails** | ~0.5 day | Dashboard shows reserved bookings with “Pay in full” link; optional email templates for “open” and reminders. |

**Rough total: 3–5 days** for a solid first version (manual “open”, one-time notify, pay-remaining page). Adding scheduled reminders or date-based “open” adds another 0.5–1 day.

### 9.2 Configuring the timing between deposit and full booking fee

There is **no fixed delay** between deposit and full payment. Timing is **fully configurable** and controlled by when the admin decides to collect. Options:

| Approach | How it works | Configuration |
|----------|--------------|---------------|
| **Manual (recommended first)** | Admin clicks “Open storage payments” (or “Notify reserved customers”) when ready (e.g. when season starts, or 2 weeks before first move-out). One-time emails go out; users pay whenever they want after that. | Single button or toggle in admin. No dates to set. |
| **Fixed date** | Admin sets a date (e.g. “Open on May 1”). On that date, a cron or scheduled job (e.g. Vercel Cron, Inngest) sets `storage_payment_open = true` and runs the “notify reserved users” logic. | Admin UI: date picker for “Open storage payments on [date].” Store in `settings` (e.g. `storage_payment_open_at: "2026-05-01"`). Cron runs daily and, when current date ≥ that date, flips the flag and sends emails once. |
| **X days before move-out** | “Open payments N days before each booking’s move-out date.” More complex: either per-booking logic (“notify this user 14 days before their move_out_date”) or a global “open when we’re within 14 days of the earliest move-out.” | Store `open_payments_days_before_move_out: 14`. A daily cron finds bookings with `payment_status = 'deposit_paid'` and `move_out_date - N days <= today`, marks them “ready” (or sets a global open flag when the first such date is reached), and sends emails. |
| **Per-booking** | Admin marks individual bookings “Ready to pay” when they want to collect (e.g. after verifying something). Only those get the “pay in full” email or show up on the pay-remaining page. | Column e.g. `ready_for_full_payment: boolean` on `bookings`; admin row action “Mark ready & notify.” |

**Practical recommendation:** Start with **manual**: one admin button “Open storage payments and notify customers.” That gives full control over timing (e.g. “we open next Monday”). If the client wants hands-off timing later, add **fixed date** (e.g. “Open on May 1”) with a simple cron that runs the same notify logic on that date.

---

## 10. Edge cases

- **User has multiple reserved bookings** – Send one email per user (or one email listing all); pay page shows all with “Pay” per booking or combined.
- **User never pays in full** – Policy decision: cancel after X days, or allow until move-out. Admin can cancel the booking and optionally handle deposit (refund / forfeit per client policy).
- **Deposit already paid elsewhere** – If they previously paid $50 on `/deposit`, `users.deposit_paid` is true; reserve step only creates the booking and does not charge deposit again (or charge deposit only when creating the first “reserved” booking per user).
- **Integrations** – Decide whether Calendar/Airtable/Slack run at reserve (deposit only) or only at full payment; document in `docs/booking-backend.md`.

This flow keeps revenue the same (deposit + full storage), improves conversion by letting users commit with a small step first, and gives the admin control over when to collect the rest, with automations to bring users back to pay in full.
