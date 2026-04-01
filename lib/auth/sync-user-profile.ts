import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Upsert public.users for this auth user using the service role so RLS never blocks
 * the first insert after signup/login. Only call after the session is verified (e.g. getUser()).
 */
export async function syncUserProfile(
  authUserId: string,
  email: string,
  metadata: Record<string, unknown>
) {
  const full_name = (metadata?.full_name as string)?.trim() || null;
  const phone = (metadata?.phone as string)?.trim() || null;
  const school = (metadata?.school as string)?.trim() || null;
  const parent_email = (metadata?.parent_email as string)?.trim() || null;

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .or(`id.eq.${authUserId},auth_id.eq.${authUserId}`)
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from('users')
      .update({
        full_name: full_name ?? undefined,
        email: email || undefined,
        phone: phone ?? undefined,
        school: school ?? undefined,
        parent_email: parent_email ?? undefined,
      })
      .eq('id', existing.id);
    if (error) {
      console.error('[syncUserProfile] update failed:', error.message);
    }
  } else {
    const { error } = await supabase.from('users').insert({
      id: authUserId,
      auth_id: authUserId,
      full_name: full_name ?? undefined,
      email: email || undefined,
      phone: phone ?? undefined,
      school: school ?? undefined,
      parent_email: parent_email ?? undefined,
    });
    if (error) {
      console.error('[syncUserProfile] insert failed:', error.message);
    }
  }
}
