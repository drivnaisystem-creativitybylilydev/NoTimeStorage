# Stripe setup — step-by-step guide

Hey Jermaine — this is your guide for getting Stripe set up on NoTime Storage. Read it top to bottom once, then follow it day by day. If anything is unclear or you hit a wall, text me and I'll help you through it.

You're doing this part. I'm doing the code and the website changes. We have to work in parallel — you setting up the account, me building the integration — so the whole thing is live in about a week and a half.

**What Stripe gives us:**
- A real card processor on the site. Customers (US and international) pay by card in a few taps.
- Payments confirm automatically — you stop clicking "Mark Paid" for everyone who uses Stripe.
- Money lands in your bank account on a 2-day rolling basis.
- You still have Venmo as a backup for anyone who prefers it.

**Why we're careful this time:** Your Square account got frozen because some verification documents sat pending for too long. That's avoidable. This guide bakes in the fix — upload docs fast, open a friendly support ticket before the money starts moving, check the dashboard weekly. If you follow the guide, the freeze won't happen.

---

## Before you start — have these ready

Gather these BEFORE you sit down on Day 1. Having everything in front of you means the whole account registration takes about 20 minutes. Hunting for a document mid-way turns it into a 2-day slog.

- **Business structure decision** — are you a sole proprietor (just you, no LLC) or do you have an LLC? Whatever you used for Square and for your taxes is the right answer.
- **Tax ID:**
  - If sole prop: your Social Security Number (SSN)
  - If LLC: your Employer Identification Number (EIN) — that's the letter the IRS sent you when you formed the LLC. It's a 9-digit number like 12-3456789.
- **Your legal name** (exactly as it appears on your driver's license or passport)
- **Your home address** (must match what's on your ID)
- **Business name** — "NoTime Storage" or whatever the legal business name is if you registered an LLC
- **Business address** — where you receive mail for the business. Can be your home if sole prop.
- **Bank account info for payouts** — the account you want Stripe to deposit money into. You'll need:
  - Routing number (9 digits)
  - Account number
  - Account type (Checking or Savings — usually Checking)
- **A photo of your driver's license or passport** — front and back, clear and well-lit. Take this on your phone now so you have it ready.
- **Phone number** — your cell is fine. Stripe will text you a verification code.

If any of these are missing or out of date, fix them first. Using inconsistent info (e.g. old address on your ID, new address on the application) is what triggers verification flags.

---

## Day 1 — Create the account (20 minutes)

### Step 1.1 — Go to the registration page

Open this in your browser: **https://dashboard.stripe.com/register**

You'll see a sign-up form. Enter:

- **Email** — use `notimestorage@gmail.com` (the business inbox). This is important — if it goes to your personal email, you'll miss important verification emails and we're back to the Square freeze problem.
- **Full name** — your legal name
- **Password** — make it strong. Use a password manager (1Password, Bitwarden, or at minimum iCloud Keychain) to save it. Do NOT reuse your Gmail password.
- **Country** — United States

Click **Create account**.

### Step 1.2 — Verify your email

Stripe will send a verification email to `notimestorage@gmail.com`. Go to that inbox, open the email, click the link. This logs you into the dashboard.

### Step 1.3 — Turn on two-factor authentication (2FA)

The moment you're logged in, Stripe will nag you to set up 2FA. **Do it immediately.** This is how you avoid someone breaking into your Stripe and stealing payouts.

- Choose **Authenticator app** (not SMS — SMS is less secure).
- Install Google Authenticator or Authy on your phone if you don't have one already.
- Scan the QR code Stripe shows you.
- Save the backup codes Stripe gives you somewhere safe (password manager or a Note in your phone). If your phone is ever lost or replaced, these codes are the only way back into the account.

### Step 1.4 — Activate your account (the big form)

From the dashboard, you'll see a big button or banner that says **Activate your account** or **Complete your Stripe profile**. Click it. This opens a multi-step form. Here's every question and what to put:

**Section: Business structure**
- *What type of business is this?* → Individual / Sole proprietor (unless you have an LLC — then pick LLC)
- *Industry* → Find and select **Storage & warehousing** (or **Moving services** if you can't find storage). If neither is visible, search "storage" in the dropdown.
- *What does your business do?* → Paste this: *"Seasonal storage service for college students. We pick up, store, and return boxes and belongings between semesters. Customers are students at Massachusetts colleges, primarily Stonehill College, with the service expanding to more schools."*
- *Website* → `https://notimestorage.co`

**Section: Business details**
- *Legal business name* → your legal business name. For sole prop this is usually your personal name. For LLC it's the LLC name.
- *Doing-business-as (DBA) name* → **NoTime Storage** (this is what customers see)
- *Tax ID* → EIN if LLC, SSN if sole prop
- *Business address* → your mailing address
- *Business phone* → your cell or business line

**Section: Personal details (representative)**
- Fill out for yourself. This is who Stripe holds responsible for the account.
- *Date of birth* → yours
- *Home address* → must match your ID
- *Last 4 of SSN* → yes, Stripe asks. It's standard for anti-money-laundering compliance.
- *Government-issued ID upload* → upload the driver's license / passport photo you took earlier. Front AND back if it's a license.

**Section: Bank account for payouts**
- *Routing number* → from your bank
- *Account number* → from your bank
- *Account type* → Checking (usually)

**Section: Public details**
- *Statement descriptor* → this is what shows up on customers' credit card statements. Enter: **NOTIME STORAGE**. Max 22 characters, uppercase.
- *Customer support email* → `notimestorage@gmail.com`
- *Customer support phone* → your business phone or cell.

Double-check everything, then click **Submit** at the end. Stripe will say something like "Your account is being reviewed."

**You're done with Day 1.** Take a break.

---

## Day 2 — Upload any requested documents (check twice, respond fast)

The morning after Day 1, log back into Stripe at **https://dashboard.stripe.com**.

Look at the top of the dashboard. You'll see one of these:

1. **"Your account is live" / "Payouts enabled"** → Amazing, no action needed. Skip to Day 3.
2. **"We need more information"** or a yellow/red banner with a list of required documents → This is where Square went wrong. Stripe is asking for proof of something. **Upload whatever they ask for today, not next week.**

Common things Stripe asks for:

- **Additional photo of your ID** — if the first one was blurry or cropped
- **Proof of home address** — a utility bill, bank statement, or lease agreement from the last 3 months with your name + address on it
- **Proof of business** — if you're an LLC, a copy of your EIN confirmation letter from the IRS. If sole prop, usually not required.
- **Bank account confirmation** — a screenshot or PDF of a recent bank statement showing your name, the bank name, and the account number

**Rule: Upload everything they ask for within 48 hours.** If you wait a week, Stripe starts holding your payouts. If you wait two weeks, they freeze the account. That's exactly what happened with Square. Don't let it happen here.

If you can't immediately find a document, send me a text — I can usually help figure out where to get it.

### Check the dashboard every day this week

While you're waiting for verification to complete, log in every morning for the first week. It takes 30 seconds. You're looking for:

- New notification banners
- New document requests
- Any email from Stripe in the business inbox

Verification usually completes in 1-5 business days if you respond quickly.

---

## Day 3 — Open a pre-launch support ticket (10 minutes)

This is the extra thing I want you to do that we didn't do with Square. **Proactively tell Stripe about your business BEFORE customers start paying.** This prevents their fraud-detection system from flagging your seasonal spikes as suspicious activity.

### Step 3.1 — Open the support chat

In the Stripe dashboard, click the **? (help)** icon in the top right. Choose **Contact us** → **Start a conversation** → pick the category **Account** or **General question**.

### Step 3.2 — Paste this message

Copy this word-for-word and paste it into the support chat (edit anything in [brackets]):

---

> Hi Stripe team,
>
> I'm opening this ticket proactively before our business starts processing payments, because our transaction pattern might look unusual to your fraud detection and I want to give you context upfront.
>
> **About us:** NoTime Storage provides seasonal storage for college students. We pick up, store, and return students' belongings between semesters. Website: https://notimestorage.co
>
> **Why I'm writing:** Our business is heavily seasonal. We expect most of our transactions to happen in two tight windows each year:
> - **May (end of spring semester):** 50-200 transactions in a 2-3 week period, mostly $50 deposits and $200-400 full booking payments
> - **December (end of fall semester):** smaller spike, similar payment types
> - The rest of the year is quiet — just a handful of payments per month
>
> We also expect a meaningful portion of customers to be international students paying with non-US cards (from the UK, China, India, Brazil, etc.), which I understand increases fraud-risk scoring. Our customers are all verifiable students at US colleges — every payment is tied to a `.edu` email, a dorm address, and a move-out date.
>
> **Expected average ticket:** $50 (deposit) and $250-400 (full booking balance)
> **Expected annual volume:** $20,000-$80,000 for this first year, growing.
>
> I'd appreciate if you could:
> 1. Note this context on our account so our May/December spikes don't get flagged as unusual activity
> 2. Let me know if there's anything else you'd like documentation on in advance (business license, insurance, student agreements, storage facility lease, etc.) — happy to provide proactively
> 3. Point me at any Radar/fraud settings you'd recommend for our use case
>
> Thanks for the help — trying to set this up right from the start.
>
> [Your name]
> NoTime Storage

---

### Step 3.3 — Respond to anything they ask

Stripe will reply within a few business days. If they ask for additional info (business license, insurance docs, a contract template, etc.), send it to them promptly — same 48-hour rule as document uploads.

When they confirm the context is noted, screenshot the message and text it to me so I have it on file.

---

## Day 4-5 — You wait, I build

At this point your job is mostly done. You're waiting on:

1. Stripe to finish verifying your account (email notifications land in `notimestorage@gmail.com`)
2. Stripe support to respond to the ticket you opened

**What to do during the wait:**

- Log into the dashboard each morning and check for notifications. 30 seconds.
- Respond to any document requests within 48 hours. This is the single most important habit.
- Text me screenshots of anything Stripe sends that you don't understand. No question is too small.

**What I'm doing in parallel:**

- Writing the code that connects the website to your Stripe account
- Testing everything with Stripe's test-mode keys (fake money, no real payments)
- Setting up the webhook that auto-confirms payments so you don't have to click "Mark Paid"

When your account is verified AND my code is ready, we flip one switch and Stripe is live on the site.

---

## The weekly habit — forever

This is how we avoid a repeat of Square. Every Monday morning (or any day you pick, but pick one and stick to it):

**The 15-minute Monday Stripe check:**

1. Log into **https://dashboard.stripe.com**
2. Look at the **Overview** page — anything red or yellow? Click it and deal with it.
3. Check the **Notifications** icon (bell, top right). Clear any that need action.
4. Check your inbox at `notimestorage@gmail.com` for anything from `support@stripe.com` or `noreply@stripe.com` that you haven't already read.
5. Glance at **Payments** — anything disputed? Respond to disputes within 7 days or you lose them automatically.
6. Glance at **Payouts** — is money flowing to your bank on schedule?

That's it. 15 minutes. Put it on your calendar as a recurring event right now so you don't forget.

---

## What to do if Stripe asks something you don't understand

Two rules:

1. **Don't ignore the email.** Ignoring is how accounts get frozen.
2. **Text me the screenshot.** I'll translate what they want and tell you exactly what to send back. There's no such thing as a dumb Stripe question.

Common ones you might see:

- *"We need to verify your identity"* → Usually means re-upload your ID. Take a better-lit photo.
- *"Additional verification required for payouts"* → Upload a bank statement showing your name + account.
- *"We've noticed unusual activity"* → This is what the Day 3 support ticket is meant to prevent. If it still happens, reply to the email calmly, reference your Day 3 support ticket, and text me.
- *"A customer has disputed a charge"* → You have 7 days to respond. Text me — I'll help you write the response.

---

## Timeline summary

| When | Who | What |
|------|-----|------|
| Day 1 | You | 20 min: create Stripe account, activate profile, enable 2FA |
| Day 2 | You | Log in, upload any requested documents within 48h |
| Day 3 | You | 10 min: open pre-launch support ticket with the template above |
| Day 4-5 | You | Daily 30-second dashboard check; respond to Stripe questions fast |
| Day 1-10 | Finn | Building the integration against test-mode keys |
| Day ~7-10 | Both | Stripe confirms your account is live; we flip to production |
| Ongoing | You | Monday 15-minute Stripe check. Every week. Forever. |

---

## One last thing

Setup is boring. The payoff isn't. Once this is live:

- Customers pay by card in a few taps. No more "Pay $X on Venmo" friction.
- International students can finally use us.
- Your payments show up in your bank account automatically on a rolling 2-day schedule.
- **You stop clicking "Mark Paid" for every single customer.** That alone is hours back per week in May.

Text me when Day 1 is done. We're building this right.

— Finn
