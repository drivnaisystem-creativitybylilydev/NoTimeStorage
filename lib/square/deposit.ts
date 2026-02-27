'use server';

import { squareClient, squareConfig } from './client';
import { createClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';
import { sendDepositConfirmedUser, sendDepositPaidAdmin } from '@/lib/email/send';

export type DepositResult =
  | { success: true; paymentId: string }
  | { success: false; error: string };

/**
 * Charge the $50 deposit using a Square payment token (nonce) from the
 * Web Payments SDK on the frontend. Marks the user as deposit_paid in
 * Supabase and fires confirmation emails.
 */
export async function chargeDeposit(sourceId: string): Promise<DepositResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not logged in.' };

  const { data: profile } = await supabase
    .from('users')
    .select('id, full_name, email, phone, school, deposit_paid')
    .or(`id.eq.${user.id},auth_id.eq.${user.id}`)
    .limit(1)
    .single();

  if (!profile) return { success: false, error: 'Account not found.' };
  if (profile.deposit_paid) return { success: false, error: 'Deposit already paid.' };

  try {
    const { payment, errors } = await squareClient.payments.create({
      sourceId,
      idempotencyKey: randomUUID(),
      amountMoney: {
        amount: BigInt(5000), // $50.00
        currency: 'USD',
      },
      locationId: squareConfig.locationId!,
      note: `NoTime Storage – $50 deposit (${profile.email ?? user.email})`,
    });

    if (errors?.length || !payment?.id) {
      const errDetail = errors?.[0]?.detail ?? 'Payment failed. Please try again.';
      return { success: false, error: errDetail };
    }

    // Mark deposit paid in Supabase
    await supabase
      .from('users')
      .update({ deposit_paid: true })
      .eq('id', profile.id);

    const customerName = profile.full_name ?? user.email ?? 'Student';
    const customerEmail = profile.email ?? user.email ?? '';

    sendDepositConfirmedUser({
      to: customerEmail,
      customerName,
      depositAmount: 50,
    }).catch(console.error);

    sendDepositPaidAdmin({
      customerName,
      customerEmail,
      customerPhone: profile.phone ?? undefined,
      school: profile.school ?? 'Unknown',
      depositAmount: 50,
      userId: profile.id,
    }).catch(console.error);

    return { success: true, paymentId: payment.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected payment error.';
    console.error('[chargeDeposit] Square error:', err);
    return { success: false, error: msg };
  }
}

/**
 * Returns whether the current user has paid their deposit.
 * Used by server components / layouts to gate the booking flow.
 */
export async function getDepositStatus(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('users')
    .select('deposit_paid')
    .or(`id.eq.${user.id},auth_id.eq.${user.id}`)
    .limit(1)
    .single();

  return profile?.deposit_paid === true;
}
