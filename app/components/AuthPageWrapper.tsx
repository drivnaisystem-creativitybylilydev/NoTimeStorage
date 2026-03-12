'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const AUTH_PAGE_CLASS = 'auth-page-active';

/**
 * Wraps auth/form pages with background image, overlay, and vignette.
 * Renders via portal to document.body so it bypasses layout wrappers (body padding,
 * stacking contexts) and covers the full viewport. Background is behind, form in front.
 * Adds auth-page-active to html/body so CSS can remove top padding.
 */
export function AuthPageWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.documentElement.classList.add(AUTH_PAGE_CLASS);
    document.body.classList.add(AUTH_PAGE_CLASS);
    return () => {
      document.documentElement.classList.remove(AUTH_PAGE_CLASS);
      document.body.classList.remove(AUTH_PAGE_CLASS);
    };
  }, []);

  const content = (
    <div className="auth-container">
      <div className="auth-bg-layer" aria-hidden="true" />
      <div className="auth-content-layer">
        {children}
      </div>
    </div>
  );

  if (!mounted || typeof document === 'undefined') {
    return content;
  }

  return createPortal(content, document.body);
}
