import { createClient } from '@supabase/supabase-js';

/**
 * One-time Supabase magic link that signs the user in and lands on `nextPath` via /auth/callback.
 * Requires SUPABASE_SERVICE_ROLE_KEY. Returns null on failure (caller should use a normal login URL).
 *
 * Ensure Supabase → Auth → URL configuration allows redirect:
 *   `{SITE_URL}/auth/callback` (query params are usually allowed with the same path).
 */
export async function tryMagicLinkToPath(
  email: string,
  nextPath: string,
): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !serviceKey) return null;

  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    'https://notimestorage.co';

  const redirectTo = `${site}/auth/callback?next=${encodeURIComponent(nextPath)}`;

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: email.trim(),
    options: { redirectTo },
  });

  if (error) {
    console.error('[tryMagicLinkToPath]', error.message);
    return null;
  }

  const link = data?.properties?.action_link;
  return typeof link === 'string' && link.length > 0 ? link : null;
}
