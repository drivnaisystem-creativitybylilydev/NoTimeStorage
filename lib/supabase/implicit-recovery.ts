import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Use **only** for `resetPasswordForEmail`.
 * Implicit flow does not send `code_challenge`; Supabase emails redirect with tokens in the
 * URL **hash**, so any browser/app can complete recovery (no PKCE cookie coupling).
 */
export function createRecoveryEmailClient() {
  if (typeof window === 'undefined') {
    throw new Error('createRecoveryEmailClient must run in the browser');
  }
  return createClient(url, key, {
    auth: {
      flowType: 'implicit',
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Parse `#access_token=…&type=recovery` **before** the app’s PKCE `createBrowserClient` runs.
 * PKCE clients reject implicit callback URLs; this client accepts them, then you migrate
 * the session with `main.auth.setSession({ access_token, refresh_token })`.
 */
export function createImplicitRedirectClient() {
  return createClient(url, key, {
    auth: {
      flowType: 'implicit',
      persistSession: false,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}
