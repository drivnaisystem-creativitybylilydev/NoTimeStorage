/**
 * Integration hooks for booking events.
 * Google Calendar + Airtable run here when a booking is created (or confirmed).
 * Uses customer-friendly data: name, email, phone, dates, dorm, etc.
 */

import { createClient } from '@/lib/supabase/server';
import type { BookingWithItems } from './types';
import { calculateMonthlyBreakdown, isEligibleForMonthlyPlan } from '@/lib/payment-plan-calculator';

/** Customer info resolved from public.users for integrations */
export type BookingWithCustomer = BookingWithItems & {
  customer?: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    parent_email?: string | null;
  };
};

async function getBookingWithCustomer(booking: BookingWithItems): Promise<BookingWithCustomer> {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase
      .from('users')
      .select('full_name, email, phone, parent_email')
      .eq('id', booking.user_id)
      .single();
    return {
      ...booking,
      customer: user
        ? {
            full_name: user.full_name ?? null,
            email: user.email ?? null,
            phone: user.phone ?? null,
            parent_email: user.parent_email ?? null,
          }
        : undefined,
    };
  } catch {
    return { ...booking };
  }
}

/** Format time slot for display (e.g. "14:00" → "2:00 PM") */
function formatTimeSlot(s: string): string { return formatTimeET(s); }

import { formatDateShort, formatTime as formatTimeET } from '@/lib/utils/date';
function formatDate(d: string): string { return formatDateShort(d); }

// ---- Google Calendar ----

async function syncToGoogleCalendar(b: BookingWithCustomer): Promise<void> {
  const credentialsJson = process.env.GOOGLE_CALENDAR_CREDENTIALS_JSON;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!credentialsJson || !calendarId) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[integrations] Google Calendar skipped (missing GOOGLE_CALENDAR_CREDENTIALS_JSON or GOOGLE_CALENDAR_ID)');
    }
    return;
  }

  try {
    const credentials = JSON.parse(credentialsJson) as {
      client_email?: string;
      private_key?: string;
    };
    if (!credentials.client_email || !credentials.private_key) {
      console.warn('[integrations] Google Calendar: invalid credentials shape');
      return;
    }

    const { google } = await import('googleapis');
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/calendar.events'],
    });
    const calendar = google.calendar({ version: 'v3', auth });

    const customerName = b.customer?.full_name || b.customer?.email || 'Customer';
    const contact = [b.customer?.email, b.customer?.phone].filter(Boolean).join(' · ') || '—';
    const access = b.elevator_available ? 'Elevator' : 'Stairs';
    const details = `Contact: ${contact}\nDorm: ${b.dorm}\nAccess: ${access}\nSchool: ${b.school}\nBooking ID: ${b.id}`;

    // Pickup event (move-out)
    const moveOutStart = new Date(`${b.move_out_date}T${b.move_out_time_slot || '09:00'}:00`);
    const moveOutEnd = new Date(moveOutStart);
    moveOutEnd.setMinutes(moveOutEnd.getMinutes() + 60);
    await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: `NoTime Storage – Pickup: ${customerName}`,
        description: `Student storage pickup.\n\n${details}`,
        start: { dateTime: moveOutStart.toISOString(), timeZone: 'America/New_York' },
        end: { dateTime: moveOutEnd.toISOString(), timeZone: 'America/New_York' },
      },
    });

    // Delivery event (move-in) – all-day or morning
    const moveInStart = new Date(`${b.move_in_date}T09:00:00`);
    const moveInEnd = new Date(moveInStart);
    moveInEnd.setHours(moveInEnd.getHours() + 2);
    await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: `NoTime Storage – Delivery: ${customerName}`,
        description: `Student storage delivery.\n\n${details}`,
        start: { dateTime: moveInStart.toISOString(), timeZone: 'America/New_York' },
        end: { dateTime: moveInEnd.toISOString(), timeZone: 'America/New_York' },
      },
    });
  } catch (err) {
    console.error('[integrations] Google Calendar error', err);
  }
}

// ---- Airtable ----

async function syncToAirtable(b: BookingWithCustomer): Promise<void> {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME || 'Bookings';
  if (!apiKey || !baseId) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[integrations] Airtable skipped (missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID)');
    }
    return;
  }

  try {
    const baseIdEncoded = encodeURIComponent(baseId);
    const tableEncoded = encodeURIComponent(tableName);
    const url = `https://api.airtable.com/v0/${baseIdEncoded}/${tableEncoded}`;

    const itemsSummary =
      b.items && b.items.length > 0
        ? b.items.map((i) => `${i.quantity}× ${i.item_type.replace(/_/g, ' ')}`).join(', ')
        : '—';

    const fields: Record<string, string | number | boolean> = {
      // Customer-friendly labels (match these to your Airtable field names)
      'Customer Name': b.customer?.full_name ?? '',
      Email: b.customer?.email ?? '',
      Phone: b.customer?.phone ?? '',
      'Move-out Date': formatDate(b.move_out_date),
      'Move-out Time': formatTimeSlot(b.move_out_time_slot),
      'Move-in Date': formatDate(b.move_in_date),
      Dorm: b.dorm ?? '',
      'Elevator?': !!b.elevator_available,
      'Stairs?': !!b.stairs_required,
      School: b.school ?? '',
      'Items Summary': itemsSummary,
      Status: b.status ?? 'pending',
      'Booking ID': b.id,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[integrations] Airtable error', res.status, text);
    }
  } catch (err) {
    console.error('[integrations] Airtable error', err);
  }
}

// ---- New booking emails (Resend — branded templates) ----

async function sendNewBookingEmail(b: BookingWithCustomer, opts?: { skipCustomer?: boolean }): Promise<void> {
  const { sendNewBookingAdmin, sendOrderConfirmedUser } = await import('@/lib/email/send');

  const customerName = b.customer?.full_name || b.customer?.email || 'Customer';
  const customerEmail = b.customer?.email || '';
  const moveOutFormatted = formatDate(b.move_out_date);
  const moveOutTime = formatTimeSlot(b.move_out_time_slot);
  const moveInFormatted = formatDate(b.move_in_date);
  const boxItem = b.items?.find((i) => i.item_type === 'box');
  const boxQty = boxItem?.quantity ?? 1;
  const additionalItems = b.items
    ?.filter((i) => i.item_type !== 'box')
    .map((i) => `${i.quantity}× ${i.item_type.replace(/_/g, ' ')}`)
    .join(', ') || '';
  const monthlyTotal = typeof b.total_monthly_rate === 'number'
    ? b.total_monthly_rate
    : parseFloat(String(b.total_monthly_rate || 0));

  const isMonthly = b.payment_plan === 'monthly';
  const totalPriceNum = typeof b.total_price === 'number' ? b.total_price : parseFloat(String(b.total_price || 0));
  const totalPriceCents = Math.round(totalPriceNum * 100);
  const breakdown = isMonthly && isEligibleForMonthlyPlan(Math.round((totalPriceNum - 50) * 100))
    ? calculateMonthlyBreakdown(totalPriceCents)
    : null;

  const paymentParams = breakdown
    ? {
        paymentPlan: 'monthly' as const,
        totalPrice: totalPriceNum,
        month1Amount: breakdown.month1Cents,
        month2Amount: breakdown.month2Cents,
        month2Date: breakdown.month2Date,
        month3Amount: breakdown.month3Cents,
        month3Date: breakdown.month3Date,
      }
    : { paymentPlan: 'full' as const, totalPrice: totalPriceNum };

  const sharedParams = {
    customerName,
    bookingId: b.id,
    school: b.school ?? '—',
    dorm: b.dorm ?? '—',
    moveOutDate: moveOutFormatted,
    moveOutTime,
    moveInDate: moveInFormatted,
    boxQuantity: boxQty,
    monthlyTotal,
    additionalItems,
    specialInstructions: b.special_instructions ?? '',
    elevator: b.elevator_available ?? false,
    stairs: b.stairs_required ?? false,
    ...paymentParams,
  };

  // Email to admin
  await sendNewBookingAdmin({
    ...sharedParams,
    customerEmail,
    customerPhone: b.customer?.phone ?? '—',
  });

  // Confirmation email to user (+ parent if provided)
  // In the Venmo-only flow we skip this on creation because the booking is
  // unpaid at that moment — the customer would receive a "confirmed" email
  // before they've actually paid. We send it from `markBookingPaid` instead.
  if (!opts?.skipCustomer && customerEmail) {
    await sendOrderConfirmedUser({
      ...sharedParams,
      to: customerEmail,
      parentEmail: b.customer?.parent_email ?? undefined,
    });
  }
}

/** Sends only the customer-facing order-confirmed email.
 *  Called from `markBookingPaid` after admin verifies a manual Venmo payment.
 */
export async function sendBookingConfirmationToCustomer(booking: BookingWithItems): Promise<void> {
  const { sendOrderConfirmedUser } = await import('@/lib/email/send');
  const withCustomer = await getBookingWithCustomer(booking);
  const customerEmail = withCustomer.customer?.email || '';
  if (!customerEmail) return;

  const customerName = withCustomer.customer?.full_name || customerEmail || 'Customer';
  const moveOutFormatted = formatDate(withCustomer.move_out_date);
  const moveOutTime = formatTimeSlot(withCustomer.move_out_time_slot);
  const moveInFormatted = formatDate(withCustomer.move_in_date);
  const boxItem = withCustomer.items?.find((i) => i.item_type === 'box');
  const boxQty = boxItem?.quantity ?? 1;
  const additionalItems = withCustomer.items
    ?.filter((i) => i.item_type !== 'box')
    .map((i) => `${i.quantity}× ${i.item_type.replace(/_/g, ' ')}`)
    .join(', ') || '';
  const monthlyTotal = typeof withCustomer.total_monthly_rate === 'number'
    ? withCustomer.total_monthly_rate
    : parseFloat(String(withCustomer.total_monthly_rate || 0));
  const totalPriceNum = typeof withCustomer.total_price === 'number'
    ? withCustomer.total_price
    : parseFloat(String(withCustomer.total_price || 0));

  await sendOrderConfirmedUser({
    to: customerEmail,
    parentEmail: withCustomer.customer?.parent_email ?? undefined,
    customerName,
    bookingId: withCustomer.id,
    school: withCustomer.school ?? '—',
    dorm: withCustomer.dorm ?? '—',
    moveOutDate: moveOutFormatted,
    moveOutTime,
    moveInDate: moveInFormatted,
    boxQuantity: boxQty,
    monthlyTotal,
    additionalItems,
    paymentPlan: 'full',
    totalPrice: totalPriceNum,
  });
}

// ---- Public hooks ----

export async function onBookingCreated(
  booking: BookingWithItems,
  opts?: { isPaid?: boolean },
): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.log('[integrations] onBookingCreated called – booking id:', booking.id, 'isPaid:', opts?.isPaid);
  }
  const withCustomer = await getBookingWithCustomer(booking);
  // Skip the "confirmed" customer email when the booking is not yet paid
  // (Venmo-only flow). Admin email still fires so the team knows to collect.
  await sendNewBookingEmail(withCustomer, { skipCustomer: opts?.isPaid === false });
  await Promise.all([syncToGoogleCalendar(withCustomer), syncToAirtable(withCustomer)]);
  if (process.env.NODE_ENV === 'development') {
    console.log('[integrations] onBookingCreated', booking.id, withCustomer.customer?.full_name);
  }
}

export async function onBookingConfirmed(booking: BookingWithItems): Promise<void> {
  await updateAirtableStatus(booking.id, 'confirmed');
  if (process.env.NODE_ENV === 'development') {
    console.log('[integrations] onBookingConfirmed', booking.id);
  }
}

/** Update the Status field of an existing Airtable record by Booking ID */
async function updateAirtableStatus(bookingId: string, status: string): Promise<void> {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME || 'Bookings';
  if (!apiKey || !baseId) return;

  try {
    const baseIdEncoded = encodeURIComponent(baseId);
    const tableEncoded = encodeURIComponent(tableName);
    const listUrl = `https://api.airtable.com/v0/${baseIdEncoded}/${tableEncoded}?filterByFormula=${encodeURIComponent(`{Booking ID}="${bookingId}"`)}&maxRecords=1`;
    const listRes = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!listRes.ok) return;
    const listData = (await listRes.json()) as { records?: { id: string }[] };
    const recordId = listData.records?.[0]?.id;
    if (!recordId) return;

    const patchUrl = `https://api.airtable.com/v0/${baseIdEncoded}/${tableEncoded}/${recordId}`;
    await fetch(patchUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields: { Status: status } }),
    });
  } catch (err) {
    console.error('[integrations] Airtable update status error', err);
  }
}
