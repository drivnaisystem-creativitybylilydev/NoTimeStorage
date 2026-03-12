'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { chargeDeposit } from '@/lib/square/deposit';
import { AuthPageWrapper } from '@/app/components/AuthPageWrapper';

interface DepositFormProps {
  applicationId: string;
  locationId: string;
  isSandbox: boolean;
  customerName: string;
}

export function DepositForm({ applicationId, locationId, isSandbox, customerName }: DepositFormProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const paymentsRef = useRef<any>(null);
  const cardInstanceRef = useRef<any>(null);
  const applePayRef = useRef<any>(null);
  const googlePayRef = useRef<any>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
   const [applePayInstance, setApplePayInstance] = useState<any>(null);
   const [googlePayInstance, setGooglePayInstance] = useState<any>(null);

  useEffect(() => {
    let googlePayCleanup: (() => void) | null = null;

    const scriptSrc = isSandbox
      ? 'https://sandbox.web.squarecdn.com/v1/square.js'
      : 'https://web.squarecdn.com/v1/square.js';

    const initSquare = async () => {
      if (cardInstanceRef.current) return;
      try {
        const sq = (window as any).Square;
        if (!sq) {
          setError('Square SDK not available.');
          return;
        }

        const payments = sq.payments(applicationId, locationId);
        paymentsRef.current = payments;

        const container = document.getElementById('sq-card');
        if (container) container.innerHTML = '';

        // Card element styling: only properties Square supports (no fontSize/boxShadow).
        const card = await payments.card({
          style: {
            input: { color: '#4B2E25' },
            '.input-container': {
              borderColor: '#C9A47E',
              borderRadius: '8px',
            },
            '.input-container.is-focus': {
              borderColor: '#4B2E25',
            },
          },
        });
        await card.attach('#sq-card');
        cardInstanceRef.current = card;
        setSdkReady(true);

        // Shared PaymentRequest for $50 deposit (display amount, not cents).
        const paymentRequest = payments.paymentRequest({
          countryCode: 'US',
          currencyCode: 'USD',
          total: {
            amount: '50.00',
            label: 'NoTime Storage Deposit',
          },
        });

        // Apple Pay: create with PaymentRequest (no attach). We render our own button.
        try {
          const applePay = await payments.applePay(paymentRequest);
          applePayRef.current = applePay;
          setApplePayInstance(applePay);
        } catch (e) {
          console.log('Apple Pay not available for deposit', e);
        }

        // Google Pay: create with PaymentRequest and attach a button into our div.
        try {
          const googlePay = await payments.googlePay(paymentRequest);
          await googlePay.attach('#google-pay-button', {
            buttonColor: 'default',
            buttonType: 'long',
          });
          googlePayRef.current = googlePay;
          setGooglePayInstance(googlePay);

          const googlePayEl = document.getElementById('google-pay-button');
          const onGooglePayClick = async () => {
            setError(null);
            setLoading(true);
            try {
              const result = await googlePay.tokenize();
              if (result.status === 'OK' && result.token) {
                await processDepositWithToken(result.token);
              } else {
                setError(result.errors?.[0]?.message ?? 'Google Pay failed.');
              }
            } catch (err: any) {
              setError(err?.message ?? 'Google Pay failed.');
            } finally {
              setLoading(false);
            }
          };

          googlePayEl?.addEventListener('click', onGooglePayClick);
          googlePayCleanup = () => {
            googlePayEl?.removeEventListener('click', onGooglePayClick);
          };
        } catch (e) {
          console.log('Google Pay not available for deposit', e);
        }
      } catch (err: any) {
        setError(err?.message ?? 'Could not initialize payment form.');
      }
    };

    const existing = document.querySelector(`script[src="${scriptSrc}"]`);
    if (existing) {
      initSquare();
    } else {
      const script = document.createElement('script');
      script.src = scriptSrc;
      script.onload = initSquare;
      script.onerror = () =>
        setError('Failed to load payment SDK. Please refresh.');
      document.head.appendChild(script);
    }

    return () => {
      googlePayCleanup?.();
      cardInstanceRef.current?.destroy?.();
      cardInstanceRef.current = null;
      applePayRef.current = null;
      googlePayRef.current = null;
      setSdkReady(false);
      setApplePayInstance(null);
      setGooglePayInstance(null);
    };
  }, [applicationId, locationId, isSandbox]);

  async function processDepositWithToken(token: string) {
    const res = await chargeDeposit(token);
    if (!res.success) {
      setError(res.error);
      return;
    }
    window.location.href = '/booking/configure';
  }

  async function handleApplePayClick(e: any) {
    e.preventDefault();
    if (!applePayRef.current) return;
    setError(null);
    setLoading(true);
    try {
      const result = await applePayRef.current.tokenize();
      if (result.status === 'OK' && result.token) {
        await processDepositWithToken(result.token);
      } else {
        setError(result.errors?.[0]?.message ?? 'Apple Pay failed.');
      }
    } catch (err: any) {
      setError(err?.message ?? 'Apple Pay failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePay() {
    if (!cardInstanceRef.current) return;
    setError(null);
    setLoading(true);
    try {
      const result = await cardInstanceRef.current.tokenize();
      if (result.status !== 'OK' || !result.token) {
        setError(result.errors?.[0]?.message ?? 'Card tokenization failed.');
        return;
      }
      await processDepositWithToken(result.token);
    } catch (err: any) {
      setError(err?.message ?? 'Unexpected error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPageWrapper>
      <motion.div
        className="auth-card"
        style={{ maxWidth: '520px' }}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="auth-logo">
          <Image src="/brand/notime-storage-logo.png" alt="NoTime Storage" width={60} height={60} />
        </div>

        {/* Headline: One final step */}
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

        {/* Locked booking tease — looks like the real booking page */}
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
          {/* Fake booking UI */}
          <div style={{ padding: '20px 22px', filter: 'blur(3.5px)', pointerEvents: 'none', userSelect: 'none' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-coffee)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
              Configure Your Storage
            </div>
            {/* Fake boxes selector */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              {[1,2,3,4].map(n => (
                <div key={n} style={{
                  flex: 1, padding: '10px 4px', textAlign: 'center', borderRadius: '10px',
                  background: n === 2 ? 'var(--color-coffee)' : 'var(--color-paper)',
                  border: `2px solid ${n === 2 ? 'var(--color-coffee)' : 'var(--color-latte)'}`,
                  color: n === 2 ? 'white' : 'var(--color-coffee)',
                  fontSize: '0.75rem', fontWeight: 700,
                }}>
                  {n} Box{n > 1 ? 'es' : ''}
                </div>
              ))}
            </div>
            {/* Fake date row */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <div style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', background: 'var(--color-paper)', border: '1px solid var(--color-latte)', fontSize: '0.7rem', color: '#9E8E88' }}>Move-out date</div>
              <div style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', background: 'var(--color-paper)', border: '1px solid var(--color-latte)', fontSize: '0.7rem', color: '#9E8E88' }}>Move-in date</div>
            </div>
            {/* Fake dorm + price row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ height: '10px', background: 'var(--color-latte)', borderRadius: '5px', width: '45%' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-coffee)' }}>$80/month</div>
            </div>
          </div>

          {/* Lock overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(160deg, rgba(75,46,37,0.72) 0%, rgba(40,22,12,0.90) 100%)',
            backdropFilter: 'blur(1px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px',
          }}>
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                border: '2px solid rgba(255,255,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </motion.div>
            <span style={{ color: 'white', fontWeight: '700', fontSize: '0.9rem', letterSpacing: '0.01em' }}>
              Unlock booking — pay $50 deposit
            </span>
            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem' }}>
              Deducted from your total at checkout
            </span>
          </div>
        </motion.div>

        {/* Deposit form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div style={{
            background: 'var(--color-paper)',
            border: '1px solid var(--color-latte)',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ color: '#6B5A52', fontSize: '0.875rem' }}>Commitment fee</span>
              <span style={{ color: 'var(--color-coffee)', fontWeight: '700' }}>$50.00</span>
            </div>
            <div style={{ borderTop: '1px solid var(--color-latte)', paddingTop: '10px', fontSize: '0.8rem', color: '#16A34A', fontWeight: '600', textAlign: 'center' }}>
              ✓ Deducted from your total — you pay less at checkout
            </div>
          </div>

          {isSandbox && (
            <div style={{
              background: '#FEF9C3',
              border: '1px solid #FDE047',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '20px',
              fontSize: '0.8rem',
              color: '#713F12',
            }}>
              <strong>Sandbox</strong> — Test card: <code>4111 1111 1111 1111</code>, any future date, any CVV.
            </div>
          )}

          {/* Digital wallets for deposit */}
          <div
            className="payment-digital-wallets"
            style={{ display: (applePayInstance || googlePayInstance) ? 'flex' : 'none' }}
          >
            {applePayInstance && (
              <button
                type="button"
                id="apple-pay-button"
                className="payment-wallet-button payment-wallet-button-apple"
                onClick={handleApplePayClick}
                disabled={loading}
              >
                Apple Pay
              </button>
            )}
            <div id="google-pay-button" className="payment-wallet-button" />
          </div>

          {(applePayInstance || googlePayInstance) && (
            <div className="payment-method-divider" style={{ marginBottom: '16px' }}>
              <span>or pay with card</span>
            </div>
          )}

          <div id="sq-card" ref={cardRef} style={{ marginBottom: '20px', minHeight: '89px' }} />

          {error && (
            <div style={{
              padding: '10px 14px',
              marginBottom: '16px',
              background: '#FEE2E2',
              border: '1px solid #EF4444',
              borderRadius: '8px',
              color: '#B91C1C',
              fontSize: '0.875rem',
            }}>
              {error}
            </div>
          )}

          <motion.button
            type="button"
            onClick={handlePay}
            disabled={!sdkReady || loading}
            className="button-primary"
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '1.05rem',
              opacity: (!sdkReady || loading) ? 0.6 : 1,
              cursor: (!sdkReady || loading) ? 'not-allowed' : 'pointer',
            }}
            whileHover={sdkReady && !loading ? { scale: 1.02 } : {}}
            whileTap={sdkReady && !loading ? { scale: 0.98 } : {}}
          >
            {loading ? 'Processing…' : 'Unlock My Booking'}
          </motion.button>

          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.8rem', color: '#9E8E88' }}>
            Secured by Square · $50 applied to your total
          </p>
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
