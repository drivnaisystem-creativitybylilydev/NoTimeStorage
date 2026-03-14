'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { randomUUID } from 'crypto';

export type MonthlyChargeResult =
  | { success: true; customerId: string; cardId: string; paymentId: string }
  | { success: false; error: string };

export type MonthlyScheduleResult =
  | { success: true; invoiceId: string }
  | { success: false; error: string };

/**
 * Charges the first monthly installment.
 * Creates a Square Customer + Card on File from the payment token,
 * then charges month 1 using the saved card ID.
 */
export async function chargeFirstMonthPayment(
  sourceId: string,
  bookingId: string,
  month1Cents: number,
): Promise<MonthlyChargeResult> {
  const { squareClient, squareConfig } = await import('@/lib/square/client');

  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return { success: false, error: 'Not logged in.' };

  const supabase = createAdminClient();

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, user_id, payment_status')
    .eq('id', bookingId)
    .single();

  if (!booking) return { success: false, error: 'Booking not found.' };
  if (booking.payment_status === 'paid') return { success: false, error: 'Booking already paid.' };

  const { data: profile } = await supabase
    .from('users')
    .select('id, email, full_name')
    .or(`id.eq.${user.id},auth_id.eq.${user.id}`)
    .limit(1)
    .single();

  if (!profile || booking.user_id !== profile.id) {
    return { success: false, error: 'Unauthorized.' };
  }

  const email: string = (profile as any).email ?? user.email ?? '';
  const name: string = (profile as any).full_name ?? '';

  // Find or create Square Customer
  let customerId: string;
  try {
    const searchResponse = await squareClient.customers.search({
      query: { filter: { emailAddress: { exact: email } } },
    });
    const existing = searchResponse.customers;
    if (existing?.length) {
      customerId = existing[0].id!;
    } else {
      const nameParts = name.trim().split(' ');
      const createResponse = await squareClient.customers.create({
        idempotencyKey: randomUUID(),
        emailAddress: email || undefined,
        givenName: nameParts[0] || undefined,
        familyName: nameParts.slice(1).join(' ') || undefined,
      });
      if (!createResponse.customer?.id) {
        const detail = createResponse.errors?.[0]?.detail ?? 'Failed to create Square customer.';
        return { success: false, error: detail };
      }
      customerId = createResponse.customer.id;
    }
  } catch (err) {
    return { success: false, error: `Customer creation failed: ${err instanceof Error ? err.message : String(err)}` };
  }

  // Save card on file from the payment token
  let cardId: string;
  try {
    const cardResponse = await squareClient.cards.create({
      idempotencyKey: randomUUID(),
      sourceId,
      card: { customerId },
    });
    if (!cardResponse.card?.id) {
      const detail = cardResponse.errors?.[0]?.detail ?? 'Failed to save card on file.';
      return { success: false, error: detail };
    }
    cardId = cardResponse.card.id;
  } catch (err) {
    return { success: false, error: `Card save failed: ${err instanceof Error ? err.message : String(err)}` };
  }

  // Charge month 1 using saved card ID
  try {
    const { payment, errors } = await squareClient.payments.create({
      sourceId: cardId,
      idempotencyKey: randomUUID(),
      amountMoney: { amount: BigInt(month1Cents), currency: 'USD' },
      locationId: squareConfig.locationId!,
      customerId,
      note: `NoTime Storage – booking ${bookingId} (installment 1 of 3)`,
    });

    if (errors?.length || !payment?.id) {
      return { success: false, error: errors?.[0]?.detail ?? 'Payment failed. Please try again.' };
    }

    const now = new Date().toISOString();

    const { error: bookingUpdateErr } = await supabase.from('bookings').update({
      payment_status: 'partial',
      status: 'confirmed',
      payment_plan: 'monthly',
      square_customer_id: customerId,
      square_card_id: cardId,
      monthly_payments_remaining: 2,
      paid_at: now,
      updated_at: now,
    }).eq('id', bookingId);

    if (bookingUpdateErr) {
      console.error('[chargeFirstMonthPayment] booking update failed:', JSON.stringify(bookingUpdateErr));
    }

    const { error: paymentInsertErr } = await supabase.from('payments').insert({
      booking_id: bookingId,
      amount: month1Cents / 100,
      payment_type: 'monthly_installment_1',
      square_payment_id: payment.id,
      status: 'succeeded',
    });

    if (paymentInsertErr) {
      console.error('[chargeFirstMonthPayment] payments insert failed:', JSON.stringify(paymentInsertErr));
    }

    console.log('[chargeFirstMonthPayment] success — bookingId:', bookingId, 'customerId:', customerId, 'paymentId:', payment.id);
    return { success: true, customerId, cardId, paymentId: payment.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unexpected payment error.' };
  }
}

/**
 * Creates a Square Order + Invoice for months 2 and 3,
 * then saves the invoice ID and next payment date to the booking.
 */
export async function createMonthlyPaymentSchedule(params: {
  bookingId: string;
  customerId: string;
  cardId: string;
  month2Cents: number;
  month2Date: string;
  month3Cents: number;
  month3Date: string;
}): Promise<MonthlyScheduleResult> {
  const { bookingId, customerId, cardId, month2Cents, month2Date, month3Cents, month3Date } = params;
  const { squareClient, squareConfig } = await import('@/lib/square/client');

  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return { success: false, error: 'Not logged in.' };

  const supabase = createAdminClient();

  // Helper to create a single BALANCE invoice for one installment
  const createAndPublishInvoice = async (
    installmentNum: number,
    amountCents: number,
    dueDate: string,
  ): Promise<string> => {
    const orderResp = await squareClient.orders.create({
      order: {
        locationId: squareConfig.locationId!,
        customerId,
        referenceId: bookingId,
        lineItems: [{
          name: `NoTime Storage – Installment ${installmentNum} of 3`,
          quantity: '1',
          basePriceMoney: { amount: BigInt(amountCents), currency: 'USD' },
        }],
      },
      idempotencyKey: randomUUID(),
    });

    if (!orderResp.order?.id) {
      const detail = orderResp.errors?.[0]?.detail ?? 'Failed to create order.';
      throw new Error(detail);
    }
    console.log(`[createMonthlyPaymentSchedule] order ${installmentNum} created:`, orderResp.order.id);

    const invoiceResp = await squareClient.invoices.create({
      invoice: {
        locationId: squareConfig.locationId!,
        orderId: orderResp.order.id,
        primaryRecipient: { customerId },
        title: `NoTime Storage – Booking ${bookingId} (Installment ${installmentNum}/3)`,
        deliveryMethod: 'EMAIL',
        acceptedPaymentMethods: { card: true },
        paymentRequests: [{
          requestType: 'BALANCE',
          dueDate,
          automaticPaymentSource: 'CARD_ON_FILE',
          cardId,
        }],
      },
      idempotencyKey: randomUUID(),
    });

    if (!invoiceResp.invoice?.id) {
      const detail = invoiceResp.errors?.[0]?.detail ?? 'Failed to create invoice.';
      throw new Error(detail);
    }

    const publishResp = await squareClient.invoices.publish({
      invoiceId: invoiceResp.invoice.id,
      version: invoiceResp.invoice.version ?? 0,
      idempotencyKey: randomUUID(),
    });

    if (!publishResp.invoice?.id) {
      const detail = publishResp.errors?.[0]?.detail ?? 'Failed to publish invoice.';
      throw new Error(detail);
    }

    console.log(`[createMonthlyPaymentSchedule] invoice ${installmentNum} published:`, publishResp.invoice.id);
    return publishResp.invoice.id;
  };

  try {
    const invoice2Id = await createAndPublishInvoice(2, month2Cents, month2Date);
    const invoice3Id = await createAndPublishInvoice(3, month3Cents, month3Date);

    await supabase.from('bookings').update({
      square_invoice_id: invoice2Id,
      next_payment_date: month2Date,
      monthly_payment_amount: month2Cents / 100,
      updated_at: new Date().toISOString(),
    }).eq('id', bookingId);

    console.log('[createMonthlyPaymentSchedule] success — invoice2:', invoice2Id, 'invoice3:', invoice3Id);
    return { success: true, invoiceId: invoice2Id };
  } catch (err) {
    console.error('[createMonthlyPaymentSchedule] error:', err instanceof Error ? err.message : JSON.stringify(err));
    return { success: false, error: err instanceof Error ? err.message : 'Unknown invoice error.' };
  }
}
