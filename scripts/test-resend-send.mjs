/**
 * One-off Resend test: sends from your verified domain to BOOKING_NOTIFY_EMAIL.
 * Usage: node --env-file=.env.local scripts/test-resend-send.mjs
 */
import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY?.trim();
const to =
  process.env.BOOKING_NOTIFY_EMAIL?.trim() ||
  process.env.TEST_EMAIL_TO?.trim();
const from =
  process.env.RESEND_FROM_EMAIL?.trim() ||
  'NoTime Storage <noreply@notimestorage.co>';

if (!apiKey) {
  console.error('Missing RESEND_API_KEY (add to .env.local or env).');
  process.exit(1);
}
if (!to) {
  console.error('Set BOOKING_NOTIFY_EMAIL or TEST_EMAIL_TO in .env.local.');
  process.exit(1);
}

const resend = new Resend(apiKey);
const { data, error } = await resend.emails.send({
  from,
  to: [to],
  replyTo: 'admin@notimestorage.co',
  subject: '[NoTime Storage test] Resend + custom domain',
  html: `<p>This is a manual test from your repo.</p>
<p>If it arrived, <strong>${from}</strong> sending via Resend is working.</p>
<p>Reply-To is <strong>admin@notimestorage.co</strong> — try “Reply” in your client.</p>`,
});

if (error) {
  console.error('Resend returned an error:', error);
  process.exit(1);
}

console.log('Sent OK. Resend message id:', data?.id);
console.log('Recipient:', to);
