# NoTime Storage — Launch Day Checklist

Work through these sections in order. Do not set `SQUARE_ENV=production` until every step above it is ticked off.

---

## SECTION 1 — Supabase

### 1.1 — Add client's admin account
1. Go to **Supabase Dashboard → Authentication → Users → Add user**
2. Enter the client's email + a strong password → **Create user**
3. Copy the UUID from the new user row
4. Open **SQL Editor** and run:
   ```sql
   INSERT INTO public.admin_users (auth_user_id, email, role)
   VALUES ('<paste-uuid-here>', 'clients-email@example.com', 'owner');
   ```
5. Confirm the row exists: `SELECT * FROM public.admin_users;`

### 1.2 — Remove dev admin account (optional but clean)
- In SQL Editor:
  ```sql
  DELETE FROM public.admin_users WHERE email = 'drivn.ai.system@gmail.com';
  ```
- Then delete the auth user from **Authentication → Users**

### 1.3 — Set production Site URL
- Go to **Supabase → Authentication → URL Configuration**
- **Site URL** → set to `https://notimestorage.co`
- **Redirect URLs** → add:
  - `https://notimestorage.co`
  - `https://notimestorage.co/**`
- Save

---

## SECTION 2 — Resend (email)

### 2.1 — Verify sending domain
- Go to [resend.com](https://resend.com) → **Domains**
- Confirm `notimestorage.co` is **Verified** (green checkmark)
- If not: Add the domain, copy the DNS records, add them to your domain registrar, then click **Verify**
- This ensures emails don't land in spam and come from `noreply@notimestorage.co`

### 2.2 — Confirm sending address matches
- In Resend → Domains, make sure `noreply@notimestorage.co` is an allowed sender for the verified domain

### 2.3 — Test an email
- Trigger any booking action locally (sandbox) and confirm an email arrives at the admin address
- Check Resend → **Logs** to see delivery status

---

## SECTION 3 — Square

### 3.1 — Confirm production Location ID is Active
- Go to [developer.squareup.com](https://developer.squareup.com) → your app → **Production** → **Locations**
- Confirm your location shows as **Active**
- If inactive: activate it from the Square **Seller Dashboard** (not Developer Dashboard)
- Confirm the Location ID matches `SQUARE_LOCATION_ID=LYKH0VGXG3J8T` in your Vercel env

### 3.2 — Verify production credentials are correct
- `SQUARE_APPLICATION_ID` must start with `sq0idp-`
- `SQUARE_ACCESS_TOKEN` must start with `EAAAl` (never in any `NEXT_PUBLIC_` variable)
- `SQUARE_LOCATION_ID` must match the **Active** location from step 3.1
- These are already in `.env.local` — double-check they match what's in Vercel

### 3.3 — Verify Apple Pay domain
- Go to Square Developer Dashboard → your app → **Apple Pay** → **Web**
- Add `notimestorage.co` as a verified domain and click **Verify**
- Confirm the domain association file is reachable:
  `https://notimestorage.co/.well-known/apple-developer-merchantid-domain-association`
- Test Apple Pay on an iPhone in Safari after verification

---

## SECTION 4 — Vercel Environment Variables

Set all of the following in **Vercel → Project → Settings → Environment Variables** for the **Production** environment only.

| Variable | Value |
|---|---|
| `SQUARE_ENV` | `production` |
| `SQUARE_ACCESS_TOKEN` | *(your production token — starts with EAAAl)* |
| `SQUARE_APPLICATION_ID` | *(starts with sq0idp-)* |
| `SQUARE_LOCATION_ID` | `LYKH0VGXG3J8T` |
| `BOOKING_NOTIFY_EMAIL` | `admin@notimestorage.co` *(new-booking alerts)* |
| `CRON_SECRET` | `79a5c778163f6dd5e988aa77cf48dc0d45e831e87d3b26151a55193e983a4ac8` |
| `NEXT_PUBLIC_SITE_URL` | `https://notimestorage.co` |
| `NEXT_PUBLIC_APP_URL` | `https://notimestorage.co` |
| `NEXT_PUBLIC_SUPABASE_URL` | *(already set)* |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(already set)* |
| `SUPABASE_SERVICE_ROLE_KEY` | *(already set — keep server-only, never NEXT_PUBLIC_)* |
| `RESEND_API_KEY` | *(already set)* |

> ⚠️ After adding or changing **any** variable, click **Redeploy** in Vercel → Deployments for the changes to take effect.

> ⚠️ Keep `.env.local` as `SQUARE_ENV=sandbox` forever. Local dev must never touch real payments.

---

## SECTION 5 — Final Checks Before First Real Transaction

### 5.1 — Run full end-to-end in sandbox one last time
Work through this entire flow locally before going live:
- [ ] Sign up as a new student
- [ ] Complete booking form → schedule → payment plan selection
- [ ] Pay $50 deposit (sandbox card: `4111 1111 1111 1111`, any future date, any CVV)
- [ ] Confirm deposit confirmation email arrives
- [ ] Complete checkout → confirm order confirmation email arrives
- [ ] Check admin dashboard → booking appears with correct details
- [ ] Check admin notification email arrived

### 5.2 — Verify no secrets are in the frontend
- Open browser DevTools → Application → check there is no `SQUARE_ACCESS_TOKEN` exposed
- Only `applicationId`, `locationId`, and `isSandbox` are returned by `/api/square-config`

### 5.3 — Check Supabase DB writes after payment
After a sandbox test payment confirm these are correct in Supabase:
- `bookings` table: `status = 'confirmed'` or `payment_status = 'paid'`
- `payments` table: has a row for the test booking with the Square payment ID
- `customers` table: has the test user's record

---

## SECTION 6 — Go Live

1. Set `SQUARE_ENV=production` in Vercel Production environment variables
2. Set `BOOKING_NOTIFY_EMAIL=admin@notimestorage.co` in Vercel (same inbox as public contact mail)
3. **Redeploy** from Vercel → Deployments

---

## SECTION 7 — First Real Money Test

> Do this immediately after going live, before telling anyone the site is open.

1. Make a real booking as a test customer using a real card
2. Pay the **$50 deposit** — confirm it appears in Square Dashboard → Payments
3. Confirm the deposit email arrives at the student email address
4. Confirm the admin notification email arrives at **`admin@notimestorage.co`**
5. Check Supabase: deposit + booking records written correctly
6. **Immediately issue a refund** from Square Dashboard → Payments → find the charge → **Issue Refund**
   - The refund processes immediately on Square's end; it appears on the card in 2–7 business days
7. Complete the rest of the booking flow (schedule, final payment) if deposit test passed

---

## SECTION 8 — Known Issues to Fix Post-Launch

### 8.0 — Parent email not receiving notifications
- Parent email is collected during signup and stored as `parent_email` on the `users` table
- Currently only the deposit confirmation email is sent to the parent (`sendDepositConfirmedUser` passes `parentEmail`)
- **No other emails** (order confirmation, move-in reminder, etc.) are being CC'd to the parent
- **Fix needed:** Audit all `send*.ts` email functions and add `parentEmail` as a CC or additional recipient where appropriate:
  - `sendDepositConfirmedUser` ✅ already sends to parent
  - `sendOrderConfirmedUser` ❌ needs parent CC
  - `sendMoveInReminderUser` ❌ needs parent CC
- Also verify the parent email is being fetched from the DB and passed through in each flow

---

## SECTION 8 — Post-Launch Housekeeping

- [ ] Delete any test bookings and sandbox customer records from Supabase
- [ ] Remove the old dev admin account if not already done (Section 1.2)
- [ ] Confirm client can log into `/admin` with their new credentials
- [ ] Share admin dashboard URL and credentials securely with client
- [ ] Confirm Zoho inbox **`admin@notimestorage.co`** receives booking alerts (`BOOKING_NOTIFY_EMAIL`) and customer contact
- [ ] Monitor Vercel → Functions logs + Resend → Logs for the first 48 hours

---

## Quick Reference — Known Issues from Previous Projects

| Issue | Symptom | Fix |
|---|---|---|
| Sandbox nonce sent to production API | `INVALID_TOKEN` / `source not found` | Both frontend SDK and backend must use same env — controlled by single `SQUARE_ENV` flag ✅ |
| Wrong credentials order | 401 / auth errors | `APPLICATION_ID` starts `sq0idp-`, `ACCESS_TOKEN` starts `EAAAl` |
| Location not active | `LOCATION_NOT_FOUND` | Activate in Square Seller Dashboard, not Developer Dashboard |
| Env var not loaded | Generic 500, "not configured" | Redeploy after every Vercel env change |
| `deposit_paid` not updating | Charge succeeds but user stuck | All DB writes use service role client (already correct ✅) |
| Apple Pay not working on Safari | Payment button missing | Verify domain in Square Developer Dashboard → Apple Pay |
