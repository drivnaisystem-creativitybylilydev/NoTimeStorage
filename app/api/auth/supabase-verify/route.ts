import { NextRequest, NextResponse } from 'next/server';

/**
 * Some mail apps strip query params from links (e.g. `apikey`) when opening `*.supabase.co`
 * directly, which shows raw JSON: "No API key found in request".
 *
 * This route lives on our domain with a short query string; the server adds `apikey` and
 * redirects to GoTrue verify. Use only for action types that cannot use /auth/confirm + verifyOtp.
 */
function isAllowedRedirectTo(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    const h = u.hostname.toLowerCase();
    if (h === 'localhost' || h === '127.0.0.1') return true;
    if (h === 'notimestorage.co' || h === 'www.notimestorage.co') return true;
    if (h.endsWith('.vercel.app')) return true;
    return false;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')?.trim();
  const type = request.nextUrl.searchParams.get('type')?.trim();
  const redirect_to = request.nextUrl.searchParams.get('redirect_to')?.trim();

  if (!token || !type || !redirect_to) {
    return NextResponse.redirect(new URL('/auth/login?error=auth', request.url), 307);
  }

  if (!isAllowedRedirectTo(redirect_to)) {
    return NextResponse.redirect(new URL('/auth/login?error=auth', request.url), 307);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!supabaseUrl || !anonKey) {
    return NextResponse.redirect(new URL('/auth/login?error=auth', request.url), 307);
  }

  const target = new URL(`${supabaseUrl}/auth/v1/verify`);
  target.searchParams.set('token', token);
  target.searchParams.set('type', type);
  target.searchParams.set('redirect_to', redirect_to);
  target.searchParams.set('apikey', anonKey);

  return NextResponse.redirect(target.toString(), 307);
}
