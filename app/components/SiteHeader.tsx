'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';

// Loaded only on idle — keeps Supabase out of the marketing pages' initial JS bundle.
const SupabaseUserProbe = dynamic(
  () => import('@/app/components/SupabaseUserProbe'),
  { ssr: false }
);

export function SiteHeader() {
  // SSR + first paint render the logged-out header (correct for the vast majority
  // of marketing visitors). After idle we lazy-load Supabase and upgrade the CTAs
  // if a session is present.
  const [isAuthed, setIsAuthed] = useState(false);
  const [shouldProbe, setShouldProbe] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
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

  return (
    <>
      <header className="header">
        <div className="header-container">
          <Link href="/" className="header-logo">
            <Image
              src="/brand/notime-storage-logo.png"
              alt="NoTime Storage Logo"
              width={50}
              height={50}
              className="header-logo-image"
              priority
            />
            <span className="header-logo-text">NoTime Storage</span>
          </Link>
          <nav className="header-nav">
            <Link href="/#how-it-works">How It Works</Link>
            <Link href="/#box-specifications">Box Specifications</Link>
            <Link href="/#pricing">Pricing</Link>
            <Link href="/#faq">FAQ</Link>
            <Link href="/contact">Contact</Link>
            {isAuthed ? (
              <>
                <Link href="/booking/configure" className="header-cta">Book Storage</Link>
                <Link href="/dashboard" className="header-login">Dashboard</Link>
              </>
            ) : (
              <>
                <Link href="/auth/signup" className="header-cta">Get Started</Link>
                <Link href="/auth/login" className="header-login">Login</Link>
              </>
            )}
          </nav>
          <a href="https://www.instagram.com/notimestorage/" target="_blank" rel="noopener noreferrer" className="header-social" aria-label="Follow us on Instagram">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="currentColor"/>
            </svg>
          </a>
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
        <Link href="/#how-it-works" onClick={() => setMobileNavOpen(false)}>How It Works</Link>
        <Link href="/#box-specifications" onClick={() => setMobileNavOpen(false)}>Box Specifications</Link>
        <Link href="/#pricing" onClick={() => setMobileNavOpen(false)}>Pricing</Link>
        <Link href="/#faq" onClick={() => setMobileNavOpen(false)}>FAQ</Link>
        <Link href="/contact" onClick={() => setMobileNavOpen(false)}>Contact</Link>
        {isAuthed ? (
          <>
            <Link href="/dashboard" onClick={() => setMobileNavOpen(false)}>Dashboard</Link>
            <Link href="/booking/configure" className="mobile-nav-cta" onClick={() => setMobileNavOpen(false)}>Book Storage</Link>
          </>
        ) : (
          <>
            <Link href="/auth/login" onClick={() => setMobileNavOpen(false)}>Login</Link>
            <Link href="/auth/signup" className="mobile-nav-cta" onClick={() => setMobileNavOpen(false)}>Get Started</Link>
          </>
        )}
      </div>
      {shouldProbe ? (
        <SupabaseUserProbe onResolved={(id) => setIsAuthed(!!id)} />
      ) : null}
    </>
  );
}
