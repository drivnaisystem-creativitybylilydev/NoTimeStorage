# Auth emails via Resend API (Send Email hook) — “fix once and for all”

Signup confirmation and password reset are normally sent by **Supabase Auth** (SMTP or Supabase’s default mailer). That path **does not** use your app’s `RESEND_API_KEY` in Vercel the same way as booking emails, and **school / corporate (.edu) inboxes** often block or delay those messages even when Resend’s domain is correct.

This project adds a **Send Email hook** so **every auth email** (signup, reset password, magic link, etc.) is sent with the **same Resend HTTP API** as deposits and booking confirmations. You’ll see sends in **Resend → Logs**, and deliverability matches your other transactional mail.

## Prerequisites

- Production URL deployed (e.g. `https://notimestorage.co`)
- `RESEND_API_KEY` and `NEXT_PUBLIC_SUPABASE_URL` already set in Vercel (you already have these)

## One-time setup (Supabase + Vercel)

### 1. Deploy the latest site

Deploy so this route exists and is reachable:

`POST https://notimestorage.co/api/auth/send-email`

### 2. Create the hook in Supabase

1. Open **Supabase Dashboard** → your project → **Authentication** → **Auth Hooks** (or **Hooks** under Authentication).
2. Create a hook: **Send Email** → type **HTTPS**.
3. **URL:** `https://notimestorage.co/api/auth/send-email`
4. Click **Generate secret** (or equivalent). Copy the full secret (format like `v1,whsec_...`).
5. Save the hook and **enable** it.

When the Send Email hook is **enabled**, Supabase **does not** use SMTP for those messages — your endpoint sends them via Resend.

### 3. Add the secret to Vercel

1. **Vercel** → Project → **Settings** → **Environment Variables**
2. Add:
   - **Name:** `SEND_EMAIL_HOOK_SECRET`
   - **Value:** paste the **entire** secret string from Supabase (including `v1,whsec_` if shown)
   - **Environment:** Production (and Preview if you test hooks against preview URLs)

3. **Redeploy** the production deployment so the variable is available.

### 4. Test

1. Sign up with a **new** Gmail address → confirm the message appears in **Resend → Logs** and in the inbox.
2. **Reset password** for an existing user → same checks.

If the hook returns **401**, the secret in Vercel doesn’t match the one in Supabase. Regenerate or re-copy.

If the hook returns **500**, check Vercel **Function logs** for `[auth/send-email]` and confirm `RESEND_API_KEY` is set.

## School / .edu email addresses

Many universities run aggressive spam filters. Even with this hook, **some** .edu addresses may still delay or block mail. For the most reliable tests, use **Gmail or Outlook personal** accounts. You can add a short note on the signup page suggesting a personal email if students don’t see the message.

## Reference

- [Supabase: Send Email hook](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook)
- Implementation: `app/api/auth/send-email/route.ts`, `lib/email/auth-hook-send.ts`
