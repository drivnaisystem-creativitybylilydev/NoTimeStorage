import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { syncUserProfile } from '@/lib/auth/sync-user-profile';

/**
 * If the session user has no public.users row yet, create it (service-role upsert).
 * Safe to call on every dashboard/deposit/booking load — skips work when row exists.
 */
export async function ensureProfileRowForUser(user: User): Promise<void> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from('users')
    .select('id')
    .or(`id.eq.${user.id},auth_id.eq.${user.id}`)
    .maybeSingle();

  if (row) return;

  await syncUserProfile(user.id, user.email ?? '', user.user_metadata ?? {});
}
