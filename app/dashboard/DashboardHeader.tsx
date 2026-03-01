'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface DashboardHeaderProps {
  depositPaid: boolean;
}

export function DashboardHeader({ depositPaid }: DashboardHeaderProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <>
      <header className="header">
        <div className="header-container">
          <Link href="/" className="header-logo">
            <Image
              src="/brand/notime-storage-logo.png"
              alt="NoTime Storage"
              width={50}
              height={50}
              className="header-logo-image"
            />
            <span className="header-logo-text">NoTime Storage</span>
          </Link>

          <nav className="header-nav">
            <Link href="/">Home</Link>
            <Link href="/#pricing">Pricing</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href={depositPaid ? '/booking/configure' : '/deposit'} className="header-cta">
              Book Storage
            </Link>
          </nav>

          <form action="/auth/signout" method="post" style={{ margin: 0 }} className="header-signout-form">
            <button
              type="submit"
              className="header-login"
              style={{ cursor: 'pointer' }}
            >
              Sign Out
            </button>
          </form>

          <button
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
      </header>

      <div className={`mobile-nav-drawer${mobileNavOpen ? ' open' : ''}`}>
        <Link href="/" onClick={() => setMobileNavOpen(false)}>Home</Link>
        <Link href="/#pricing" onClick={() => setMobileNavOpen(false)}>Pricing</Link>
        <Link href="/dashboard" onClick={() => setMobileNavOpen(false)}>Dashboard</Link>
        <Link
          href={depositPaid ? '/booking/configure' : '/deposit'}
          className="mobile-nav-cta"
          onClick={() => setMobileNavOpen(false)}
        >
          Book Storage
        </Link>
        <form action="/auth/signout" method="post" style={{ margin: 0 }}>
          <button type="submit" style={{
            width: '100%', textAlign: 'left', background: 'none', border: 'none',
            color: 'var(--color-latte-soft)', fontSize: 'var(--font-size-lg)',
            fontWeight: '600', padding: 'var(--spacing-sm) 0',
            borderTop: '1px solid rgba(201, 164, 126, 0.2)', cursor: 'pointer',
          }}>
            Sign Out
          </button>
        </form>
      </div>
    </>
  );
}
