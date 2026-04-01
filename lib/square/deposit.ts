'use server';

import { squareClient, squareConfig } from './client';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { randomUUID } from 'crypto';
import { sendDepositConfirmedUser, sendDepositPaidAdmin } from '@/lib/email/send';
import { ensureProfileRowForUser } from '@/lib/auth/ensure-profile';

export type DepositResult =
  | { success: true; paymentId: string }
  | { success: false; error: string };

/**
 * Charge the $50 deposit using a Square payment token (nonce) from the
 * Web Payments SDK on the frontend. Marks the user as deposit_paid in
 * Supabase and fires confirmation emails.
 */
export type BillingAddress = {
  addressLine1: string;
  city: string;
  state?: string;
  postalCode: string;
  country?: string;
};

export async function chargeDeposit(
  sourceId: string,
  verificationToken?: string,
  billingAddress?: BillingAddress,
): Promise<DepositResult> {
  // Auth check via anon client
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return { success: false, error: 'Not logged in.' };

  await ensureProfileRowForUser(user);

  // DB reads/writes via admin client (bypasses RLS)
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from('users')
    .select('id, full_name, email, phone, school, deposit_paid, parent_email')
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
        amount: BigInt(5000), // $50.00 deposit
        currency: 'USD',
      },
      locationId: squareConfig.locationId!,
      note: `NoTime Storage – $50 deposit (${profile.email ?? user.email})`,
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
      const errDetail = errors?.[0]?.detail ?? 'Payment failed. Please try again.';
      return { success: false, error: errDetail };
    }

    // Mark deposit paid — admin client guarantees the write succeeds regardless of RLS
    const { error: updateError } = await supabase
      .from('users')
      .update({ deposit_paid: true })
      .or(`id.eq.${profile.id},auth_id.eq.${user.id}`);

    if (updateError) {
      console.error('[chargeDeposit] Supabase update failed:', updateError);
    }

    const customerName = profile.full_name ?? user.email ?? 'Student';
    const customerEmail = profile.email ?? user.email ?? '';

    sendDepositConfirmedUser({
      to: customerEmail,
      parentEmail: profile.parent_email ?? undefined,
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
