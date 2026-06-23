'use client';

/**
 * Render-less probe that loads Supabase and reports the current user id (or null).
 * Lives in its own file so it can be pulled in via `next/dynamic({ ssr: false })`
 * — that is the boundary Turbopack actually splits at, so the Supabase client
 * (~200 KB raw) is no longer in the homepage's initial JS bundle.
 */

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

type Props = {
  onResolved: (userId: string | null) => void;
};

export default function SupabaseUserProbe({ onResolved }: Props) {
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    void supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!cancelled) onResolved(data.user?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) onResolved(null);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) onResolved(session?.user?.id ?? null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [onResolved]);

  return null;
}
