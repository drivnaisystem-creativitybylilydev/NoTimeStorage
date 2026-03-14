'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/admin/bookings',   label: 'Bookings' },
  { href: '/admin/customers',  label: 'Customers' },
  { href: '/admin/calendar',   label: 'Calendar' },
  { href: '/admin/analytics',  label: 'Analytics' },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-paper)', display: 'flex', flexDirection: 'column' }}>
      {/* Header: logo + title above nav */}
      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 24px 12px',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            textDecoration: 'none',
          }}
        >
          <Image
            src="/brand/notime-storage-logo.png"
            alt="NoTime Storage"
            width={56}
            height={56}
          />
          <span
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              fontStyle: 'italic',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              color: '#4B2E25',
              textShadow:
                '0 0 20px rgba(201, 164, 126, 0.6), 0 0 40px rgba(201, 164, 126, 0.35), 0 2px 4px rgba(75, 46, 37, 0.15)',
            }}
          >
            No Time Storage Admin
          </span>
        </Link>

        {/* Floating pill nav */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            background: '#4B2E25',
            borderRadius: '9999px',
            padding: '6px 8px',
            boxShadow: '0 4px 24px rgba(75, 46, 37, 0.35), 0 2px 8px rgba(75, 46, 37, 0.2)',
          }}
        >
          {navItems.map(({ href, label }) => {
            const isActive = pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  padding: '10px 20px',
                  borderRadius: '9999px',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#4B2E25' : 'rgba(255, 248, 240, 0.9)',
                  background: isActive ? '#C9A47E' : 'transparent',
                  textDecoration: 'none',
                  transition: 'background 0.2s ease, color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(201, 164, 126, 0.25)';
                    (e.currentTarget as HTMLElement).style.color = '#FFF8F0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'rgba(255, 248, 240, 0.9)';
                  }
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          padding: '16px 64px 40px',
          maxWidth: '1400px',
          width: '100%',
          margin: '0 auto',
          minWidth: 0,
        }}
      >
        {children}
      </main>
    </div>
  );
}
