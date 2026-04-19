# Stripe weekend implementation playbook

> **Purpose:** One document to follow while shipping Stripe **fast** (dual-rail: Stripe primary + Venmo fallback), without losing payments during rollout.  
> **Audience:** You (Finn) + reference for Jermaine on Dashboard / Vercel tasks only.  
> **Status:** Living doc — check boxes as you go.

---

## Shipped so far (Apr 19 build)

Code is in; flag is **OFF** by default so nothing renders until you flip it.

- DB migrations (Supabase SQL editor, in order): `docs/stripe-migration.sql`, then `docs/stripe-pending-upgrade.sql` (upgrade Checkout pending rows).
- Stripe lib: `lib/stripe/config.ts`, `lib/stripe/server.ts`, `lib/stripe/deposit.ts`, `lib/stripe/booking.ts`.
- Webhook: `app/api/stripe/webhook/route.ts` (Node runtime, raw body, idempotent on `stripe_checkout_session_id`).
- Status API: `app/api/booking/status/route.ts` (auth-gated, used by confirmed page polling).
- New page: `app/deposit/success/page.tsx` + `DepositSuccessPoller.tsx`.
- Rewrites: `app/deposit/DepositForm.tsx`, `app/booking/payment/page.tsx`, `app/booking/confirmed/page.tsx` — Stripe primary + collapsible Venmo, gated by `NEXT_PUBLIC_STRIPE_PAYMENTS_ENABLED`.

**Env vars the code reads:**

| Name | Required | Notes |
| --- | --- | --- |
| `STRIPE_ENV` | yes | `test` or `live`; guards secret key prefix mismatches. |
| `STRIPE_SECRET_KEY` | yes | `sk_test_...` / `sk_live_...` — checked against `STRIPE_ENV`. |
| `STRIPE_WEBHOOK_SECRET` | yes | `whsec_...` from the endpoint or CLI. |
| `NEXT_PUBLIC_STRIPE_PAYMENTS_ENABLED` | yes | `true`/`false` — gates the Stripe UI. |
| `NEXT_PUBLIC_SITE_URL` | yes | Used for absolute `success_url` / `cancel_url`. |

**Still to do before going live**: migrate **monthly payment plan** off Square (see below), admin UI chip + Stripe deep link, QA runbook. Paid booking **item upgrades** use Stripe + `pending_stripe_booking_upgrades` (run `docs/stripe-pending-upgrade.sql`).

### Square dependency — **do not remove yet** (for future agents / models)

Deposit, booking balance, and paid **item upgrades** are on **Stripe** (and Venmo fallback). **`lib/square/charge-upgrade.ts` was deleted** — that path is gone.

**Still on Square until migrated:**

- **`app/actions/monthly-payments.ts`** — `chargeFirstMonthPayment`, invoicing, and related flows use `lib/square/client.ts` (Customers, Cards, Payments, Orders, Invoices).

**Until that file is rewritten for Stripe (Billing, PaymentIntents, or Checkout):**

- Keep the **`square`** npm package in `package.json`.
- Keep **`serverExternalPackages: ["square"]`** (or equivalent) in **`next.config.ts`** if the build requires it.
- Keep any **Square env vars** in Vercel for environments where **monthly plan** is still offered, even if you removed them from `.env.local` for local Stripe-only work.

After monthly plan is fully on Stripe, then: remove `monthly-payments.ts` Square usage, uninstall `square`, strip `next.config` / env, and delete remaining `lib/square/*` if unused.

**Prerequisites (done):** Stripe account verified, bank linked, support chat logged seasonal volume.

---

## Master checklist (print or pin this)

### Stripe Dashboard (Jermaine or you, owner login)

- [ ] **Developers → API keys** — copy **Test** `Secret key` + `Publishable key` (weekend build).
- [ ] **Developers → API keys** — after QA, copy **Live** `Secret key` + `Publishable key` (production only).
- [ ] **Developers → Webhooks → Add endpoint** — Test mode: point to **staging / local via CLI** first; then **Live** endpoint `https://notimestorage.co/api/stripe/webhook` (exact path once route exists).
- [ ] Webhook events subscribed (minimum): `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_failed` (last two for logs / future UX).
- [ ] Copy **Signing secret** (`whsec_...`) for **each** endpoint (test vs live are different).
- [ ] **Settings → Branding** — logo (`/brand/notime-storage-logo.png` uploaded), brand color (coffee/latte hex from site), public business name **NoTime Storage**.
- [ ] **Settings → Public business information** — support URL, support email `notimestorage@gmail.com`, customer-facing descriptor short and clear (e.g. `NOTIME STORAGE`).
- [ ] **Settings → Customer emails** — receipts on; statement descriptor won’t surprise cardholders.
- [ ] **Home / Settings → Account** — no red banners before flipping live charges.

### Vercel (Production vs Preview)

- [ ] Add env vars to **Preview** + **Development**: test `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (test signing secret), `STRIPE_ENV=test` (or `STRIPE_MODE=test` — pick one name and stick to it in code).
- [ ] Add env vars to **Production** only: **live** `STRIPE_SECRET_KEY`, **live** `STRIPE_WEBHOOK_SECRET`, `STRIPE_ENV=live`.
- [ ] Confirm `NEXT_PUBLIC_SITE_URL` = `https://notimestorage.co` (no trailing slash) in Production — **required** for correct Checkout `success_url` / `cancel_url` and emails.
- [ ] Optional: `BOOKING_NOTIFY_EMAIL` unchanged if ops inbox is separate.
- [ ] After first deploy with webhook route: trigger **Send test webhook** from Stripe Dashboard to confirm **200** and signature verification passes.

### Local / repo

- [ ] `.env.local` — test keys + test webhook secret (Stripe CLI `whsec_` when forwarding).
- [ ] Install `stripe` npm package; remove `square` when last Square path is migrated (see cleanup section).
- [ ] Run SQL migration for `payments` columns + idempotency index (see Phase DB below).
- [ ] Implement webhook route with **raw body** verification (Next.js caveat below).
- [ ] Deposit → Stripe Checkout + `/deposit/success` polling UX.
- [ ] Booking payment → Stripe Checkout + confirmed / pending UX.
- [ ] Upgrade path → Stripe + shared “apply paid upgrade” logic.
- [ ] Admin: provider chip + Stripe dashboard deep link for Stripe rows; Venmo unchanged.
- [ ] QA with test cards + CLI webhooks; then **$1 live smoke test + refund** before announcing.

---

## Lessons from the Square integration (avoid repeating)

These come from `lib/square/client.ts` and related code paths.

| Pitfall | What happened / risk | What we do for Stripe |
|--------|------------------------|------------------------|
| **Ambiguous prod vs sandbox** | Square used `SQUARE_ENV !== 'production'` + two token sets — easy to ship wrong combo. | Single source of truth: `STRIPE_ENV=live \| test` (or `STRIPE_MODE`). **Live secret never** in Preview; **test secret never** in Production. |
| **Many moving env vars** | Square needed token, app ID, location ID — one missing → cryptic runtime errors. | Stripe v1 minimum: **`STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`**. Publishable key only if we add Elements later; Checkout redirect does not require it on the client. |
| **PCI / token complexity** | Square deposit expected client nonce + server charge — more surface area. | **Stripe Checkout (hosted page)** — no card data touches our servers; fewer bugs and compliance footguns. |
| **Misleading DB column names** | `charge-upgrade` wrote Square payment IDs into `stripe_transaction_id`. | New columns: `stripe_checkout_session_id` (unique), `stripe_payment_intent_id`; keep legacy `stripe_transaction_id` as optional alias for PI id **or** migrate carefully — document in SQL. |
| **Account freeze (operations)** | Square froze due to verification timing — code was fine. | Jermaine: resolve **all** dashboard prompts within 24h; you already did proactive support — keep screenshots + case reference. |
| **Silent failures** | Payment APIs fail open if errors aren’t surfaced to UI. | Every server action returns `{ ok, error }`; user sees clear message; webhook failures logged (Sentry / console structured log). |

---

## API keys & secrets — exactly what to grab

### In Stripe Dashboard

1. Toggle **Test mode** (top right).
2. **Developers → API keys**
   - **Publishable key** — `pk_test_...` (optional for Checkout-only v1; still copy to env for future / Stripe.js).
   - **Secret key** — `sk_test_...` → **`STRIPE_SECRET_KEY`** in local + Vercel Preview.
3. **Developers → Webhooks** (still in **Test mode**)
   - Add endpoint (for local): use Stripe CLI forwarding (see Testing) **or** a preview deployment URL.
   - After adding, reveal **Signing secret** `whsec_...` → **`STRIPE_WEBHOOK_SECRET`** (test).

Repeat in **Live mode** for production:

- `sk_live_...` → Production **`STRIPE_SECRET_KEY`**
- Live endpoint signing secret → Production **`STRIPE_WEBHOOK_SECRET`**

**Never** commit keys; never paste `sk_live` or `sk_test` into iMessage.

---

## Vercel environment variables (canonical list)

| Variable | Example | Where | Notes |
|----------|---------|--------|--------|
| `STRIPE_SECRET_KEY` | `sk_test_...` / `sk_live_...` | Local, Preview, Prod (respectively) | Server-only |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Local, Preview, Prod | **Different per endpoint and per test/live** |
| `STRIPE_ENV` | `test` or `live` | All | Code picks correct behavior; **Production must be `live` only when ready** |
| `NEXT_PUBLIC_SITE_URL` | `https://notimestorage.co` | Prod | Used to build success/cancel URLs |
| Feature flag (recommended) | `NEXT_PUBLIC_STRIPE_PAYMENTS_ENABLED=true` | Prod when ready | Lets you deploy code dark, then flip on |

Optional later: `STRIPE_PUBLISHABLE_KEY` (`pk_...`) if any client-side Stripe.js.

---

## Code architecture (what gets built)

Order optimized for **something working end-to-end Saturday**, polish Sunday.

### Phase A — Database

Run a migration (Supabase SQL editor or checked-in `docs/stripe-migration.sql`):

- `payments.provider` — `'stripe' | 'venmo' | 'manual'` (default `'manual'` or `'venmo'` for old rows).
- `payments.stripe_checkout_session_id` — text, **unique** where not null (idempotency).
- `payments.stripe_payment_intent_id` — text, nullable.
- Optionally `bookings.payment_provider` — only if you want quick filtering without joining; otherwise provider on `payments` is enough.

### Phase B — Server-only Stripe client

- `lib/stripe/server.ts` — `new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: pinned })` — **import only from Server Actions / Route Handlers / server components that don’t leak to client**.

### Phase C — Checkout session creators (3 flows)

Shared rules for all sessions:

- **Mode:** `payment` (one-time), not `subscription`.
- **Line items:** `price_data` with `currency: 'usd'`, `unit_amount` in cents, `product_data.name` clear (e.g. `NoTime Storage — Deposit`, `NoTime Storage — Booking balance`).
- **`success_url` / `cancel_url`:** absolute URLs from `NEXT_PUBLIC_SITE_URL` + query `session_id={CHECKOUT_SESSION_ID}` where useful.
- **`metadata`:** `{ kind: 'deposit' | 'booking' | 'upgrade', user_id, booking_id?, ... }` — **webhook must trust metadata only after verifying session + amount**.
- **`customer_email`:** prefill from Supabase profile.
- **`billing_address_collection`:** `'required'` (intl + AVS).
- **Payment methods:** Checkout Session `payment_method_types` or rely on defaults for Checkout — use Stripe’s recommended defaults for cards + wallets in US.
- **`payment_intent_data.metadata`:** duplicate `kind` + ids for easier Dashboard search.

**Deposit:** $50.00 → 5000 cents. Metadata: `user_id`, `kind=deposit`.

**Booking balance:** amount from existing server-side total (same source as Venmo today). Create booking row **first** if flow requires `booking_id` (mirror current `createBooking` then pay), then session with `booking_id` in metadata.

**Upgrade:** delta cents from existing upgrade calculation; metadata `kind=upgrade`, `booking_id`.

### Phase D — Webhook `POST /api/stripe/webhook`

**Critical Next.js detail:** Stripe signature verification requires the **raw** request body. In App Router, use:

```ts
export const runtime = 'nodejs'; // edge can be tricky with raw body
// const rawBody = await request.text();
// stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
```

Do **not** parse JSON before `constructEvent`.

Handler logic:

1. Verify signature → 400 if bad.
2. On `checkout.session.completed`:
   - Load session; read `metadata.kind`.
   - **Idempotency:** if `payments` row exists with this `session.id`, return 200.
   - Validate amounts server-side (session.amount_total vs expected).
   - `deposit` → set `users.deposit_paid = true`, insert `payments`, send existing welcome / deposit email if applicable.
   - `booking` → set `bookings.payment_status = 'paid'`, `paid_at`, insert `payments`, send confirmation email.
   - `upgrade` → call generalized apply-upgrade logic (today `apply-paid-upgrade-venmo.ts`).
3. On `expired` / `async_payment_failed` — log + optional email to ops.

### Phase E — UI (dual-rail)

- **Deposit** (`DepositForm.tsx`): Primary **Pay Deposit** → server action → `redirect(session.url)`. Secondary collapsible **Prefer Venmo?** → existing `VenmoBackupSection`.
- **Booking payment** (`app/booking/payment/page.tsx`): Primary **Book my Storage** (Stripe) vs collapsible Venmo (current behavior).
- **Edit booking upgrade:** Primary Stripe, collapsible Venmo.

Feature flag: if `NEXT_PUBLIC_STRIPE_PAYMENTS_ENABLED` is false, hide Stripe button but keep Venmo (safe deploy).

### Phase F — Admin

- Show **Stripe** badge + link to `https://dashboard.stripe.com/{test|live}/payments/{payment_intent}` when provider is stripe.
- Keep **Mark paid** for Venmo/manual.

### Phase G — Square cleanup (after Stripe paths work)

- Remove `lib/square/*`, `square` package, `SQUARE_*` env vars from Vercel + docs that are Square-only.
- Migrate any remaining **monthly payments** Square code paths — grep for `square` before deleting.

---

## Exact checkout UX (customer-facing)

### A. Deposit (`/deposit`)

1. User sees existing NoTime branded page (your site).
2. Primary: **Pay Deposit** → brief loading → redirect to **Stripe Checkout** (Stripe-hosted, logo + colors from Dashboard branding).
3. User pays card / Apple Pay / Google Pay / Link as offered by Stripe.
4. Success → redirect to **`/deposit/success?session_id=...`** (your domain).
5. Success page: show “Confirming payment…” → poll Supabase for `deposit_paid` (or hit a small server action that checks session against Stripe + DB) until true **or** timeout (~10–15s).
6. On success → redirect to **`/booking/configure`** (same as today after deposit).
7. Cancel / back from Stripe → return to `/deposit` with friendly “no charge” message.

**Branding:** Strong first impression = Stripe **Branding** settings + your existing auth card on site **before** redirect. Checkout page itself is Stripe-controlled.

### B. Booking balance (`/booking/payment`)

1. User sees order summary + payment card (existing layout).
2. Primary: **Book my Storage** (Stripe) → create session → redirect Checkout.
3. Success → `/booking/confirmed?session_id=...` (and `bookingId` if not in session metadata recovery path).
4. Confirmed page: same polling pattern for `payment_status === 'paid'`.
5. Venmo path unchanged under disclosure.

### C. Upgrade (`/booking/edit/[id]`)

1. Primary Stripe pay for delta; Venmo disclosure fallback.
2. Success → back to booking detail or success banner + polled upgrade application.

### D. Edge cases (copy on site, not in Stripe)

- **Webhook slow:** “We’re confirming your payment — this usually takes a few seconds. You can leave this page; we’ll email you.”
- **User closes tab after paying:** Webhook still marks paid + email — OK.
- **Double-click pay:** disable button after first click; idempotent webhook prevents double `payments` rows.

---

## Weekend schedule (suggested)

| Block | Focus |
|-------|--------|
| **Sat AM** | SQL migration on dev Supabase branch; `stripe` SDK; webhook skeleton + signature verify + 200 on unknown events. |
| **Sat PM** | Deposit Checkout session + webhook `deposit` branch + `/deposit/success` polling; test with CLI. |
| **Sun AM** | Booking session + webhook + confirmed page; upgrade path. |
| **Sun PM** | Admin chips; feature flag; full test matrix; fix lints. |
| **Before live** | Live keys in Vercel Production; live webhook; `$1` test + refund; enable flag. |

---

## Testing (minimum bar before live)

- [ ] Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- [ ] Test card `4242 4242 4242 4242` — success path deposit + booking.
- [ ] `4000 0025 0000 3155` — 3DS path completes and webhook fires.
- [ ] Decline card — user sees failure; no `paid` in DB.
- [ ] Replay same webhook event — DB unchanged (idempotency).
- [ ] Venmo fallback still creates booking + opens Venmo (no regression).

---

## Production cutover (order matters)

1. Deploy code with **flag off** (Venmo-only) — verify deploy green.
2. Add **live** keys + **live** webhook secret to Vercel Production; register **live** webhook URL in Stripe **Live** mode.
3. Send **Stripe test webhook** from Dashboard → confirm 200 in Vercel logs.
4. Flip **`NEXT_PUBLIC_STRIPE_PAYMENTS_ENABLED=true`** (or server equivalent).
5. Real **$1** Checkout on production → verify webhook → **Refund** from Stripe Dashboard.
6. Tell Jermaine; monitor first 10 real payments closely.

---

## Rollback

- Set `NEXT_PUBLIC_STRIPE_PAYMENTS_ENABLED=false` → instant UI fallback to Venmo-only.
- Do not remove Venmo code paths during first 2–3 weeks of live Stripe.

---

## Reference docs in repo

- [docs/stripe-migration-plan.md](stripe-migration-plan.md) — full phased plan + file list.
- [docs/stripe-support-intro-email.md](stripe-support-intro-email.md) — support outreach (already used).
- [docs/booking-flow-deposit-at-end.md](booking-flow-deposit-at-end.md) — current flow semantics.

---

## Open items to decide during implementation

- Exact **feature flag** name and whether it’s public (`NEXT_PUBLIC_`) vs server-only env.
- Whether booking Stripe session is created **before** or **after** `createBooking` — must match current invariant that Venmo flow uses (preserve idempotency if user double-submits).
- Whether to use Stripe **Customer** reuse in v1 (nice-to-have; not required for Checkout one-off).

When this doc’s checklist is green end-to-end, you’re live-safe for peak season with dual-rail payments.
