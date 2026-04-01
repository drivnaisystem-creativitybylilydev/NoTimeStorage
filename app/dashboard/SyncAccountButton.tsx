'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { repairMyProfile } from '@/app/auth/repair-profile-action';

export function SyncAccountButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div style={{ marginTop: '12px' }}>
      <button
        type="button"
        onClick={async () => {
          setMsg(null);
          setBusy(true);
          const r = await repairMyProfile();
          setBusy(false);
          if (r.ok) {
            setMsg('Account synced. Refreshing…');
            router.refresh();
          } else {
            setMsg(r.error);
          }
        }}
        disabled={busy}
        style={{
          padding: '8px 14px',
          fontSize: '0.8125rem',
          borderRadius: '8px',
          border: '1px solid var(--color-latte)',
          background: 'white',
          color: 'var(--color-coffee)',
          cursor: busy ? 'wait' : 'pointer',
          fontWeight: 600,
        }}
      >
        {busy ? 'Syncing…' : 'Sync my account'}
      </button>
      {msg && (
        <p style={{ marginTop: '8px', fontSize: '0.8125rem', color: 'var(--color-gray-600)' }}>{msg}</p>
      )}
      <p style={{ marginTop: '6px', fontSize: '0.75rem', color: 'var(--color-gray-500)', maxWidth: '420px', lineHeight: 1.45 }}>
        If something looks wrong after signing up, this reconnects your login to your student profile. Usually you won&apos;t need it.
      </p>
    </div>
  );
}
