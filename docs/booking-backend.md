# Booking Backend Framework — NoTime Storage

This document describes the booking backend: data model, status flow, and where external integrations (Google Calendar, Slack, Airtable) plug in.

**For implementation:** When building or changing booking or integration code, follow this doc and the project Cursor rule that applies to `lib/booking/**`, `docs/booking*.md`, and `app/booking/**` (join to `users` for integrations; do not duplicate customer data in the DB).

---

## 1. Data Model (Supabase)

### `bookings`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (pk) | Default `gen_random_uuid()` |
| `user_id` | uuid (fk → auth.users) | Owner of the booking |
| `status` | text | See status flow below |
| `move_out_date` | date | Pickup date |
| `move_in_date` | date | Delivery date |
| `move_out_time_slot` | text | e.g. `"14:00"` (20-min slot) |
| `dorm` | text | Residence / dorm name |
| `elevator_available` | boolean | |
| `stairs_required` | boolean | |
| `special_instructions` | text | Optional |
| `school` | text | e.g. `Stonehill College` |
| `monthly_total_cents` | integer | Total monthly price in cents |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `booking_items`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (pk) | |
| `booking_id` | uuid (fk → bookings) | |
| `item_type` | text | `box` \| `small_with_box` \| `small_without_box` \| `medium_with_box` \| `medium_without_box` \| `large` |
| `quantity` | integer | |
| `unit_price_cents` | integer | Per-unit price in cents |
| `created_at` | timestamptz | |

### Status flow
- **draft** – Created but not confirmed (optional; can skip if you only create on confirmation)
- **pending_payment** – Awaiting payment
- **confirmed** – Paid and confirmed; **integrations run on transition to this**
- **cancelled** – Cancelled by user or admin

Integrations (Calendar, Slack, Airtable) should run when a booking becomes **confirmed** (and optionally when created as `pending_payment` for internal visibility).

---

## 2. Integration Hooks

All integrations are triggered from a **single layer** in the app so you have one place to add or change behavior.

### When to call
- **On booking created** – e.g. create draft events, post “New booking” to Slack, add row to Airtable.
- **On booking confirmed** – e.g. confirm calendar events, update Slack/Airtable.

### Where it lives
- **`lib/booking/integrations.ts`**  
  - `onBookingCreated(booking)`  
  - `onBookingConfirmed(booking)`  
  - Each function calls:
    - Google Calendar (create/update events for move-out and move-in)
    - Slack (post to channel)
    - Airtable (create/update record)

**Implemented:** New-booking email (Resend), Google Calendar (two events per booking), and Airtable (one row per booking). Email + Calendar + Airtable run on **booking created**; Airtable status is updated when a booking is **confirmed**. If env vars are missing, that integration is skipped (no errors).

**New-booking email (Resend):** One email is sent to the address in `BOOKING_NOTIFY_EMAIL` whenever a booking is created. Set in `.env.local`:

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | Yes | Your Resend API key (resend.com) |
| `BOOKING_NOTIFY_EMAIL` | Yes | Email that receives new-booking alerts (e.g. your email for testing, or the business owner’s) |
| `RESEND_FROM_EMAIL` | Optional | Sender, e.g. `NoTime Storage <noreply@yourdomain.com>`. Defaults to `onboarding@resend.dev` for testing. |

**Important – Resend sender and recipient:** If you use the default `onboarding@resend.dev` as sender, Resend **only delivers to their test addresses** (e.g. `delivered@resend.dev`), not to your real inbox. So:

- **Quick test:** Set `BOOKING_NOTIFY_EMAIL=delivered@resend.dev` and complete a booking; you’ll see the email in the [Resend dashboard](https://resend.com/emails) (Logs), and the server will log “New-booking email sent to delivered@resend.dev”.
- **Receive at your real email:** Add and verify a domain in Resend, then set `RESEND_FROM_EMAIL=NoTime Storage <noreply@yourdomain.com>`. After that, `BOOKING_NOTIFY_EMAIL` can be your real address.

**Testing the full booking flow (including confirmation email):**

1. In `.env.local`, set `RESEND_API_KEY` (from resend.com) and `BOOKING_NOTIFY_EMAIL`.
   - To **see the email in Resend only:** use `BOOKING_NOTIFY_EMAIL=delivered@resend.dev` (works with default sender).
   - To **receive at your real inbox:** set `RESEND_FROM_EMAIL` to a verified domain (e.g. `NoTime Storage <noreply@yourdomain.com>`) and `BOOKING_NOTIFY_EMAIL` to your email.
2. Run `npm run dev` and keep the terminal open.
3. In the app: **Configure** (choose boxes/items) → **Schedule** (dates, dorm, elevator/stairs) → **Payment** (review and click “Save booking”). Sign in if prompted.
4. After a successful booking you should see:
   - Redirect to dashboard with the new booking.
   - In the **terminal**: `[integrations] New-booking email sent to <address> – Booking ID: <uuid>`.
   - **If using delivered@resend.dev:** open [Resend → Emails](https://resend.com/emails) to see the sent email.
   - **If using a verified domain and your email:** check that inbox (and spam) for “New NoTime Storage booking”.
5. If the email does not arrive, check the terminal for `New-booking email skipped` (missing env) or `New-booking email error` (Resend will explain; common issue: sending from onboarding@resend.dev to a non–test address).

### Cost overview & free alternatives

Use this to pitch: **free options first**, then “premium” (Calendar + Airtable + Slack) if the client wants a smoother workflow.

| Service | Typical cost | Notes |
|--------|---------------|-------|
| **Google Calendar API** | **Free** | Very high quota (e.g. 1M requests/day). For hundreds of bookings/year you stay well under. Google Cloud project is free; no card required for Calendar-only use in many cases. |
| **Airtable** | **Free** up to ~1,000 records/base; then **~$20+/user/mo** (Plus plan) | One row per booking → free tier fits ~1,000 bookings. After that, paid plans. |
| **Slack** | **Free** for basic use | Incoming webhooks (e.g. “New booking” in a channel) work on free tier. Paid if they need more history/features. |

**Free alternatives (pitch these first; slightly less smooth UX):**

| Need | Free option | Tradeoff |
|------|-------------|----------|
| **Calendar** | **Google Sheets** as a “schedule” (one row per booking, columns = date, time, customer, dorm). Or **ICS file**: we generate a downloadable `.ics` per booking; client imports into any calendar (Google/Apple/Outlook). | No automatic events in their main calendar; they either check a Sheet or import files / subscribe to a feed. |
| **Spreadsheet / CRM-style list** | **Google Sheets** (append rows via Google Sheets API; free, same data as Airtable). Or **in-app admin**: simple table in your app that lists bookings (data already in Supabase; no extra tool). | Sheets is familiar but less “app-like” than Airtable. In-app admin is free and keeps everything in one place but requires you to build the UI. |
| **New-booking alerts** | **Email** (e.g. Resend or similar): send one email to the business owner per new booking. You already have Resend in the project; free tier is generous. | Alerts in email instead of Slack; no extra cost. |

**Suggested pitch:**  
“We can start with **no monthly cost**: bookings in the app + optional **email alert** on each new booking, and either a **Google Sheet** that auto-fills or a simple **bookings table inside the app**. If you’d like a dedicated calendar and a nicer dashboard, we can add **Google Calendar** (free) and **Airtable** (free until you pass 1,000 bookings), and optionally **Slack** for instant channel notifications.”

### Google Calendar & Airtable setup

**Environment variables** (add to `.env.local`; do not commit secrets):

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_CALENDAR_CREDENTIALS_JSON` | For Calendar | Full JSON string of the Google service account key (see below) |
| `GOOGLE_CALENDAR_ID` | For Calendar | The calendar ID to add events to (e.g. `primary` or from calendar settings) |
| `AIRTABLE_API_KEY` | For Airtable | Airtable personal access token (create at airtable.com/create/tokens) |
| `AIRTABLE_BASE_ID` | For Airtable | Base ID from your Airtable base URL (`airtable.com/.../BASE_ID/...`) |
| `AIRTABLE_TABLE_NAME` | Optional | Table name (default: `Bookings`) |

**Google Calendar (service account):**

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → create or select a project.
2. Enable the **Google Calendar API** (APIs & Services → Library → search “Calendar API”).
3. Create a **service account** (APIs & Services → Credentials → Create credentials → Service account). Download the JSON key.
4. Share your **Google Calendar** with the service account email (e.g. `xxx@project.iam.gserviceaccount.com`) and give it “Make changes to events”.
5. Put the **entire JSON file contents** into one line and set as `GOOGLE_CALENDAR_CREDENTIALS_JSON` (or store the JSON in a secret manager and pass the string). Set `GOOGLE_CALENDAR_ID` to the target calendar (Calendar settings → Integrate calendar → Calendar ID).

**Airtable:**

1. Create a base and a table (e.g. **Bookings**).
2. Create columns with these **exact names** (so the app can fill them):
   - **Customer Name** (Single line text)
   - **Email** (Email or Single line text)
   - **Phone** (Phone number or Single line text)
   - **Move-out Date** (Single line text)
   - **Move-out Time** (Single line text)
   - **Move-in Date** (Single line text)
   - **Dorm** (Single line text)
   - **Elevator?** (Checkbox)
   - **Stairs?** (Checkbox)
   - **School** (Single line text)
   - **Items Summary** (Long text)
   - **Status** (Single line text)
   - **Booking ID** (Single line text) — used to update status when payment is confirmed
3. Create a [personal access token](https://airtable.com/create/tokens) with `data.records:write` and `schema.bases:read` (or full base access) for that base. Set `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID` (from the base URL).

If you use different column names in Airtable, update the `fields` object in `lib/booking/integrations.ts` to match.

### Sanity check: IDs in the DB
- **Bookings** store `user_id` (uuid); **booking_items** store `booking_id` (uuid). That is correct and keeps data normalized.
- For **Google Calendar, Airtable, Slack** we do **not** need to duplicate names/emails into bookings. When we run an integration we will:
  1. Load the booking (and items) and **join** to `public.users` to get `full_name`, `email`, etc.
  2. Build one rich payload (e.g. "Finn Schueler, drivn.ai.system@gmail.com, Move-out May 15…") and send that to Calendar/Slack/Airtable.
- So: IDs-only in the table editor is fine. Integrations will resolve them at send-time. No schema change needed.

### Full name in `public.users`
- Signup sends `full_name` in `options.data`; the **trigger** that creates the row in `public.users` should set `full_name` from `new.raw_user_meta_data->>'full_name'`. New signups will then have it.
- For **existing users** created before that (e.g. you see "EMPTY" in the table), run this once in the Supabase SQL Editor:

```sql
UPDATE public.users u
SET full_name = COALESCE(a.raw_user_meta_data->>'full_name', '')
FROM auth.users a
WHERE u.auth_id = a.id
  AND (u.full_name IS NULL OR u.full_name = '');
```

---

## 3. App Flow

1. User completes **Configure** → **Schedule** → **Payment (review)**.
2. App calls **createBooking** (Server Action) with:
   - `user_id`, `move_out_date`, `move_in_date`, `move_out_time_slot`, `dorm`, `elevator_available`, `stairs_required`, `special_instructions`, `school`, `monthly_total_cents`, `items[]`.
3. Server Action:
   - Inserts into `bookings` (e.g. `status: 'pending_payment'` or `'confirmed'`).
   - Inserts into `booking_items` for each line item.
   - Calls `onBookingCreated(booking)` (and optionally `onBookingConfirmed` if you confirm immediately).
4. Response: `{ bookingId }` (or error). Frontend redirects to confirmation or dashboard.

Later, when you add payment:
- On successful payment, update booking to `confirmed` and call `onBookingConfirmed(booking)`.

---

## 4. SQL to Create Tables (if not already present)

Run in Supabase SQL Editor if you haven’t created these yet.

```sql
-- Bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('draft', 'pending_payment', 'confirmed', 'cancelled')),
  move_out_date date NOT NULL,
  move_in_date date NOT NULL,
  move_out_time_slot text NOT NULL,
  dorm text NOT NULL,
  elevator_available boolean NOT NULL,
  stairs_required boolean NOT NULL,
  special_instructions text DEFAULT '',
  school text NOT NULL DEFAULT 'Stonehill College',
  monthly_total_cents integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Booking line items
CREATE TABLE IF NOT EXISTS public.booking_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price_cents integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;

-- Users can insert their own bookings
CREATE POLICY "Users can create bookings"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own bookings
CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert booking_items for their own bookings
CREATE POLICY "Users can create booking items"
  ON public.booking_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.bookings WHERE id = booking_id AND user_id = auth.uid())
  );

-- Users can view their own booking items
CREATE POLICY "Users can view own booking items"
  ON public.booking_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.bookings WHERE id = booking_id AND user_id = auth.uid())
  );

-- Optional: admins can manage all (adjust role as needed)
-- CREATE POLICY "Admins can view all bookings" ON public.bookings FOR SELECT TO authenticated USING (...);
```

If the app allows **editing or deleting unpaid bookings** from the dashboard, add UPDATE and DELETE policies. Run in Supabase SQL Editor (if your `bookings.user_id` is `public.users.id`, use this):

```sql
-- Allow users to update/delete their own bookings (match by public.users.id)
CREATE POLICY "Users can update own bookings"
  ON public.bookings FOR UPDATE TO authenticated
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can delete own bookings"
  ON public.bookings FOR DELETE TO authenticated
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Allow users to delete/insert booking_items for their own bookings
CREATE POLICY "Users can delete own booking items"
  ON public.booking_items FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()))
  );
-- If "Users can create booking items" uses user_id = auth.uid(), add this so edit flow can insert items (user_id is public.users.id):
CREATE POLICY "Users can insert booking items for own bookings"
  ON public.booking_items FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()))
  );
```

If your RLS already uses `auth.uid() = user_id` (i.e. `bookings.user_id` is auth id), use `auth.uid() = user_id` in the USING clause instead of the subquery.

---

## 5. Summary

- **Single place to create bookings:** Server Action (or API route) that writes to `bookings` and `booking_items`.
- **Single place for integrations:** `lib/booking/integrations.ts` — implement Google Calendar, Slack, and Airtable there when ready.
- **Status-driven:** Use `confirmed` (and optionally `pending_payment`) to decide when to sync to Calendar, Slack, and Airtable.
