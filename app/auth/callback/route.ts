import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Same-origin path only — prevents open redirects */
function sanitizeNext(next: string | null): string {
  if (!next) return '/dashboard';
  const path = next.trim().split('?')[0];
  if (!path.startsWith('/') || path.startsWith('//')) return '/dashboard';
  if (path.includes('..')) return '/dashboard';
  if (!/^\/[a-zA-Z0-9/_-]+$/.test(path)) return '/dashboard';
  return path;
}

/** Sync auth user (full_name, email, phone) into public.users so admin and bookings show correct customer details. */
async function syncUserProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
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
      console.warn('[auth/callback] syncUserProfile insert skipped:', error.message);
    }
  }
}

/**
 * PKCE email links (signup confirm, password reset) should land here with ?code=...
 * so exchange runs on the server and session cookies are set reliably (especially for password reset).
 *
 * ?next=/path — where to send the user after success (default /dashboard).
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const nextPath = sanitizeNext(requestUrl.searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[auth/callback] exchangeCodeForSession:', error.message);
      return NextResponse.redirect(new URL('/auth/login?error=auth', request.url));
    }

    if (session?.user) {
      await syncUserProfile(
        supabase,
        session.user.id,
        session.user.email ?? '',
        session.user.user_metadata ?? {}
      );
    }

    return NextResponse.redirect(new URL(nextPath, request.url));
  }

  return NextResponse.redirect(new URL('/dashboard', request.url));
}
