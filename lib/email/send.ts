'use server';

import { render } from '@react-email/components';
import { DepositConfirmedUserEmail } from '@/emails/deposit-confirmed-user';
import { OrderConfirmedUserEmail } from '@/emails/order-confirmed-user';
import { DepositPaidAdminEmail } from '@/emails/deposit-paid-admin';
import { NewBookingAdminEmail } from '@/emails/new-booking-admin';
import { MoveInReminderUserEmail } from '@/emails/move-in-reminder-user';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';
import { emailInlineLogoHeaderHtml } from '@/lib/email/branding';

const FROM = 'NoTime Storage <noreply@notimestorage.co>';
const REPLY_TO = SITE_CONTACT_EMAIL;

/** Operational alerts: deposit paid, new booking, move-in updates, contact form. Env overrides; else SITE_CONTACT_EMAIL (admin@). */
function adminNotifyTo(): string {
  return (process.env.BOOKING_NOTIFY_EMAIL || SITE_CONTACT_EMAIL).trim();
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function sendEmail(
  to: string | string[],
  subject: string,
  html: string,
  replyToOverride?: string | null,
) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to];
  if (!apiKey || !recipients.length) {
    console.warn('[email] Skipped — missing RESEND_API_KEY or recipient');
    return;
  }
  const replyTo = (replyToOverride && replyToOverride.trim()) || REPLY_TO;
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM,
      to: recipients,
      replyTo,
      subject,
      html,
    });
    if (error) console.error('[email] Send error:', error);
    else console.log('[email] Sent to', recipients.join(', '), '–', subject);
  } catch (err) {
    console.error('[email] Exception:', err);
  }
}

// ── User: deposit confirmed ──────────────────────────────────────────────────

export async function sendDepositConfirmedUser(params: {
  to: string;
  parentEmail?: string | null;
  customerName: string;
  depositAmount?: number;
}) {
  const html = await render(DepositConfirmedUserEmail({
    customerName: params.customerName,
    depositAmount: params.depositAmount ?? 50,
  }));
  const recipients = [params.to, params.parentEmail].filter(Boolean) as string[];
  await sendEmail(recipients, 'Your deposit is confirmed — book your storage now!', html);
}

// ── User: order confirmed ────────────────────────────────────────────────────

export async function sendOrderConfirmedUser(params: {
  to: string;
  parentEmail?: string | null;
  customerName: string;
  bookingId: string;
  school: string;
  dorm: string;
  moveOutDate: string;
  moveOutTime: string;
  moveInDate: string;
  boxQuantity: number;
  monthlyTotal: number;
  additionalItems?: string;
  paymentPlan?: 'full' | 'monthly';
  totalPrice?: number;
  month1Amount?: number;
  month2Amount?: number;
  month2Date?: string;
  month3Amount?: number;
  month3Date?: string;
}) {
  const html = await render(OrderConfirmedUserEmail(params));
  const recipients = [params.to, params.parentEmail].filter(Boolean) as string[];
  const subject = params.paymentPlan === 'monthly'
    ? '📦 Booking confirmed — your payment plan is set'
    : '📦 Your NoTime Storage booking is confirmed';
  await sendEmail(recipients, subject, html);
}

// ── Admin: deposit paid ──────────────────────────────────────────────────────

export async function sendDepositPaidAdmin(params: {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  school: string;
  depositAmount?: number;
  userId?: string;
  paidAt?: string;
}) {
  const to = adminNotifyTo();
  if (!to) return;
  const html = await render(DepositPaidAdminEmail(params));
  await sendEmail(
    to,
    `💰 Deposit received — ${params.customerName} (${params.school})`,
    html,
  );
}

// ── Admin: new booking ───────────────────────────────────────────────────────

export async function sendNewBookingAdmin(params: {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  bookingId: string;
  school: string;
  dorm: string;
  room?: string;
  moveOutDate: string;
  moveOutTime: string;
  moveInDate: string;
  boxQuantity: number;
  monthlyTotal: number;
  elevator: boolean;
  stairs: boolean;
  additionalItems?: string;
  specialInstructions?: string;
  paymentPlan?: 'full' | 'monthly';
  totalPrice?: number;
  month1Amount?: number;
  month2Amount?: number;
  month2Date?: string;
  month3Amount?: number;
  month3Date?: string;
}) {
  const to = adminNotifyTo();
  if (!to) return;
  const html = await render(NewBookingAdminEmail(params));
  await sendEmail(
    to,
    `📦 New booking — ${params.customerName} · ${params.moveOutDate} · ${params.school}`,
    html,
  );
}

export async function sendMoveInDetailsUpdatedAdmin(params: {
  studentName: string;
  studentEmail: string;
  bookingId: string;
  moveInDate: string;
  school: string;
  moveInDorm: string;
  moveInRoom: string;
  specialInstructions: string;
}) {
  const to = adminNotifyTo();
  if (!to) return;
  const { studentName, studentEmail, bookingId, moveInDate, school, moveInDorm, moveInRoom, specialInstructions } = params;
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1a1a1a">
      ${emailInlineLogoHeaderHtml()}
      <h2 style="color:#4B2E25;margin-bottom:4px">📍 Move-In Details Updated</h2>
      <p style="color:#666;margin-top:0;margin-bottom:24px">A student has confirmed their delivery address.</p>
      <table style="width:100%;border-collapse:collapse;font-size:0.9rem">
        <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#666;width:140px">Student</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-weight:600">${studentName}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#666">Email</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb">${studentEmail}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#666">Move-In Date</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-weight:600">${moveInDate}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#666">School</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb">${school}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#666">Delivery Dorm</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-weight:600;color:#4B2E25">${moveInDorm || '—'}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#666">Room</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb">${moveInRoom || '—'}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Instructions</td><td style="padding:8px 0">${specialInstructions || 'None'}</td></tr>
      </table>
      <p style="margin-top:24px;font-size:0.8rem;color:#999">Booking ID: ${bookingId}</p>
    </div>
  `;
  await sendEmail(
    to,
    `📍 Move-in details updated — ${studentName} · ${moveInDate}`,
    html,
  );
}

export async function sendMoveInReminderUser({
  to,
  parentEmail,
  customerName,
  moveInDate,
  school,
  currentDorm,
}: {
  to: string;
  parentEmail?: string | null;
  customerName: string;
  moveInDate: string;
  school: string;
  currentDorm?: string;
}) {
  const html = await render(
    MoveInReminderUserEmail({ customerName, moveInDate, school, currentDorm, dashboardUrl: 'https://notimestorage.co/dashboard' })
  );
  const recipients = [to, parentEmail].filter(Boolean) as string[];
  await sendEmail(
    recipients,
    `📦 Confirm your move-in delivery dorm — NoTime Storage`,
    html,
  );
}

/** Notify business inbox when someone uses /contact (same destination as booking alerts, else admin@). */
export async function sendContactFormAdminNotification(params: {
  name: string;
  email: string;
  subject: string;
  subject_other?: string | null;
  message: string;
}) {
  const notifyTo = adminNotifyTo();
  if (!notifyTo) return;

  const subj =
    params.subject_other?.trim() && params.subject === 'Other'
      ? `${params.subject}: ${params.subject_other.trim()}`
      : params.subject;

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1a1a1a">
      ${emailInlineLogoHeaderHtml()}
      <h2 style="color:#4B2E25;margin-bottom:4px">📬 New contact form</h2>
      <p style="color:#666;margin-top:0;margin-bottom:24px">Someone submitted the website contact form.</p>
      <table style="width:100%;border-collapse:collapse;font-size:0.9rem">
        <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#666;width:140px">Name</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-weight:600">${escapeHtml(params.name)}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#666">Email</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb"><a href="mailto:${params.email.trim().replace(/[\s<>"']/g, '')}">${escapeHtml(params.email)}</a></td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#666">Subject</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb">${escapeHtml(subj)}</td></tr>
      </table>
      <p style="margin-top:20px;margin-bottom:8px;font-weight:600;color:#4B2E25">Message</p>
      <div style="white-space:pre-wrap;border:1px solid #e5e7eb;border-radius:8px;padding:16px;background:#fafafa;font-size:0.9rem;line-height:1.5">${escapeHtml(params.message)}</div>
      <p style="margin-top:24px;font-size:0.8rem;color:#999">Reply in your mail client goes to the sender&apos;s address.</p>
    </div>
  `;

  await sendEmail(
    notifyTo,
    `📬 Contact: ${subj.slice(0, 60)}${subj.length > 60 ? '…' : ''} — ${params.name}`,
    html,
    params.email.trim(),
  );
}
