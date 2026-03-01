'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

function BookingConfirmedContent() {
  const searchParams = useSearchParams();
  const moveOutDate = searchParams.get('moveOutDate') || '';
  const school = searchParams.get('school') || '';
  const boxes = searchParams.get('boxes') || '1';
  const monthlyTotal = searchParams.get('monthlyTotal') || '';
  const totalPrice = searchParams.get('totalPrice') || '';
  const months = searchParams.get('months') || '';

  const formattedDate = moveOutDate
    ? new Date(moveOutDate + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
      })
    : '';

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '480px' }}>
        <div className="auth-logo">
          <Image src="/brand/notime-storage-logo.png" alt="NoTime Storage" width={60} height={60} />
        </div>

        <div style={{ textAlign: 'center', padding: '8px 0 32px' }}>
          {/* Animated green check */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
            <svg viewBox="0 0 52 52" width="88" height="88" style={{ display: 'block' }}>
              <style>{`
                @keyframes bc-circle {
                  from { stroke-dashoffset: 166; }
                  to   { stroke-dashoffset: 0; }
                }
                @keyframes bc-check {
                  from { stroke-dashoffset: 48; }
                  to   { stroke-dashoffset: 0; }
                }
                .bc-circle {
                  stroke-dasharray: 166;
                  stroke-dashoffset: 166;
                  animation: bc-circle 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
                }
                .bc-check {
                  stroke-dasharray: 48;
                  stroke-dashoffset: 48;
                  animation: bc-check 0.4s cubic-bezier(0.65, 0, 0.45, 1) 0.5s forwards;
                }
              `}</style>
              <circle className="bc-circle" cx="26" cy="26" r="25" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
              <polyline className="bc-check" points="14,26 22,34 38,18" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-coffee)', marginBottom: '10px' }}>
            Booking Received!
          </h1>
          <p style={{ color: '#4A3A34', fontSize: '1rem', marginBottom: '24px', lineHeight: '1.6' }}>
            Your storage booking has been submitted. Check your email for a confirmation.
          </p>

          {/* Summary card */}
          {(formattedDate || school || boxes || monthlyTotal) && (
            <div style={{
              background: 'var(--color-paper)',
              border: '1px solid var(--color-latte)',
              borderRadius: '12px',
              padding: '20px 24px',
              marginBottom: '28px',
              textAlign: 'left',
            }}>
              {school && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: '#6B5A52', fontSize: '0.875rem' }}>School</span>
                  <span style={{ color: 'var(--color-coffee)', fontWeight: '600', fontSize: '0.875rem' }}>{school}</span>
                </div>
              )}
              {formattedDate && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: '#6B5A52', fontSize: '0.875rem' }}>Move-out date</span>
                  <span style={{ color: 'var(--color-coffee)', fontWeight: '600', fontSize: '0.875rem' }}>{formattedDate}</span>
                </div>
              )}
              {boxes && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: '#6B5A52', fontSize: '0.875rem' }}>Boxes</span>
                  <span style={{ color: 'var(--color-coffee)', fontWeight: '600', fontSize: '0.875rem' }}>{boxes} box{parseInt(boxes) > 1 ? 'es' : ''}</span>
                </div>
              )}
              {(totalPrice || monthlyTotal) && (
                <div style={{ borderTop: '1px solid var(--color-latte)', paddingTop: '10px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ color: '#6B5A52', fontSize: '0.875rem', fontWeight: '600' }}>Total</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: 'var(--color-coffee)', fontWeight: '800', fontSize: '1.1rem' }}>
                        ${totalPrice || monthlyTotal}
                        {months ? ` for ${months} months` : ''}
                      </span>
                      {monthlyTotal && totalPrice && (
                        <div style={{ color: '#9E8E88', fontSize: '0.75rem', marginTop: '2px' }}>
                          ${monthlyTotal}/month
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <Link href="/dashboard">
            <button type="button" className="button-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem', marginBottom: '12px' }}>
              Go to Dashboard
            </button>
          </Link>
          <Link href="/">
            <button type="button" className="button-secondary" style={{ width: '100%', padding: '12px', fontSize: '0.9rem' }}>
              Back to Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BookingConfirmedPage() {
  return (
    <Suspense fallback={<div className="auth-container" />}>
      <BookingConfirmedContent />
    </Suspense>
  );
}
