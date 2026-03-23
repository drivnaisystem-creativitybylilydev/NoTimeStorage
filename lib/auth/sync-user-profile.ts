import type { SupabaseClient } from '@supabase/supabase-js';

/** Sync auth user (full_name, email, phone) into public.users so admin and bookings show correct customer details. */
export async function syncUserProfile(
  supabase: SupabaseClient,
  authUserId: string,
  email: string,
  metadata: Record<string, unknown>
) {
  const full_name = (metadata?.full_name as string)?.trim() || null;
  const phone = (metadata?.phone as string)?.trim() || null;
  const school = (metadata?.school as string)?.trim() || null;
  const parent_email = (metadata?.parent_email as string)?.trim() || null;

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .or(`id.eq.${authUserId},auth_id.eq.${authUserId}`)
    .limit(1)
    .single();

  if (existing?.id) {
    await supabase
      .from('users')
      .update({
        full_name: full_name ?? undefined,
        email: email || undefined,
        phone: phone ?? undefined,
        school: school ?? undefined,
        parent_email: parent_email ?? undefined,
      })
      .eq('id', existing.id);
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
      console.warn('[syncUserProfile] insert skipped:', error.message);
    }
  }
}
