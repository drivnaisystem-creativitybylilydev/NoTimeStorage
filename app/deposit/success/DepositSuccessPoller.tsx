'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Client-side poll that simply refreshes the server component every ~2s until
 * `users.deposit_paid` flips true (at which point the server will redirect to
 * /booking/configure). After 30s we give up — user can keep their tab open or
 * close it; the webhook will still finish and email them.
 */
export function DepositSuccessPoller() {
  const router = useRouter();

  useEffect(() => {
    const started = Date.now();
    const interval = setInterval(() => {
      if (Date.now() - started > 30_000) {
        clearInterval(interval);
        return;
      }
      router.refresh();
    }, 2_000);
    return () => clearInterval(interval);
  }, [router]);

  return null;
}
