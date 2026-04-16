import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ensureProfileRowForUser } from '@/lib/auth/ensure-profile';
import { getVenmoHandleFromEnv } from '@/lib/payment/venmo';
import { DepositForm } from './DepositForm';

export default async function DepositPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login?redirect=/deposit');

  await ensureProfileRowForUser(user);

  const { data: profile } = await supabase
    .from('users')
    .select('deposit_paid, full_name')
    .or(`id.eq.${user.id},auth_id.eq.${user.id}`)
    .limit(1)
    .maybeSingle();

  if (profile?.deposit_paid) redirect('/booking/configure');

  const venmoHandle = getVenmoHandleFromEnv();

  return (
    <DepositForm
      customerName={profile?.full_name ?? ''}
      venmoHandle={venmoHandle}
    />
  );
}
