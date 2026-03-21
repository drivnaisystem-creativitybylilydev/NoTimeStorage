# Email Setup — Step-by-Step Checklist

One step at a time. Complete each before moving to the next.

---

## ✅ Step 1: Resend domain verification
**Status:** DONE  
**What:** SPF + DKIM records so Resend can send from your domain.  
**Where:** Resend → Domains → notimestorage.co (Verified)

---

## ✅ Step 2: DMARC record
**Status:** DONE  
**What:** DMARC TXT record so inbox providers trust your domain.  
**Where:** Vercel → Domains → notimestorage.co → DNS Records  
**Record:** `_dmarc` TXT = `v=DMARC1; p=none; rua=mailto:notimestorage@gmail.com;`

---

## ✅ Step 3: Run Deliverability Insights
**Status:** DONE  
**What:** Resend checked your emails. Two flags found (see below).

---

## Current setup
- **Sending:** Automated emails (booking confirmations, deposit, etc.) from `noreply@notimestorage.co`
- **Receiving:** Not set up yet — no inbox for your domain

---

## Known flags (can fix later)

| Flag | Status | When to fix |
|------|--------|-------------|
| **Don't use no-reply** | Deferred | When you set up email receiving (hello@ or support@ with forwarding) |
| **Link URLs match domain** | Deferred | Supabase auth links use supabase.co; check if custom auth domain is available |

---

## Optional next steps (when ready)

### Step A: Set up email receiving
When you want to receive at your domain:
1. Use Resend Inbound or ImprovMX (or similar)
2. Create hello@ or support@ with forwarding to Gmail
3. Update FROM address from noreply@ to hello@
4. Update Supabase Auth SMTP sender to match

### Step B: Upgrade DMARC to p=quarantine
After confirming all emails pass:
1. Vercel DNS → Edit _dmarc record
2. Change `p=none` to `p=quarantine`

### Step C: BIMI (logo in inbox)
Requires DMARC p=quarantine + logo certificate. See `docs/EMAIL-DELIVERABILITY-AND-BRANDING.md`.

---

## Summary
Core setup is done: domain verified, DMARC in place. Emails should land in inbox. The two Resend flags are improvements you can tackle when you add email receiving.
