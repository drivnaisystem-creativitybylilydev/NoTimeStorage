'use client';

import { useEffect, useState } from 'react';

/** iPhone / iPod / iPad (Safari-style Apple Pay availability). */
function isAppleTouchDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  if (/iPhone|iPod|iPad/.test(ua)) return true;
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true;
  return false;
}

/**
 * Collapsible tip before redirect to Stripe Checkout: Apple Pay is primary;
 * card fields on Stripe’s page are for non–Apple Pay cards only.
 */
export function StripeIosCheckoutHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(isAppleTouchDevice());
  }, []);

  if (!show) return null;

  return (
    <details
      style={{
        marginBottom: '14px',
        padding: '12px 14px',
        background: 'rgba(59, 130, 246, 0.08)',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        borderRadius: '12px',
        fontSize: '0.85rem',
        color: '#1e3a5f',
        lineHeight: 1.55,
      }}
    >
      <summary
        style={{
          cursor: 'pointer',
          fontWeight: 700,
          listStylePosition: 'outside',
          color: 'var(--color-coffee)',
        }}
      >
        On iPhone: Apple Pay first — card form is optional
      </summary>
      <p style={{ margin: '10px 0 0', padding: 0 }}>
        The next screen is Stripe&apos;s secure checkout. If you see{' '}
        <strong>Apple Pay</strong>, use that — you don&apos;t need to type card numbers. Only use the card section if
        you&apos;re paying with a physical card that isn&apos;t in Apple Pay.
      </p>
    </details>
  );
}
