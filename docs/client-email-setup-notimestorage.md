# Your NoTime Storage email — simple setup guide

This guide is for **one business inbox**:

**Email address:** `admin@notimestorage.co`  
**Password:** the one you chose when the account was created (or that was sent to you securely).

If you ever forget your password, use **Forgot password** on the Zoho sign-in page, or ask your site administrator to help you reset it through Zoho.

---

## Easiest way: use the web or Zoho’s app (recommended)

You do **not** need to type server names or “ports” if you use these options.

### Option A — Read email in your web browser

1. Open **[Zoho Mail](https://mail.zoho.com)** in Chrome, Safari, or Edge.
2. Sign in with **`admin@notimestorage.co`** and your password.
3. Bookmark the page so you can open your inbox anytime.

### Option B — Use the Zoho Mail app on your phone

1. On your phone, open the **App Store** (iPhone) or **Google Play** (Android).
2. Search for **“Zoho Mail”** and install the official app.
3. Open the app and sign in with **`admin@notimestorage.co`** and your password.
4. Turn on notifications in the app if you want alerts for new messages.

That’s all you need for day-to-day reading and replying. Messages you send will come **from** `admin@notimestorage.co`, which looks professional to customers.

---

## Optional: add this email to Apple Mail, Outlook, or Gmail app

Only use this section if you **prefer** those apps instead of Zoho in the browser or the Zoho Mail app.  
You will need to enter the settings below **exactly** as shown. If one step is wrong, mail may not send or receive.

### Your account details (same for any app)

- **Email:** `admin@notimestorage.co`
- **Password:** your Zoho password

### Incoming mail (IMAP) — “receiving”

| Field | What to enter |
|--------|----------------|
| Type | **IMAP** |
| Server / host | `imappro.zoho.com` |
| Port | **993** |
| Security / encryption | **SSL** (or “SSL/TLS”) — must be on |
| Username | Your full email: `admin@notimestorage.co` |

### Outgoing mail (SMTP) — “sending”

| Field | What to enter |
|--------|----------------|
| Server / host | `smtppro.zoho.com` |
| Port | **465** with **SSL**, **or** **587** with **TLS** / “STARTTLS” (use what your app asks for) |
| Authentication | **Yes** (required) |
| Username | Your full email: `admin@notimestorage.co` |
| Password | Same password as above |

**Note:** Some apps show two separate password boxes (incoming vs outgoing). Use the **same** password for both.

---

## Quick checks if something doesn’t work

1. **Can sign in on the website?**  
   Go to [mail.zoho.com](https://mail.zoho.com). If that works but your phone app doesn’t, the problem is only in the app settings — compare them to the tables above.

2. **Can receive but not send?**  
   Almost always means **SMTP** (outgoing) is missing the correct server, port, or “use authentication.” Fix **outgoing** using the SMTP table.

3. **Password errors**  
   Try resetting your password through Zoho’s **Forgot password**, or confirm with your administrator that the account is active.

---

## For your reference (you can ignore this unless someone asks)

- **Marketing / automated emails** from the website may use a separate address like **no-reply** so customers don’t confuse them with a personal reply. Your **`admin@`** address is for **real conversations** and running the business.
- This document only covers **reading and sending** your mailbox; technical DNS and website settings are handled separately.

---

*Last updated for Zoho Mail hosted email on `notimestorage.co`.*
