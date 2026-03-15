# Production Payment Switch – What Went Wrong Here & What to Check

**Purpose:** Use this when switching another project to production payments. It summarizes debugging from the Creativity by Lily project so the other project’s LLM can avoid the same issues and move faster.

---

## 1. Square credentials (main source of 500s)

### What went wrong here
- **Application ID vs Access Token swapped:** `NEXT_PUBLIC_SQUARE_APPLICATION_ID` had the access token (`sq0atp-...`) and/or `SQUARE_ACCESS_TOKEN` had the application ID (`sq0idp-...`). Square returns 401 / auth errors.
- **Sandbox vs production mismatch:** Production site used sandbox token (or `SQUARE_ENV=production` with a sandbox token). Square rejects with auth errors.
- **Secrets in frontend:** Access token was in a `NEXT_PUBLIC_*` variable. It must never be in the browser.
- **Location ID wrong:** `SQUARE_LOCATION_ID` from a different Square app or sandbox → `LOCATION_NOT_FOUND` or auth issues.

### What to check in the other project
- [ ] **Naming:** `NEXT_PUBLIC_SQUARE_APPLICATION_ID` = value starting with **`sq0idp-`** (Application ID only).  
- [ ] **Naming:** `SQUARE_ACCESS_TOKEN` = value starting with **`sq0atp-`** or **`EAAAl_`** (token only). Never in any `NEXT_PUBLIC_*` var.
- [ ] **Env parity:** `NEXT_PUBLIC_SQUARE_ENV` and `SQUARE_ENV` both **`production`** when using production payments.
- [ ] **Source:** All production values from Square Developer Dashboard → **Production** (not Sandbox): Credentials tab (App ID, Access Token), Locations (Location ID).
- [ ] **Vercel:** All of the above set in **Vercel → Project → Settings → Environment Variables** for **Production**, and **redeploy** after any change.

---

## 2. Env vars only loaded at build/start

### What went wrong here
- Changes to `.env.local` (or Vercel env) didn’t take effect until the dev server was restarted or the app was redeployed.
- Led to “no API key” / “payment not configured” even after “fixing” env.

### What to check in the other project
- [ ] After changing **any** env var: **restart dev server** (`Ctrl+C` then `npm run dev`) or **redeploy** on Vercel.
- [ ] Optional: clear Next cache before restart (`rm -rf .next` then `npm run dev`) if env still seems stale.
- [ ] In browser, confirm only **safe** Square vars are exposed, e.g. `NEXT_PUBLIC_SQUARE_APPLICATION_ID` and `NEXT_PUBLIC_SQUARE_ENV` — never the access token.

---

## 3. Vercel vs local env

### What went wrong here
- Production (Vercel) was still using wrong or missing env vars because only `.env.local` was updated.
- `.env.local` is **not** used by Vercel; production uses **Vercel Environment Variables** only.

### What to check in the other project
- [ ] **Production:** Every payment-related and site URL variable is set in **Vercel → Settings → Environment Variables** for the **Production** environment.
- [ ] **Redeploy** after adding or changing variables in Vercel (env is baked at build time).
- [ ] **Site URL:** Set `NEXT_PUBLIC_SITE_URL` in Vercel to the **production domain** (e.g. `https://yourdomain.com`) so emails, redirects, and OAuth use the correct origin. Keep `localhost` in `.env.local` for local dev only.

---

## 4. Surface real errors instead of generic 500

### What went wrong here
- Payment API returned a generic “500” or “Failed to process payment” and the real Square error (e.g. `AUTHENTICATION_ERROR`, `LOCATION_NOT_FOUND`, invalid amount) was only in server logs.

### What to do in the other project
- [ ] In the **payment creation API route** (e.g. `/api/payments/create` or equivalent):
  - Catch Square SDK errors and **return the Square error detail** (category, code, message) in the JSON response (sanitized, no card data).
  - Log the same detail server-side (e.g. Vercel Runtime Logs) with a clear prefix so it’s easy to find.
- [ ] Add **request-time logs** (e.g. env check: which env is used, whether token/App ID/location are present; amount in dollars/cents) so the other LLM can see exactly what was sent and what Square returned.

---

## 5. Database / backend constraints

### What went wrong here (unrelated to payments but blocked “production” use)
- **Products:** A check constraint on `products.category` only allowed `('earrings','necklaces','bracelets')`. Adding “anklets” in the app caused **product update/insert to fail** in production until the constraint was updated in Supabase.

### What to check in the other project
- [ ] If the app adds new enum-like values (e.g. new category, status, type): confirm the **database** allows them (check constraints, enums). If not, provide a one-off SQL change (e.g. `ALTER TABLE ... DROP CONSTRAINT ... ; ADD CONSTRAINT ... CHECK (...)` or add enum value) and document it.

---

## 6. Auth / redirects (Supabase or similar)

### What went wrong here
- After switching to production URL, **Supabase “Invalid Refresh Token”** appeared in dev overlay when old sessions (from a different origin) were still present. Not a bug in code; stale tokens from the previous site URL.

### What to check in the other project
- [ ] **Redirect URLs:** In Supabase (or auth provider) **Redirect URL** / **Site URL** list, add the **production URL** (e.g. `https://yourdomain.com` and `https://yourdomain.com/**` if needed).
- [ ] **Stale sessions:** If users see refresh-token errors after the switch, treat as “clear site data / re-login” or “session from old URL” — not necessarily a code bug.
- [ ] **NEXT_PUBLIC_SITE_URL** in production set to the same domain used in auth redirects.

---

## 7. Quick verification list for “other project” LLM

Before saying “production payments are ready”:

1. **Square:** App ID (`sq0idp-`) only in `NEXT_PUBLIC_SQUARE_APPLICATION_ID`; access token only in `SQUARE_ACCESS_TOKEN` (server-only); Location ID from same app; both env vars set to `production`; all set in **Vercel** and redeployed.
2. **No secrets in frontend:** Grep or inspect that no `NEXT_PUBLIC_*` variable contains the access token.
3. **Errors visible:** Payment API returns and/or logs Square’s error category and message on failure.
4. **Site URL:** Production domain set in auth provider and in `NEXT_PUBLIC_SITE_URL` on Vercel.
5. **DB constraints:** Any new “options” (e.g. new category) are allowed by the database schema; if not, provide and run the SQL change once.

---

## References in this repo

- **Square 500 debugging:** `SQUARE-500-ERROR-DEBUG-GUIDE.md`
- **Square env (correct split):** `SQUARE-ENV-VARS-CORRECTED.md`
- **Env loading / “No API key”:** `DEBUG-ENV-VARS.md`
- **Order emails + production:** `docs/ORDER-CONFIRMATION-EMAIL-SETUP.md`

---

*Created from Creativity by Lily production payment debugging. Use this as a checklist when switching another project to production payments.*
