'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { chargeDeposit } from '@/lib/square/deposit';

interface DepositFormProps {
  applicationId: string;
  locationId: string;
  isSandbox: boolean;
  customerName: string;
}

export function DepositForm({ applicationId, locationId, isSandbox, customerName }: DepositFormProps) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const paymentsRef = useRef<any>(null);
  const cardInstanceRef = useRef<any>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    const scriptSrc = isSandbox
      ? 'https://sandbox.web.squarecdn.com/v1/square.js'
      : 'https://web.squarecdn.com/v1/square.js';

    const existing = document.querySelector(`script[src="${scriptSrc}"]`);
    if (existing) {
      initSquare();
      return;
    }

    const script = document.createElement('script');
    script.src = scriptSrc;
    script.onload = initSquare;
    script.onerror = () => setError('Failed to load payment SDK. Please refresh.');
    document.head.appendChild(script);

    return () => {
      cardInstanceRef.current?.destroy?.();
      cardInstanceRef.current = null;
    };
  }, []);

  async function initSquare() {
    // Guard against double-init (React Strict Mode runs effects twice in dev)
    if (cardInstanceRef.current) return;

    try {
      const sq = (window as any).Square;
      if (!sq) { setError('Square SDK not available.'); return; }

      const payments = sq.payments(applicationId, locationId);
      paymentsRef.current = payments;

      // Clear any leftover DOM from a previous mount before attaching
      const container = document.getElementById('sq-card');
      if (container) container.innerHTML = '';

      const card = await payments.card({
        style: {
          input: { color: '#4B2E25', fontSize: '15px' },
          '.input-container': { borderColor: '#C9A47E', borderRadius: '8px' },
          '.input-container.is-focus': { borderColor: '#4B2E25' },
        },
      });
      await card.attach('#sq-card');
      cardInstanceRef.current = card;
      setSdkReady(true);
    } catch (err: any) {
      setError(err?.message ?? 'Could not initialize payment form.');
    }
  }

  async function handlePay() {
    if (!cardInstanceRef.current) return;
    setError(null);
    setLoading(true);

    try {
      const result = await cardInstanceRef.current.tokenize();
      if (result.status !== 'OK') {
        setError(result.errors?.[0]?.message ?? 'Card tokenization failed.');
        setLoading(false);
        return;
      }

      const res = await chargeDeposit(result.token);
      if (!res.success) {
        setError(res.error);
        setLoading(false);
        return;
      }

      // Success — force a hard navigation so the server layout re-reads
      // the updated deposit_paid flag from Supabase
      window.location.href = '/booking/configure';
    } catch (err: any) {
      setError(err?.message ?? 'Unexpected error. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '480px' }}>
        <div className="auth-logo">
          <Image src="/brand/notime-storage-logo.png" alt="NoTime Storage" width={60} height={60} />
        </div>

        <div className="auth-header" style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-coffee)', marginBottom: '8px' }}>
            Reserve Your Spot
          </h1>
          <p style={{ color: '#6B5A52', fontSize: '0.9rem', lineHeight: '1.6' }}>
            We collect a one-time <strong>$50 commitment fee</strong> to keep our service
            available only for serious students — no spam, no no-shows.
          </p>
        </div>

        {/* Deposit summary */}
        <div style={{
          background: 'var(--color-paper)', border: '1px solid var(--color-latte)',
          borderRadius: '12px', padding: '16px 20px', marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ color: '#6B5A52', fontSize: '0.875rem' }}>Commitment fee</span>
            <span style={{ color: 'var(--color-coffee)', fontWeight: '700' }}>$50.00</span>
          </div>
          <div style={{ borderTop: '1px solid var(--color-latte)', paddingTop: '10px', fontSize: '0.8rem', color: '#16A34A', fontWeight: '600', textAlign: 'center' }}>
            ✓ This $50 is fully deducted from your total storage bill
          </div>
        </div>

        {isSandbox && (
          <div style={{
            background: '#FEF9C3', border: '1px solid #FDE047', borderRadius: '8px',
            padding: '10px 14px', marginBottom: '20px', fontSize: '0.8rem', color: '#713F12',
          }}>
            <strong>Sandbox mode</strong> — Use test card: <code>4111 1111 1111 1111</code>, any future date, any CVV.
          </div>
        )}

        {/* Square card element */}
        <div id="sq-card" ref={cardRef} style={{ marginBottom: '20px', minHeight: '89px' }} />

        {error && (
          <div style={{
            padding: '10px 14px', marginBottom: '16px', background: '#FEE2E2',
            border: '1px solid #EF4444', borderRadius: '8px', color: '#B91C1C', fontSize: '0.875rem',
          }}>
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handlePay}
          disabled={!sdkReady || loading}
          className="button-primary"
          style={{
            width: '100%', padding: '14px', fontSize: '1rem',
            opacity: (!sdkReady || loading) ? 0.6 : 1,
            cursor: (!sdkReady || loading) ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Processing…' : 'Pay $50 Deposit'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.8rem', color: '#9E8E88' }}>
          Secured by Square · $50 deducted from your total storage bill
        </p>

        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <Link href="/dashboard" style={{ color: 'var(--color-latte)', fontSize: '0.85rem' }}>
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
