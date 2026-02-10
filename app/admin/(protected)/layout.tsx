import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin'); // custom admin login
  }

  // Check if user exists in admin_users table
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('role')
    .eq('auth_user_id', user.id)
    .limit(1)
    .single();

  if (!adminUser) {
    redirect('/admin'); // not an admin user
  }

  return <>{children}</>;
}

