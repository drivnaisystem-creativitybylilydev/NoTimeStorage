# Stripe Support — Advance Intro Email (for Jermaine to send)

## What this is

A short introductory email to send to Stripe's risk / compliance team **before** your first peak booking window. The purpose is simple: give Stripe context about our seasonal spike (late April – mid May) so their automated systems don't read it as fraud and freeze payouts. New merchants who don't communicate in advance are the ones who get held up. New merchants who reach out first almost never do.

This is the single highest-leverage 5 minutes you can spend to prevent a Square-style freeze.

---

## When to send

**This week, before I flip Stripe live on the site.** Ideally 7+ days before real customer charges start flowing through Stripe. Earlier is better than later.

---

## How to send (two channels — do both)

Stripe triages support a few different ways. Sending it through two channels makes sure it actually lands on a human and creates a paper trail you can point to later.

### Channel 1 — Dashboard support ticket (creates a case number)

1. Log in at [dashboard.stripe.com](https://dashboard.stripe.com).
2. Bottom-left corner, click the **?** help icon → **Contact support**.
3. Topic: "Account / Other" or "Risk review". Subcategory: "Other".
4. Subject: `Advance notice — seasonal transaction spike for NoTime Storage`
5. Paste the email body below into the message field.
6. Submit. You'll get a case number by email within a few minutes.

### Channel 2 — Direct email

Send the same message to **[email protected]** from `[email protected]`.

Subject line: `Advance notice — seasonal transaction spike for NoTime Storage`

---

## The email — copy-paste block

Everything in `[BRACKETS]` you need to fill in. Everything else is good to send as-is.

```
Subject: Advance notice — seasonal transaction spike for NoTime Storage

Hi Stripe team,

I'm Jermaine [LAST NAME], owner of NoTime Storage. We're a student storage service — we pick up, store, and return belongings for college students during their summer and winter breaks. I'm reaching out proactively, before our peak booking window, so your risk and compliance teams have context on what they'll see from our account over the next few weeks.

About the business
—
Website: notimestorage.co
Contact: [email protected]
Phone: [YOUR PHONE NUMBER]
Owner / primary contact on account: Jermaine [LAST NAME]

Students book on our website. We pick their belongings up directly from their dorm at the end of the semester, store everything in our local facility, and deliver it back to their new room at the start of the next semester. Every charge corresponds to a scheduled physical pickup and storage service — we are not digital goods, drop-shipping, a marketplace, or high-risk. We currently serve twelve colleges across Massachusetts, Connecticut, Ohio, Indiana, North Carolina, Maryland, and Virginia.

Expected transaction pattern (the main thing I want you to know)
—
Our business is highly seasonal. You will see two yearly spikes on this account:

• Late April through mid-May — peak pickup / end-of-semester storage. This is where the bulk of our revenue lands. Typical transactions are $200–$400 each, with a smaller number of $50 deposits taken in the weeks leading up as students reserve their spot.

• Late August through mid-September — return deliveries and new-cycle bookings. Similar profile, slightly lower total volume.

Outside those two windows our volume is low to moderate. The two spikes are completely normal for our industry and not a signal of anything unusual. I wanted to flag it explicitly because I understand sudden volume on a new Stripe account can look like a risk pattern on its own.

Payment structure
—
Most bookings are split in two: a $50 deposit at the time of booking, and the remainder charged one to two weeks before pickup. Students can also choose to pay in full up front. Charges are taken online through Stripe Checkout at the time the student authorizes them — we do not store card details or run manual off-session charges.

Refund and cancellation policy
—
Published at notimestorage.co/terms. Summary:
• Full refund if the customer cancels before pickup is scheduled.
• Deposit is forfeit after pickup is scheduled.
• Full refund (including deposit) in the case of any service failure on our side.

What would help us
—
I want to avoid unnecessary payout holds during our peak window. If there is anything specific your risk team would like us to provide in advance — prior-year volume, recent bank statements, proof of fulfillment records, a copy of our facility lease, insurance documentation — please let me know and I'll send it over the same day. I would much rather answer every question now than have to react when students are mid-pickup.

Happy to hop on a call if that is easier than email.

Thanks for reading this.

Best,
Jermaine [LAST NAME]
Owner, NoTime Storage
[email protected]
[YOUR PHONE NUMBER]
notimestorage.co
```

---

## Placeholders to fill in before sending

Search for `[` in the email body. The three things you need to fill in:

| Placeholder | What to put |
|---|---|
| `[LAST NAME]` (appears twice) | Your last name |
| `[YOUR PHONE NUMBER]` (appears twice) | The phone number where Stripe can reach you — ideally the same one on your Stripe account |

Everything else (`notimestorage.co`, `[email protected]`, `$50 deposit`, the twelve schools, peak windows) is already correct — don't change it.

---

## If they reply asking for documents

Stripe's risk team may come back with questions. This is a GOOD sign — it means a human is reviewing you in a friendly context instead of an algorithm flagging you in a hostile one. Common things they might ask for:

- **Prior-year transaction volume or receipts** — give them whatever Venmo / prior-processor records you have. Even screenshots of your Venmo business account summary for last summer are fine. Don't invent numbers — be honest even if small.
- **Proof of fulfillment** — photos of your storage facility, a sample pickup receipt, the NoTime dashboard you use to track bookings. Screenshots are fine.
- **Bank statements** — 2-3 months of your business bank statements. They want to verify the account is active and legitimate. PDF export from your bank's online portal.
- **Identification** — driver's license or passport. Already uploaded during account setup but they may re-ask.
- **Lease / facility documents** — a copy of your storage facility lease or ownership deed. Proves you're actually running a physical service.

**Respond within 24 hours** whenever they write. Fast responses are the single biggest signal to Stripe that you're a legitimate operator, not someone testing their system.

If they ask something you don't understand or aren't sure how to answer, text me before replying — I'll help you word it.

---

## After it's sent — let me know

Text me the Stripe case number once you get it. That gives us a reference we can point to if anything ever does get flagged during the season ("see case #XXXX from April").

Once the email is out, I start building Stripe on my end. The two threads run in parallel — you handling the Stripe relationship, me handling the code — so we hit the peak window with everything in place.
