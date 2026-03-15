'use server';

import { squareClient, squareConfig } from './client';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { randomUUID } from 'crypto';

export type ChargeBookingResult =
  | { success: true; paymentId: string }
  | { success: false; error: string };

/**
 * Charge the full storage total for a booking using a Square payment token.
 * Updates bookings.payment_status = 'paid' and inserts a full_payment record.
 * The Supabase trigger then sets users.full_payment_paid = true automatically.
 */
export type BillingAddress = {
  addressLine1: string;
  city: string;
  state?: string;
  postalCode: string;
  country?: string;
};

export async function chargeBookingPayment(
  sourceId: string,
  bookingId: string,
  amountCents: number,
  verificationToken?: string,
  billingAddress?: BillingAddress,
): Promise<ChargeBookingResult> {
  // Auth check via anon client (reads session cookie)
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return { success: false, error: 'Not logged in.' };

  // All DB operations via admin client (bypasses RLS — safe in server actions only)
  const supabase = createAdminClient();

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, user_id, total_price, payment_status')
    .eq('id', bookingId)
    .single();

  if (!booking) return { success: false, error: 'Booking not found.' };
  if (booking.payment_status === 'paid') return { success: false, error: 'Booking already paid.' };

  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .or(`id.eq.${user.id},auth_id.eq.${user.id}`)
    .limit(1)
    .single();

  if (!profile || booking.user_id !== profile.id) {
    return { success: false, error: 'Unauthorized.' };
  }

  try {
    const { payment, errors } = await squareClient.payments.create({
      sourceId,
      idempotencyKey: randomUUID(),
      amountMoney: {
        amount: BigInt(amountCents),
        currency: 'USD',
      },
      locationId: squareConfig.locationId!,
      note: `NoTime Storage – booking ${bookingId}`,
      ...(verificationToken ? { verificationToken } : {}),
      ...(billingAddress?.addressLine1 && billingAddress?.city && billingAddress?.postalCode
        ? {
            billingAddress: {
              addressLine1: billingAddress.addressLine1,
              locality: billingAddress.city,
              administrativeDistrictLevel1: billingAddress.state ?? undefined,
              postalCode: billingAddress.postalCode,
              country: (billingAddress.country ?? 'US') as 'US',
            },
          }
        : {}),
    });

    if (errors?.length || !payment?.id) {
      return { success: false, error: errors?.[0]?.detail ?? 'Payment failed. Please try again.' };
    }

    const now = new Date().toISOString();

    const { error: updateErr } = await supabase
      .from('bookings')
      .update({ payment_status: 'paid', status: 'confirmed', paid_at: now, updated_at: now })
      .eq('id', bookingId);

    if (updateErr) {
      console.error('[chargeBookingPayment] booking update failed:', updateErr);
    }

    const { error: paymentErr } = await supabase.from('payments').insert({
      booking_id: bookingId,
      amount: booking.total_price,
      payment_type: 'full_payment',
      square_payment_id: payment.id,
      status: 'succeeded',
    });

    if (paymentErr) {
      console.error('[chargeBookingPayment] payments insert failed:', paymentErr);
    }

    return { success: true, paymentId: payment.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected payment error.';
    console.error('[chargeBookingPayment] Square error:', err);
    return { success: false, error: msg };
  }
}
