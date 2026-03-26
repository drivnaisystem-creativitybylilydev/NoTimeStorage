# NoTime Storage — Your business email (`@notimestorage.co`)

This guide is for **you**, the operator. Fill in the password fields at the end (or print and complete securely). Keep this file somewhere private—**do not** email it or store it in a shared drive with passwords filled in.

---

## What we set up for you

- **A real inbox on your own domain:** **`admin@notimestorage.co`**
- **Hosted by Zoho Mail** — the same class of service many companies use for professional email (webmail, phone apps, reliable delivery).
- **Separation from “automated” mail:**  
  - Students and the website often get messages **from** an address like **`noreply@notimestorage.co`** (booking confirmations, receipts, system mail). That keeps automated traffic clean.  
  - **Your** inbox is where **business conversations** land: contact-form notifications, booking alerts, deposit notices, and any time someone hits “Reply” expecting a human.
- **One place to run the business from email:** You are not dependent on a personal `@gmail.com` address for customer-facing operations—you operate from **`@notimestorage.co`**, which matches your brand and your site.

---

## What you should use this inbox for

| Use this inbox to… | Why |
|--------------------|-----|
| Read and answer student/parent questions | Replies look professional and stay on-brand. |
| Receive **contact form** submissions from the website | Each submission also sends you a notification email (in addition to a database record). |
| Receive **new booking**, **deposit paid**, and **move-in detail** alerts | Operational awareness without logging into the admin panel for every event. |
| Keep official records of communication | Search and folders in Zoho work like any modern mail product. |

**Note:** If Zoho or another service asks you to **verify a device** or **confirm your identity**, the code may be sent to your **recovery / notification email** (see below). That is normal.

---

## How to sign in on the web (primary method)

1. Open **[https://mail.zoho.com](https://mail.zoho.com)** in Chrome, Safari, or Edge.  
2. Sign in with:  
   - **Email:** `admin@notimestorage.co`  
   - **Password:** *(your Zoho password — see “Credentials” at the bottom of this document)*  
3. Bookmark the page for quick access.

If you forget your password, use **Forgot password** on Zoho’s sign-in screen, or ask your technical contact to help reset it through Zoho’s admin console.

---

## Confirmation codes and your Gmail account

During **first-time setup**, **new device** sign-in, or **recovery**, Zoho may send a **short verification code** or link to an email address on file.

**If we registered the account using the shared `notimestorage@gmail.com` (or similar) as the recovery / backup address:**

- Open that **Gmail** inbox when Zoho says it sent you a code.  
- Enter the code in Zoho to finish sign-in or device approval.

Once you are fully set up, you may be able to change recovery options inside Zoho’s account security settings—your technical contact can walk you through that when you are ready.

---

## Mobile — recommended: Zoho Mail app

The easiest path on phone is **Zoho’s own app** (no server names to type).

1. Install **Zoho Mail** from the **App Store** (iPhone) or **Google Play** (Android).  
2. Open the app → **Sign in** → enter **`admin@notimestorage.co`** and your **password**.  
3. Complete any **verification** step (code may arrive in the **Gmail** recovery inbox, as above).  
4. Enable **notifications** in the app if you want alerts for new mail.

---

## Mobile or desktop — advanced: other mail apps (Apple Mail, Outlook, etc.)

If you prefer Apple Mail, Outlook, or another client, use **IMAP** (recommended) so mail stays synced across devices. These values match Zoho’s **“Go Mobile” / mail client configuration** for your hosted plan:

### Incoming mail (IMAP)

| Field | Value |
|--------|--------|
| Server | `imappro.zoho.com` |
| Port | **993** |
| Security | **SSL** (required) |
| Username | Your full address: **`admin@notimestorage.co`** |
| Password | Same as Zoho webmail |

### Outgoing mail (SMTP)

| Field | Value |
|--------|--------|
| Server | `smtppro.zoho.com` |
| Port | **465** with **SSL**, **or** **587** with **TLS** / STARTTLS (use what your app asks for) |
| Authentication | **Yes** (required) |
| Username | **`admin@notimestorage.co`** |
| Password | Same as Zoho webmail |

If the app has separate “incoming” and “outgoing” password fields, use the **same** password for both.

**Troubleshooting:** If mail **receives** but won’t **send**, the problem is almost always the **SMTP** server, port, or “use authentication.” Compare again to the table above.

---

## Credentials — fill in securely (do not share publicly)

Store this section in a **password manager** or a **printed copy** in a safe place. Replace the brackets with real values when you are alone.

| Item | Your value |
|------|------------|
| **Zoho sign-in email** | `admin@notimestorage.co` |
| **Zoho password** | `[ WRITE PASSWORD HERE ]` |
| **Recovery / code email** (if used at signup) | `[ e.g. notimestorage@gmail.com — codes may arrive here ]` |
| **Optional: app-specific password** (only if Zoho requires it for your mail client) | `[ IF APPLICABLE ]` |

---

## Support

- **Zoho account or billing:** [Zoho Mail help](https://www.zoho.com/mail/help/)  
- **Website form not emailing you / technical:** contact whoever maintains the NoTime Storage site and hosting.

---

*Prepared for NoTime Storage. Business inbox: **admin@notimestorage.co**.*
