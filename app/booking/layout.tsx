import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Server layout that gates the entire /booking/* flow behind:
 * 1. Authentication
 * 2. Paid $50 deposit
 *
 * The /booking/confirmed page is exempt from the deposit gate
 * (user has already paid by the time they reach it).
 */
export default async function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login?redirect=/booking/configure');

  const { data: profile } = await supabase
    .from('users')
    .select('deposit_paid')
    .or(`id.eq.${user.id},auth_id.eq.${user.id}`)
    .limit(1)
    .single();

  if (!profile?.deposit_paid) redirect('/deposit');

  return <>{children}</>;
}
