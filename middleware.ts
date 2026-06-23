import { type NextRequest } from 'next/server'
import { updateSession } from './lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones below.
     *
     * Public marketing routes (`/`, `/contact`, `/privacy`, `/terms`,
     * `/robots.txt`, `/sitemap.xml`, `/monitoring`) are excluded so we don't pay
     * the Supabase auth-refresh round-trip on every page view for anonymous
     * visitors. Auth-gated areas (`/admin/*`, `/booking/*`, `/dashboard/*`,
     * `/deposit/*`, `/auth/*`, `/api/*`) still go through the middleware.
     *
     * The leading `$|` in the lookahead matches the bare `/` path (homepage)
     * so the root is also skipped.
     */
    '/((?!$|_next/static|_next/image|favicon.ico|monitoring|robots\\.txt|sitemap\\.xml|contact$|privacy$|terms$|\\.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
