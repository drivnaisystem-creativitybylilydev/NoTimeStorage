'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AuthPageWrapper } from '@/app/components/AuthPageWrapper';
import { VenmoBackupSection } from '@/app/components/VenmoBackupSection';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';

interface DepositFormProps {
  customerName: string;
  customerEmail: string;
  venmoHandle: string | null;
}

export function DepositForm({ customerName, customerEmail, venmoHandle }: DepositFormProps) {
  const [sent, setSent] = useState(false);
  const firstName = customerName.trim().split(/\s+/)[0] || '';

  // Persist the "sent" flag in the URL so the confirmation card survives a
  // page refresh, a back-button, or the browser navigating the original tab
  // instead of honoring target="_blank".
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('sent') === '1') setSent(true);
  }, []);

  const markSent = () => {
    setSent(true);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('sent', '1');
      window.history.replaceState({}, '', url.toString());
    }
  };

  const undoSent = () => {
    setSent(false);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('sent');
      window.history.replaceState({}, '', url.toString());
    }
  };
  return (
    <AuthPageWrapper>
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="auth-logo">
          <Image src="/brand/notime-storage-logo.png" alt="NoTime Storage" width={60} height={60} />
        </div>

        <motion.div
          style={{ textAlign: 'center', marginBottom: '20px' }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <p style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-latte)', marginBottom: '8px' }}>
            Almost there{customerName ? `, ${customerName.split(' ')[0]}` : ''}
          </p>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-coffee)', marginBottom: '10px', lineHeight: 1.2 }}>
            One final step before you can book
          </h1>
          <p style={{ color: '#6B5A52', fontSize: '0.95rem', lineHeight: '1.65' }}>
            A <strong>$50 commitment fee</strong> keeps our service spam-free and serious-student only. It&apos;s deducted in full from your total — you pay less at checkout.
          </p>
        </motion.div>

        <motion.div
          style={{
            position: 'relative',
            borderRadius: '16px',
            overflow: 'hidden',
            marginBottom: '28px',
            border: '2px solid var(--color-latte)',
            background: 'white',
            boxShadow: '0 4px 24px rgba(75,46,37,0.10)',
          }}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div style={{ padding: '20px 22px', filter: 'blur(3.5px)', pointerEvents: 'none', userSelect: 'none' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-coffee)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
              Configure Your Storage
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              {[1, 2, 3, 4].map(n => (
                <div
                  key={n}
                  style={{
                    flex: 1,
                    padding: '10px 4px',
                    textAlign: 'center',
                    borderRadius: '10px',
                    background: n === 2 ? 'var(--color-coffee)' : 'var(--color-paper)',
                    border: `2px solid ${n === 2 ? 'var(--color-coffee)' : 'var(--color-latte)'}`,
                    color: n === 2 ? 'white' : 'var(--color-coffee)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  {n} Box{n > 1 ? 'es' : ''}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <div style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', background: 'var(--color-paper)', border: '1px solid var(--color-latte)', fontSize: '0.7rem', color: '#9E8E88' }}>Move-out date</div>
              <div style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', background: 'var(--color-paper)', border: '1px solid var(--color-latte)', fontSize: '0.7rem', color: '#9E8E88' }}>Move-in date</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ height: '10px', background: 'var(--color-latte)', borderRadius: '5px', width: '45%' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-coffee)' }}>$80/month</div>
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(160deg, rgba(75,46,37,0.72) 0%, rgba(40,22,12,0.90) 100%)',
              backdropFilter: 'blur(1px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                border: '2px solid rgba(255,255,255,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </motion.div>
            <span style={{ color: 'white', fontWeight: '700', fontSize: '0.9rem', letterSpacing: '0.01em' }}>
              Unlock booking — send $50 on Venmo
            </span>
            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem' }}>
              Deducted from your total at checkout
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div
            style={{
              background: 'var(--color-paper)',
              border: '1px solid var(--color-latte)',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ color: '#6B5A52', fontSize: '0.875rem' }}>Commitment fee</span>
              <span style={{ color: 'var(--color-coffee)', fontWeight: '700' }}>$50.00</span>
            </div>
            <div style={{ borderTop: '1px solid var(--color-latte)', paddingTop: '10px', fontSize: '0.8rem', color: '#16A34A', fontWeight: '600', textAlign: 'center' }}>
              ✓ Deducted from your total — you pay less at checkout
            </div>
          </div>

          {venmoHandle ? (
            sent ? (
              <div
                style={{
                  background: 'linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)',
                  border: '1px solid #86efac',
                  borderRadius: '14px',
                  padding: '22px 20px',
                  marginBottom: '20px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '44px',
                    height: '44px',
                    margin: '0 auto 12px',
                    borderRadius: '50%',
                    background: 'rgba(22, 163, 74, 0.15)',
                    color: '#166534',
                    fontSize: '1.4rem',
                    fontWeight: 800,
                  }}
                >
                  ✓
                </div>
                <div style={{ fontWeight: 700, color: '#166534', marginBottom: '8px', fontSize: '1rem' }}>
                  We&apos;re verifying your $50
                </div>
                <p style={{ fontSize: '0.875rem', color: '#14532d', margin: '0 0 14px', lineHeight: 1.55 }}>
                  We&apos;ll email <strong>{customerEmail || 'you'}</strong> as soon as the transfer clears — usually within one business day. Booking unlocks automatically.
                </p>
                <button
                  type="button"
                  onClick={undoSent}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#166534',
                    fontSize: '0.78rem',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: 0,
                    opacity: 0.75,
                  }}
                >
                  Didn&apos;t send it yet? Go back
                </button>
              </div>
            ) : (
              <>
                <VenmoBackupSection
                  venmoSlug={venmoHandle}
                  amountLabel="$50.00"
                  amountCents={5000}
                  purpose="deposit"
                  noteContext={{ kind: 'deposit', firstName, email: customerEmail }}
                  ctaLabel="Pay Deposit"
                  onOpened={markSent}
                />
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <button
                    type="button"
                    onClick={markSent}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-coffee)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      opacity: 0.8,
                    }}
                  >
                    Already sent it? Mark as sent
                  </button>
                </div>
              </>
            )
          ) : (
            <div
              style={{
                padding: '16px 18px',
                marginBottom: '20px',
                background: '#FEF3C7',
                border: '1px solid #FCD34D',
                borderRadius: '12px',
                fontSize: '0.9rem',
                color: '#78350F',
              }}
            >
              Online deposit is not configured yet. Please email{' '}
              <a href={`mailto:${SITE_CONTACT_EMAIL}`} style={{ fontWeight: 700, color: 'var(--color-coffee)' }}>
                {SITE_CONTACT_EMAIL}
              </a>{' '}
              for payment instructions.
            </div>
          )}

          {!sent && (
            <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.8rem', color: '#9E8E88' }}>
              After you send it, we confirm within one business day and email you when booking unlocks. The $50 is credited against your storage total at checkout.
            </p>
          )}
        </motion.div>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Link href="/dashboard" style={{ color: 'var(--color-latte)', fontSize: '0.85rem', textDecoration: 'underline' }}>
            Back to dashboard
          </Link>
        </div>
      </motion.div>
    </AuthPageWrapper>
  );
}
