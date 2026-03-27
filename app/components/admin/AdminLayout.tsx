'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const navItems = [
  { href: '/admin/bookings', label: 'Bookings' },
  { href: '/admin/customers', label: 'Customers' },
  { href: '/admin/calendar', label: 'Calendar' },
  { href: '/admin/analytics', label: 'Analytics' },
];

const pillBase = {
  padding: '10px 20px',
  borderRadius: '9999px',
  fontSize: '0.9rem',
  textDecoration: 'none' as const,
  transition: 'background 0.2s ease, color 0.2s ease',
};

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  return (
    <div className="admin-shell">
      {/* Desktop: centered logo + pill nav (unchanged layout) */}
      <header className="admin-header-desktop">
        <Link href="/" className="admin-header-brand-link">
          <Image src="/brand/notime-storage-logo.png" alt="NoTime Storage" width={56} height={56} />
          <span className="admin-header-brand-title">No Time Storage Admin</span>
        </Link>

        <nav className="admin-nav-pills">
          {navItems.map(({ href, label }) => {
            const isActive = pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="admin-nav-pill"
                data-active={isActive ? 'true' : undefined}
                style={{
                  ...pillBase,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#4B2E25' : 'rgba(255, 248, 240, 0.9)',
                  background: isActive ? '#C9A47E' : 'transparent',
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

      {/* Mobile / tablet: sticky bar + hamburger (homepage-style) */}
      <header className="admin-header-mobile header">
        <div className="admin-header-mobile-inner">
          <Link href="/" className="header-logo admin-header-mobile-logo" onClick={() => setMobileNavOpen(false)}>
            <Image
              src="/brand/notime-storage-logo.png"
              alt="NoTime Storage"
              width={44}
              height={44}
              className="header-logo-image"
            />
            <span className="header-logo-text admin-header-mobile-title">Admin</span>
          </Link>
          <div className="admin-header-mobile-actions">
            <Link href="/" className="admin-header-site-link" onClick={() => setMobileNavOpen(false)}>
              Site
            </Link>
            <button
              type="button"
              className={`hamburger-btn${mobileNavOpen ? ' open' : ''}`}
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              aria-label="Toggle navigation"
              aria-expanded={mobileNavOpen}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <div
        className={`admin-mobile-drawer${mobileNavOpen ? ' open' : ''}`}
        aria-hidden={!mobileNavOpen}
      >
        {navItems.map(({ href, label }) => (
          <Link key={href} href={href} onClick={() => setMobileNavOpen(false)}>
            {label}
          </Link>
        ))}
        <Link href="/" onClick={() => setMobileNavOpen(false)}>
          Back to website
        </Link>
      </div>

      {mobileNavOpen && (
        <button
          type="button"
          className="admin-mobile-drawer-backdrop"
          aria-label="Close menu"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <main className="admin-layout-main">{children}</main>
    </div>
  );
}
