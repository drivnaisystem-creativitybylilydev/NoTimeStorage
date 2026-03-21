# Auth emails not arriving (signup confirmation / password reset)

## “Email rate limit exceeded” (password reset / signup)

This message comes from **Supabase Auth**, not from your Next.js app. It protects against abuse: each project has limits on how many auth-related emails can be sent per time window (per email / per IP), especially on the **free tier**.

### Where to change it

1. **Supabase Dashboard** → **Authentication** → **Rate limits** (wording may be **Attack Protection** or **Rate Limits** depending on dashboard version).
2. Adjust **email** / **token** / **signup** limits if your plan allows (some options require **Pro** or **custom SMTP** — see [Supabase Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits)).

### What to do without changing settings

- **Wait** — limits are time-windowed (often ~1 hour for repeated requests to the same address). Heavy testing triggers this quickly.
- **Don’t spam reset** while debugging — use one test email or increase limits in the dashboard.

The app cannot bypass Supabase’s auth rate limits from the frontend; only **Supabase project settings** (or upgrading the project) change the caps.

---

## Recommended fix: Send Email hook (Resend API)

We implemented **HTTPS Send Email hook** so auth mail uses the same **Resend API** as booking emails. See **`docs/AUTH-SEND-EMAIL-HOOK.md`** for setup (`SEND_EMAIL_HOOK_SECRET` + Supabase Auth Hooks). This is the most reliable fix, especially if **school / .edu** addresses don’t receive SMTP-based auth mail.

---

## Why Resend shows “no errors”

**Booking and deposit emails** use the Resend API from our app (`lib/email/send.ts`). Those appear in Resend → **Logs** when sent successfully.

**Signup confirmation and password reset emails** are sent by **Supabase Auth**, not by that code path. They only go through Resend if you enable **Custom SMTP** in Supabase and point it at Resend.

So:

- If Custom SMTP is **off**, Supabase uses its **built-in** mailer (strict limits, often unreliable in production). Those sends **do not** use your `RESEND_API_KEY` in Vercel the same way.
- If Custom SMTP is **on** but misconfigured, failures show in **Supabase** (Auth logs / SMTP errors), not necessarily as clean rows in Resend’s API log.

**Check Resend for SMTP:** After enabling Supabase → Custom SMTP → Resend, you may still see activity under Resend, but the **first place to look** for auth email failures is **Supabase**, not Resend.

---

## Checklist (do in order)

### 1. Supabase → Custom SMTP (Resend)

**Authentication** → scroll to **SMTP Settings**:

| Field | Value |
|--------|--------|
| Enable Custom SMTP | **ON** |
| Sender email | `noreply@notimestorage.co` (must be on a domain verified in Resend) |
| Sender name | `NoTime Storage` |
| Host | `smtp.resend.com` |
| Port | `465` (SSL) or `587` (STARTTLS) |
| Username | `resend` |
| Password | Your **Resend API key** (same family as `re_...` — use the key from Resend dashboard) |

Save, then send a test from Supabase if the UI offers one.

### 2. Supabase → URL allowlist

**Authentication** → **URL Configuration**:

- **Site URL**: `https://notimestorage.co` for production (or `http://localhost:3000` for local-only testing).

**Redirect URLs** must include **every** URL your app uses in auth links (wildcards help):

- `http://localhost:3000/**`
- `https://notimestorage.co/**`
- Any Vercel preview: `https://*.vercel.app/**` (if you test previews)

Our app uses:

- Signup confirmation: `{origin}/auth/callback`
- Password reset: `{origin}/auth/update-password`

If the redirect is not allowed, Supabase may refuse or behave oddly—always match **Site URL** and **Redirect URLs** to where you actually run the app.

### 3. Supabase → Auth logs

**Authentication** → **Users** (or **Logs** / **Auth** section in newer dashboards):

- Look for failed email or signup events around your test time.

### 4. “Sign up succeeded but no email” — duplicate account

If the email **already exists**, Supabase often returns **success** without sending another confirmation (anti-enumeration). Try a **new** email address or check **Authentication → Users** for an existing user.

### 5. Rate limits

Supabase limits auth emails per hour on free tier. Space out tests or check project **Auth** settings / docs for current limits.

---

## Quick reference: who sends what

| Email | Sent by | Shown in Resend API logs? |
|--------|---------|---------------------------|
| Signup confirmation | Supabase Auth | Only if Custom SMTP → Resend is configured and delivery is via Resend |
| Password reset | Supabase Auth | Same |
| Deposit / order / admin booking | App (`lib/email/send.ts`) | Yes, when `RESEND_API_KEY` is set |

---

## After fixing SMTP

1. Sign up with a **new** email.
2. Request password reset for an **existing** user.
3. Check inbox + spam, then Resend (if using SMTP) and Supabase Auth logs.
