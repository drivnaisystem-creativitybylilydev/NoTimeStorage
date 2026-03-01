# Booking Flow: Deposit-At-End and Revenue-Safe Options

This doc describes how to move the **$50 deposit** from *before* the booking flow to *after* configuration (Configure → Schedule → **then** Pay deposit + storage). It also outlines alternatives that keep or improve conversion without reducing revenue.

---

## 1. Current Flow (Today)

| Step | URL | Gate | What happens |
|------|-----|------|----------------|
| 1 | `/auth/login` | — | User signs in (or signup). |
| 2 | `/deposit` | Auth | User pays **$50 deposit** via Square. `users.deposit_paid = true`. |
| 3 | `/booking/configure` | Auth + **deposit_paid** | Choose boxes + items. |
| 4 | `/booking/schedule` | Auth + deposit_paid | Dates, dorm, times, elevator/stairs, room, instructions. |
| 5 | `/booking/payment` | Auth + deposit_paid | Review order; **charge storage total only** (deposit already applied). Create booking → charge card → redirect to confirmed. |
| 6 | `/booking/confirmed` | — | Success page. |

**Why it feels inefficient:** Users pay $50 before seeing any configuration. Drop-off is highest at the deposit step; once they’ve done Configure + Schedule, they’re more committed.

**Revenue:** Unchanged by reordering. Same amounts: $50 deposit (later applied to the bill) + storage total.

---

## 2. Target Flow: Configure First, Then Pay (Deposit at End)

**Idea:** Let users go through **Configure → Schedule** without paying the deposit. The **payment step** is where they pay (deposit + storage, or deposit then storage). No revenue change.

### 2.1 High-level user journey

| Step | URL | Gate | What happens |
|------|-----|------|----------------|
| 1 | `/auth/login` | — | Sign in when they want to start (e.g. from homepage “Book storage” → redirect to login, then to configure). |
| 2 | `/booking/configure` | **Auth only** | Choose boxes + items. |
| 3 | `/booking/schedule` | Auth only | Dates, dorm, times, elevator/stairs, room, instructions. |
| 4 | `/booking/payment` | Auth only | **If `deposit_paid`: charge storage only (current behavior). If not: collect deposit + storage here.** Create booking, then charge. |
| 5 | `/booking/confirmed` | — | Success. |

So: **deposit is no longer a gate to enter the booking funnel;** it’s part of the final “Pay” step.

### 2.2 Implementation outline

- **Layout / gates**
  - **`app/booking/layout.tsx`**  
    - Require **auth** for `/booking/configure`, `/booking/schedule`, `/booking/payment`.  
    - **Remove** the redirect to `/deposit` when `!deposit_paid`.  
    - Optional: still redirect to login with `?redirect=/booking/configure` (or current URL) so after login they land back in the flow.
  - **`app/deposit/page.tsx`**  
    - Today: “Already paid → redirect to `/booking/configure`.”  
    - **New:** Keep as-is for users who navigate to “Pay deposit” directly (e.g. from dashboard “Pay deposit to book”). So deposit page stays for “pay early” or “pay only” flows; booking flow no longer forces a visit.

- **Dashboard / CTAs**
  - **Dashboard:** “Book storage” / “Book another” should link to **`/booking/configure`**, not to `/deposit`.  
  - **Deposit banner:** Only show “Pay $50 deposit” when `!deposit_paid`; link to `/deposit` for users who want to pay deposit before configuring.  
  - **Homepage:** “Book storage” → `/auth/login?redirect=/booking/configure` (or signup then configure). No need to send everyone to `/deposit` first.

- **Payment page (`app/booking/payment/page.tsx`)**
  - **Two branches by `deposit_paid`:**
    1. **User already has `deposit_paid`**  
       - Keep current behavior: create booking, charge **storage total only**, show “$50 deposit already applied.”  
       - `createBooking` already inserts a `payments` row for the deposit (pre-paid).
    2. **User does not have `deposit_paid`**  
       - **Option A (recommended): Single combined charge**  
         - Show order summary: “$50 deposit + $X.XX storage = $Y.YY today.”  
         - One Square charge for **5000 + totalPriceCents** (e.g. $50 + storage).  
         - On success:  
           - Call `chargeDepositAndStorage(sourceId, totalCents)` (or equivalent) that:  
             - Creates **one** Square payment for `totalCents`.  
             - Sets `users.deposit_paid = true`.  
             - Creates the booking (same as now).  
             - Records **two** rows in `payments`: one for $50 (deposit), one for storage, both with same or split Square payment reference if needed.  
         - Then redirect to confirmed.  
         - **Revenue:** Same as today (one $50 deposit + storage); one card charge, simpler UX.
       - **Option B: Two charges in sequence**  
         - Step 1: Charge $50 (reuse `chargeDeposit` from `lib/square/deposit.ts`), set `deposit_paid`.  
         - Step 2: Create booking, charge storage (reuse `chargeBookingPayment`).  
         - Two Square charges; same total revenue; more steps and slightly more failure modes (e.g. deposit succeeds, booking charge fails — need clear copy and possibly support flow).

- **`lib/booking/create-booking.ts`**
  - Today it **always** inserts a deposit payment row (assumes deposit was paid earlier).  
  - **If Option A (combined charge):**  
    - Either: createBooking is called **after** the combined charge; then createBooking only inserts the **storage** payment row, and a separate server action (or the same flow) inserts the **deposit** payment row and sets `deposit_paid`.  
    - Or: createBooking accepts a flag like `depositCollectedWithBooking: true` and the caller passes the Square payment id; createBooking inserts both payment rows (deposit + storage) and the caller sets `deposit_paid` before or after.  
  - **If Option B (two charges):**  
    - First call `chargeDeposit` → `deposit_paid = true`.  
    - Then createBooking (unchanged: it still inserts the “deposit already paid” row).  
    - Then charge storage; no change to createBooking’s payment logic for the storage charge.

- **Emails**
  - **Deposit confirmation:** Today sent when user pays on `/deposit`.  
  - **Deposit-at-end:** Send the same “deposit confirmed” email when we charge the combined (or first) payment on the payment page, so the user gets one email that says “deposit + booking confirmed” or two (deposit, then booking) depending on Option A vs B.

- **Edge cases**
  - **Returning user, already has `deposit_paid`:** Payment page behaves exactly as today (storage only).  
  - **User starts configure without account:** Redirect to login with `redirect=/booking/configure` (and preserve plan/query params if needed).  
  - **Abandoned carts:** Optional later: save progress (e.g. in `bookings` with status `draft`) so “Continue your booking” can resume; out of scope here but doesn’t affect revenue.

---

## 3. Revenue-preserving options (no decrease in revenue)

These keep or improve conversion without reducing what you charge.

### 3.1 Single charge at the end (recommended)

- **What:** One payment at the payment step: **$50 deposit + storage total**.  
- **Revenue:** Identical to current ($50 + storage).  
- **Pros:** One click, one transaction; less drop-off; deposit feels like part of the order, not a gate.  
- **Implementation:** As in Option A above (combined charge, then create booking and record two `payments` rows + set `deposit_paid`).

### 3.2 Two charges at the end (deposit then storage)

- **What:** On payment page, first charge $50 (deposit), then create booking and charge storage.  
- **Revenue:** Same.  
- **Pros:** Clear separation for accounting; reuses existing `chargeDeposit` and `chargeBookingPayment`.  
- **Cons:** Two card charges; if the second fails, need a clear “Your deposit is paid; we’ll contact you to complete storage payment” flow.

### 3.3 Keep deposit as a line item, collect only at the end

- **What:** Same as 3.1 or 3.2: deposit is not required to enter Configure/Schedule; it’s just the first (or combined) charge on the payment step.  
- **Revenue:** Unchanged.  
- **Copy:** “You’ll pay your $50 deposit + $X.XX storage today” so the total is explicit and there’s no surprise.

### 3.4 Optional small “reservation” or “commitment” fee (add-on)

- **What:** In addition to the $50 deposit, add a small non-refundable fee (e.g. $5–10) at booking to reduce no-shows.  
- **Revenue:** Slightly higher; not a decrease.  
- **Implementation:** New line item on payment step; one more row in `payments` or a single “booking fee” type. Only add if the client wants it.

### 3.5 Require sign-up before Configure (optional)

- **What:** From homepage “Book storage” → sign up / log in → then Configure. No payment until the end.  
- **Revenue:** No change; you’re not charging earlier or later, just capturing identity before they configure.  
- **Pros:** You get contact info even if they drop off; can do reminder emails or “Finish your booking” later.

### 3.6 “Deposit applied” messaging (no logic change)

- **What:** Keep current flow (deposit first) but improve copy: e.g. “Your $50 deposit will be applied to your first storage bill,” “Pay $50 now, then configure your storage and pay the rest at the end.”  
- **Revenue:** Same.  
- **Pros:** May reduce perceived friction; no code change to payment logic.

---

## 4. Summary

| Change | Revenue | Effort | Notes |
|--------|---------|--------|--------|
| **Deposit at end (configure first)** | Same | Medium | Layout: drop deposit gate for booking; payment page: branch on `deposit_paid`, add combined or two-step charge when not paid. |
| **Single combined charge at end** | Same | Medium | One Square charge (deposit + storage); record two `payments` rows; set `deposit_paid`. Best UX. |
| **Two charges at end** | Same | Low | Reuse existing deposit + booking charge; call both from payment page when `!deposit_paid`. |
| **Reservation fee add-on** | Slight increase | Low | Optional extra line item; client’s choice. |
| **Sign-up before configure** | Same | Low | Redirect to login/signup before configure; preserve `redirect`. |
| **Copy-only “deposit applied”** | Same | None | No code change. |

Recommended path: **Configure first (auth only)** → **Schedule** → **Payment** (if no deposit yet: one combined charge of $50 + storage; if deposit already paid: storage only). Same revenue, better conversion, and deposit remains a client-required commitment that is applied to the bill as today.
