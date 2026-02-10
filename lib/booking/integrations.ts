/**
 * Integration hooks for booking events.
 * Google Calendar + Airtable run here when a booking is created (or confirmed).
 * Uses customer-friendly data: name, email, phone, dates, dorm, etc.
 */

import { createClient } from '@/lib/supabase/server';
import type { BookingWithItems } from './types';

/** Customer info resolved from public.users for integrations */
export type BookingWithCustomer = BookingWithItems & {
  customer?: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  };
};

async function getBookingWithCustomer(booking: BookingWithItems): Promise<BookingWithCustomer> {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase
      .from('users')
      .select('full_name, email, phone')
      .eq('id', booking.user_id)
      .single();
    return {
      ...booking,
      customer: user
        ? {
            full_name: user.full_name ?? null,
            email: user.email ?? null,
            phone: user.phone ?? null,
          }
        : undefined,
    };
  } catch {
    return { ...booking };
  }
}

/** Format time slot for display (e.g. "14:00" → "2:00 PM") */
function formatTimeSlot(s: string): string {
  if (!s) return '';
  const match = s.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    const h = parseInt(match[1], 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${match[2]} ${ampm}`;
  }
  return s;
}

/** Format date for display (e.g. "2026-05-15" → "May 15, 2026") */
function formatDate(d: string): string {
  try {
    return new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return d;
  }
}

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

// ---- New booking email (Resend) ----

/** Send one email to the configured recipient when a booking is created. Recipient = BOOKING_NOTIFY_EMAIL. */
async function sendNewBookingEmail(b: BookingWithCustomer): Promise<void> {
  let to = process.env.BOOKING_NOTIFY_EMAIL?.trim() || '';
  const apiKey = process.env.RESEND_API_KEY?.trim() || '';
  if (!to && apiKey && process.env.NODE_ENV === 'development') {
    to = 'delivered@resend.dev';
  }
  if (process.env.NODE_ENV === 'development') {
    console.log('[integrations] sendNewBookingEmail: to=', to || '(empty)', 'apiKey set=', !!apiKey);
  }
  if (!to || !apiKey) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[integrations] New-booking email skipped – missing:', !to ? 'BOOKING_NOTIFY_EMAIL' : 'RESEND_API_KEY');
    }
    return;
  }

  const customerName = b.customer?.full_name || b.customer?.email || 'Customer';
  const moveOutFormatted = formatDate(b.move_out_date);
  const moveOutTime = formatTimeSlot(b.move_out_time_slot);
  const moveInFormatted = formatDate(b.move_in_date);
  const access = b.elevator_available ? 'Elevator' : 'Stairs';
  const itemsSummary =
    b.items && b.items.length > 0
      ? b.items.map((i) => `${i.quantity}× ${i.item_type.replace(/_/g, ' ')}`).join(', ')
      : '—';

  const subject = `New booking – ${moveOutFormatted} ${moveOutTime} – ${customerName}, ${b.dorm || '—'}`;
  const html = `
    <h2>New NoTime Storage booking</h2>
    <p><strong>Customer:</strong> ${customerName}</p>
    <p><strong>Email:</strong> ${b.customer?.email ?? '—'}</p>
    <p><strong>Phone:</strong> ${b.customer?.phone ?? '—'}</p>
    <p><strong>Move-out:</strong> ${moveOutFormatted} at ${moveOutTime}</p>
    <p><strong>Move-in:</strong> ${moveInFormatted}</p>
    <p><strong>Dorm:</strong> ${b.dorm ?? '—'}</p>
    <p><strong>Access:</strong> ${access}</p>
    <p><strong>School:</strong> ${b.school ?? '—'}</p>
    <p><strong>Items:</strong> ${itemsSummary}</p>
    <p><strong>Booking ID:</strong> ${b.id}</p>
  `.replace(/\n\s+/g, '\n').trim();

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    const from = process.env.RESEND_FROM_EMAIL || 'NoTime Storage <onboarding@resend.dev>';
    if (process.env.NODE_ENV === 'development') {
      console.log('[integrations] Calling Resend API: from=', from, 'to=', to);
    }
    const { data, error } = await resend.emails.send({ from, to, subject, html });
    if (error) {
      console.error('[integrations] New-booking email error –', typeof error === 'object' ? JSON.stringify(error) : error);
      if (process.env.NODE_ENV === 'development' && from.includes('onboarding@resend.dev')) {
        console.error('[integrations] Tip: onboarding@resend.dev can only send TO Resend test addresses (e.g. delivered@resend.dev).');
      }
    } else if (process.env.NODE_ENV === 'development') {
      console.log('[integrations] New-booking email sent to', to, '– Booking ID:', b.id, data?.id ? `(Resend id: ${data.id})` : '');
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[integrations] New-booking email error (exception) –', message);
  }
}

// ---- Public hooks ----

export async function onBookingCreated(booking: BookingWithItems): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.log('[integrations] onBookingCreated called – booking id:', booking.id);
  }
  const withCustomer = await getBookingWithCustomer(booking);
  await sendNewBookingEmail(withCustomer);
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
