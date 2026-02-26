'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutList, Users, Calendar, BarChart2, Settings } from 'lucide-react';

const navItems = [
  { href: '/admin/bookings',   label: 'Bookings',  icon: LayoutList },
  { href: '/admin/customers',  label: 'Customers', icon: Users },
  { href: '/admin/calendar',   label: 'Calendar',  icon: Calendar },
  { href: '/admin/analytics',  label: 'Analytics', icon: BarChart2 },
];

const comingSoonItems = [
  { label: 'Settings', icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-gray-50)', display: 'flex', flexDirection: 'column' }}>
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
            <Link href="/admin/bookings"  style={{ fontWeight: pathname?.startsWith('/admin/bookings')  ? 700 : undefined }}>Bookings</Link>
            <Link href="/admin/customers" style={{ fontWeight: pathname?.startsWith('/admin/customers') ? 700 : undefined }}>Customers</Link>
            <Link href="/admin/calendar"  style={{ fontWeight: pathname?.startsWith('/admin/calendar')  ? 700 : undefined }}>Calendar</Link>
            <Link href="/admin/analytics" style={{ fontWeight: pathname?.startsWith('/admin/analytics') ? 700 : undefined }}>Analytics</Link>
          </nav>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <aside
          style={{
            width: '240px',
            flexShrink: 0,
            padding: '40px 20px',
            borderRight: '1px solid var(--color-latte-soft)',
            background: 'var(--color-white)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-gray-400)', marginBottom: '12px', paddingLeft: '12px' }}>
            Navigation
          </div>

          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--color-coffee)' : 'var(--color-gray-700)',
                  background: isActive ? 'var(--color-latte-soft)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'background 0.15s ease, color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'var(--color-paper)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }
                }}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}

          <div style={{ margin: '20px 0 12px', borderTop: '1px solid var(--color-latte-soft)' }} />

          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-gray-400)', marginBottom: '8px', paddingLeft: '12px' }}>
            Coming Soon
          </div>

          {comingSoonItems.map(({ label, icon: Icon }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                color: 'var(--color-gray-400)',
                cursor: 'not-allowed',
                userSelect: 'none',
              }}
            >
              <Icon size={16} />
              {label}
            </div>
          ))}
        </aside>

        {/* Main content */}
        <main
          style={{
            flex: 1,
            padding: '80px 96px',
            maxWidth: '1400px',
            width: '100%',
            background: 'var(--color-gray-50)',
            minWidth: 0,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
