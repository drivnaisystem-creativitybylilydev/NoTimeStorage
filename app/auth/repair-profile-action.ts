'use server';

import { createClient } from '@/lib/supabase/server';
import { ensureProfileRowForUser } from '@/lib/auth/ensure-profile';

/** Self-service: creates missing public.users row for the current session (same as auto-heal). */
export async function repairMyProfile(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not signed in.' };

  await ensureProfileRowForUser(user);
  return { ok: true };
}
