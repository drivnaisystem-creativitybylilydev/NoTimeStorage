'use server';

import { createClient } from '@/lib/supabase/server';
import { syncUserProfile } from '@/lib/auth/sync-user-profile';

/**
 * Run after browser-side PKCE exchange so cookies are visible to the server.
 * Retries briefly — iOS can lag one tick before Set-Cookie is visible to RSC/actions.
 */
export async function finalizeAuthCallback() {
  const supabase = await createClient();

  for (let attempt = 0; attempt < 5; attempt++) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (user && !error) {
      await syncUserProfile(
        supabase,
        user.id,
        user.email ?? '',
        user.user_metadata ?? {}
      );
      return { ok: true as const };
    }
    if (attempt < 4) {
      await new Promise((r) => setTimeout(r, 100 * (attempt + 1)));
    }
  }

  console.warn('[finalizeAuthCallback] no user after exchange');
  return { ok: false as const };
}
