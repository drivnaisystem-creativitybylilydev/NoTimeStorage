import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DepositForm } from './DepositForm';

export default async function DepositPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/signup?redirect=/deposit');

  const { data: profile } = await supabase
    .from('users')
    .select('deposit_paid, full_name')
    .or(`id.eq.${user.id},auth_id.eq.${user.id}`)
    .limit(1)
    .single();

  // Already paid — send straight to booking
  if (profile?.deposit_paid) redirect('/booking/configure');

  const isSandbox = process.env.SQUARE_ENV !== 'production';
  const appId = (isSandbox ? process.env.SQUARE_SANDBOX_APPLICATION_ID : process.env.SQUARE_APPLICATION_ID) ?? '';
  const locationId = (isSandbox ? process.env.SQUARE_SANDBOX_LOCATION_ID : process.env.SQUARE_LOCATION_ID) ?? '';

  return (
    <DepositForm
      applicationId={appId}
      locationId={locationId}
      isSandbox={isSandbox}
      customerName={profile?.full_name ?? ''}
    />
  );
}
