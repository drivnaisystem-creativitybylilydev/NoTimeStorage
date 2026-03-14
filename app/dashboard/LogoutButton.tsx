'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function LogoutButton() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await supabase.auth.signOut();
    router.push('/auth/login');
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      style={{
        display: 'block',
        width: '100%',
        padding: '12px',
        marginTop: '32px',
        background: 'transparent',
        border: '2px solid var(--color-latte)',
        borderRadius: '10px',
        color: 'var(--color-gray-600)',
        fontSize: '0.95rem',
        fontWeight: '600',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
        transition: 'border-color 0.2s, color 0.2s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = '#c0392b';
        (e.currentTarget as HTMLButtonElement).style.color = '#c0392b';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-latte)';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-gray-600)';
      }}
    >
      {loading ? 'Signing out…' : 'Sign Out'}
    </button>
  );
}
