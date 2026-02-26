'use server';

import { render } from '@react-email/components';
import { DepositConfirmedUserEmail } from '@/emails/deposit-confirmed-user';
import { OrderConfirmedUserEmail } from '@/emails/order-confirmed-user';
import { DepositPaidAdminEmail } from '@/emails/deposit-paid-admin';
import { NewBookingAdminEmail } from '@/emails/new-booking-admin';

const FROM = 'NoTime Storage <noreply@notimestorage.co>';
const ADMIN_EMAIL = process.env.BOOKING_NOTIFY_EMAIL || '';

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey || !to) {
    console.warn('[email] Skipped — missing RESEND_API_KEY or recipient');
    return;
  }
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) console.error('[email] Send error:', error);
    else console.log('[email] Sent to', to, '–', subject);
  } catch (err) {
    console.error('[email] Exception:', err);
  }
}

// ── User: deposit confirmed ──────────────────────────────────────────────────

export async function sendDepositConfirmedUser(params: {
  to: string;
  customerName: string;
  depositAmount?: number;
}) {
  const html = await render(DepositConfirmedUserEmail({
    customerName: params.customerName,
    depositAmount: params.depositAmount ?? 50,
  }));
  await sendEmail(params.to, 'Your deposit is confirmed — book your storage now!', html);
}

// ── User: order confirmed ────────────────────────────────────────────────────

export async function sendOrderConfirmedUser(params: {
  to: string;
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
}) {
  const html = await render(OrderConfirmedUserEmail(params));
  await sendEmail(params.to, '📦 Your NoTime Storage booking is confirmed', html);
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
  if (!ADMIN_EMAIL) return;
  const html = await render(DepositPaidAdminEmail(params));
  await sendEmail(
    ADMIN_EMAIL,
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
}) {
  if (!ADMIN_EMAIL) return;
  const html = await render(NewBookingAdminEmail(params));
  await sendEmail(
    ADMIN_EMAIL,
    `📦 New booking — ${params.customerName} · ${params.moveOutDate} · ${params.school}`,
    html,
  );
}
