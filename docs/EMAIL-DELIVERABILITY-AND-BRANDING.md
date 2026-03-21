# Email Deliverability & Logo in Inbox

How to ensure NoTime Storage emails **land in the inbox** and **show your logo** next to messages in Gmail (and other clients).

---

## Part 1: Avoid Spam (Land in Inbox)

### 1.1 Domain verification (SPF + DKIM)

**Required.** Resend signs your emails with DKIM and uses SPF when you verify your domain.

1. Go to [resend.com](https://resend.com) → **Domains**
2. Add `notimestorage.co` if not already added
3. Copy the DNS records Resend provides (SPF + DKIM)
4. Add them to your domain registrar (e.g. Cloudflare, Namecheap, GoDaddy)
5. Click **Verify** in Resend — wait for green checkmark

Without this, emails will often land in spam or be rejected.

### 1.2 DMARC (strongly recommended)

DMARC tells mailbox providers what to do when SPF/DKIM fail. It builds trust and is required for BIMI (logo in inbox).

1. Start with monitoring only:
   ```
   _dmarc.notimestorage.co  TXT  v=DMARC1; p=none; rua=mailto:dmarcreports@notimestorage.co;
   ```
2. Send test emails and confirm they pass DMARC (check headers for `dmarc=pass`)
3. Upgrade to enforcement:
   ```
   v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarcreports@notimestorage.co;
   ```
2. Use [Resend DMARC analyzer](https://resend.com/dmarc-analyzer) or [Google Postmaster Tools](https://postmaster.google.com/) to monitor

### 1.3 Content & sending best practices

- **From address:** Use a consistent sender: `NoTime Storage <noreply@notimestorage.co>` (already set)
- **Reply-To:** Consider adding `reply-to: support@notimestorage.co` so users can reply — some providers prefer it
- **Subject lines:** Avoid spam trigger words (FREE, URGENT, ACT NOW, etc.). Your current subjects are fine.
- **Text-to-image ratio:** Keep a good balance. Your emails have logos + text — avoid image-only emails.
- **Size:** Keep emails under 102KB (Gmail truncates larger)
- **Links:** Use your domain (`notimestorage.co`) — avoid shorteners or unrelated domains
- **Unsubscribe:** Transactional emails (e.g. booking confirmations) don’t require it, but move-in reminders are borderline; consider adding a “Manage preferences” link if you add more marketing-style emails

### 1.4 Domain reputation

- **Warmup:** New domains send slowly at first. Start with a few emails and increase over time.
- **Bounces:** Resend handles bounces; avoid sending to invalid addresses.
- **Complaints:** If users mark you as spam, reputation drops. Keep content relevant and expected.

---

## Part 2: Logo in Inbox (BIMI)

BIMI lets your logo appear next to emails in Gmail, Yahoo, and Apple Mail.

### 2.1 Prerequisites

- **DMARC:** `p=quarantine` or `p=reject` (see Part 1.2)
- **Logo:** SVG format meeting [BIMI specs](https://bimigroup.org/creating-bimi-svg-logo-files/)
- **Certificate:** Either:
  - **CMC (Common Mark Certificate)** — if you’ve used your logo publicly for 12+ months (e.g. archive.org proof). No trademark needed. Gmail supports.
  - **VMC (Verified Mark Certificate)** — if you have a registered trademark. Gmail shows a blue checkmark.

### 2.2 Steps

1. **DMARC:** Ensure `p=quarantine` or `p=reject` is set (see [Resend DMARC guide](https://resend.com/docs/dashboard/domains/dmarc))
2. **Certificate:** Purchase from [DigiCert](https://www.digicert.com/tls-ssl/verified-mark-certificates), [GlobalSign](https://www.globalsign.com/), or [SSL.com](https://www.ssl.com/)
   - Provide: SVG logo, business proof, domain ownership
   - CMC: ~12 months of public logo use
   - VMC: registered trademark
3. **BIMI record:** Add DNS TXT record (example from DigiCert):
   ```
   default._bimi.notimestorage.co  TXT  v=BIMI1; l=https://vmc.digicert.com/your-logo.svg; a=https://vmc.digicert.com/your-cert.pem;
   ```
4. **Verify:** Use [BIMI generator tool](https://bimigroup.org/bimi-generator/) to check

Propagation can take a few days. Gmail may also require a certain sending volume and reputation before showing the logo.

---

## Part 3: Logo Inside the Email (Already Done)

Your emails already include the logo in the header via `EmailLayout.tsx`:

```tsx
<Img src="https://notimestorage.co/brand/notime-storage-logo.png" ... />
```

That logo appears when the email is opened. BIMI (Part 2) shows a logo in the **inbox list** before the email is opened.

---

## Quick Checklist

| Task | Status |
|------|--------|
| Resend domain verified (SPF + DKIM) | [ ] |
| DMARC record added (`p=none` then `p=quarantine`) | [ ] |
| DMARC passing on all emails | [ ] |
| From address consistent | [ ] |
| (Optional) BIMI certificate + DNS record | [ ] |

---

## References

- [Resend: Domain verification](https://resend.com/docs/dashboard/domains/introduction)
- [Resend: DMARC](https://resend.com/docs/dashboard/domains/dmarc)
- [Resend: BIMI](https://resend.com/docs/dashboard/domains/bimi)
- [Resend: Deliverability insights](https://resend.com/docs/dashboard/emails/deliverability-insights)
- [Google Postmaster Tools](https://postmaster.google.com/) — monitor Gmail reputation
