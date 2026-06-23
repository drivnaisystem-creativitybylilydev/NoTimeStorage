'use client';

/**
 * Auth-aware CTA used across the public marketing page.
 *
 * SSR + first paint always render the "logged-out" button — correct for the
 * overwhelming majority of marketing visitors. The Supabase user check is
 * deferred until the browser is idle and the Supabase client itself is loaded
 * via `next/dynamic({ ssr: false })`, so its ~200 KB of JS is no longer in the
 * homepage's initial JS bundle (Turbopack does not code-split plain
 * `await import()` calls; `next/dynamic` is the boundary it respects).
 */

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const SupabaseUserProbe = dynamic(
  () => import('@/app/components/SupabaseUserProbe'),
  { ssr: false }
);

type Props = {
  unauthHref: string;
  authHref: string;
  unauthLabel: string;
  authLabel: string;
  buttonClassName?: string;
  wrapperClassName?: string;
  /** Use a plain <a> instead of next/link (preserves the existing hero behaviour). */
  useAnchor?: boolean;
};

// Module-level cache so multiple <AuthAwareCta /> instances on the same page
// share the same auth result and we only load Supabase once.
let cachedUserId: string | null | undefined;
const subscribers = new Set<(id: string | null) => void>();

function publish(userId: string | null) {
  cachedUserId = userId;
  subscribers.forEach((cb) => cb(userId));
}

export default function AuthAwareCta({
  unauthHref,
  authHref,
  unauthLabel,
  authLabel,
  buttonClassName = 'button-primary',
  wrapperClassName,
  useAnchor = false,
}: Props) {
  const [isAuthed, setIsAuthed] = useState<boolean>(() => !!cachedUserId);
  const [shouldProbe, setShouldProbe] = useState(false);

  // Subscribe to shared auth updates so a single Supabase load updates every CTA.
  useEffect(() => {
    const cb = (id: string | null) => setIsAuthed(!!id);
    subscribers.add(cb);
    return () => {
      subscribers.delete(cb);
    };
  }, []);

  // Trigger the dynamic Supabase chunk to load only after the browser is idle
  // — and only once across the page.
  useEffect(() => {
    if (cachedUserId !== undefined) return;

    let cancelled = false;
    const arm = () => {
      if (!cancelled) setShouldProbe(true);
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const handle = window.requestIdleCallback(arm, { timeout: 1500 });
      return () => {
        cancelled = true;
        if (typeof cancelIdleCallback !== 'undefined') cancelIdleCallback(handle);
      };
    }
    const t = setTimeout(arm, 600);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  const handleResolved = useCallback((id: string | null) => publish(id), []);

  const href = isAuthed ? authHref : unauthHref;
  const label = isAuthed ? authLabel : unauthLabel;
  const button = (
    <button className={buttonClassName} type="button">
      {label}
    </button>
  );

  const wrapped = useAnchor ? (
    <a href={href} className={wrapperClassName}>
      {button}
    </a>
  ) : (
    <Link href={href} className={wrapperClassName}>
      {button}
    </Link>
  );

  return (
    <>
      {wrapped}
      {shouldProbe && cachedUserId === undefined ? (
        <SupabaseUserProbe onResolved={handleResolved} />
      ) : null}
    </>
  );
}
