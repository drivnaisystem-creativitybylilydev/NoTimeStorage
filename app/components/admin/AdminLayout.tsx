'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-paper)', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <header className="header">
        <div className="header-container">
          <Link href="/" className="header-logo">
            <Image
              src="/brand/notime-storage-logo.png"
              alt="NoTime Storage"
              width={40}
              height={40}
              className="header-logo-image"
            />
            <span className="header-logo-text">NoTime Storage Admin</span>
          </Link>

          <nav className="header-nav">
            <Link href="/dashboard">Student Dashboard</Link>
            <Link href="/admin/dashboard">Admin Overview</Link>
            <Link href="/admin/bookings">Bookings</Link>
          </nav>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <aside
          style={{
            width: '260px',
            padding: '32px 24px',
            borderRight: '1px solid var(--color-latte-soft)',
            background: 'var(--color-white)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.95rem' }}>
            <Link
              href="/admin/dashboard"
              style={{
                color: pathname === '/admin/dashboard' ? 'var(--color-coffee)' : 'var(--color-gray-700)',
                fontWeight: pathname === '/admin/dashboard' ? 600 : 400,
              }}
            >
              Overview
            </Link>
            <Link
              href="/admin/bookings"
              style={{
                color: pathname?.startsWith('/admin/bookings') ? 'var(--color-coffee)' : 'var(--color-gray-700)',
                fontWeight: pathname?.startsWith('/admin/bookings') ? 600 : 400,
              }}
            >
              Bookings
            </Link>
            <span style={{ marginTop: '16px', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-gray-500)', letterSpacing: '0.08em' }}>
              Coming soon
            </span>
            <span style={{ color: 'var(--color-gray-500)', fontSize: '0.9rem' }}>Customers</span>
            <span style={{ color: 'var(--color-gray-500)', fontSize: '0.9rem' }}>Calendar</span>
            <span style={{ color: 'var(--color-gray-500)', fontSize: '0.9rem' }}>Analytics</span>
            <span style={{ color: 'var(--color-gray-500)', fontSize: '0.9rem' }}>Settings</span>
          </nav>
        </aside>

        {/* Main content */}
        <main
          style={{
            flex: 1,
            padding: '40px 48px',
            maxWidth: '1200px',
            margin: '0 auto',
            width: '100%',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

