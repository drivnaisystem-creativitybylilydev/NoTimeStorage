'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatDate } from '@/lib/utils/date';
import { getMoveOutWindow } from '@/lib/schools/config';
import { AuthPageWrapper } from '@/app/components/AuthPageWrapper';
import { buildVenmoNote, buildVenmoPayUrl, getVenmoHandleFromEnv, shortBookingId } from '@/lib/payment/venmo';

function BookingConfirmedContent() {
  const searchParams = useSearchParams();
  const moveOutDate = searchParams.get('moveOutDate') || '';
  const school = searchParams.get('school') || '';
  const boxes = searchParams.get('boxes') || '0';
  const monthlyTotal = searchParams.get('monthlyTotal') || '';
  const totalPrice = searchParams.get('totalPrice') || '';
  const months = searchParams.get('months') || '';
  const venmoPending = searchParams.get('venmoPending') === '1';
  const bookingId = searchParams.get('bookingId') || '';
  const venmoAmountCents = parseInt(searchParams.get('venmoAmount') || '0', 10);
  const firstName = searchParams.get('fn') || '';

  const totalPriceNum = parseFloat(totalPrice) || 0;
  const balanceDueLabel = totalPriceNum > 0 ? (totalPriceNum - 50).toFixed(2) : '';

  const venmoSlug = getVenmoHandleFromEnv();
  const venmoAmountDollars = venmoAmountCents > 0
    ? venmoAmountCents / 100
    : (totalPriceNum > 0 ? totalPriceNum - 50 : 0);
  const venmoPayUrl = venmoPending && venmoSlug && venmoAmountDollars > 0 && bookingId
    ? buildVenmoPayUrl({
        slug: venmoSlug,
        amount: venmoAmountDollars,
        note: buildVenmoNote({ kind: 'booking', bookingId, firstName }),
      })
    : null;

  const formattedDate = moveOutDate ? formatDate(moveOutDate) : '';

  const moveOutWindow = school ? getMoveOutWindow(school) : null;

  const childVar = {
    hidden: { opacity: 0, y: 14 },
    visible: (d: number) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: d, ease: [0.25, 0.1, 0.25, 1] as [number,number,number,number] } }),
  };

  return (
    <AuthPageWrapper>
      <motion.div
        className="auth-card"
        style={{ maxWidth: '480px' }}
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as [number,number,number,number] }}
      >
        <div className="auth-logo">
          <Image src="/brand/notime-storage-logo.png" alt="NoTime Storage" width={60} height={60} />
        </div>

        <div style={{ textAlign: 'center', padding: '8px 0 32px' }}>
          <motion.div custom={0.05} variants={childVar} initial="hidden" animate="visible" style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
            <svg viewBox="0 0 52 52" width="88" height="88" style={{ display: 'block' }}>
              <style>{`
                @keyframes bc-circle { from { stroke-dashoffset: 166; } to { stroke-dashoffset: 0; } }
                @keyframes bc-check  { from { stroke-dashoffset: 48; }  to { stroke-dashoffset: 0; } }
                .bc-circle { stroke-dasharray: 166; stroke-dashoffset: 166; animation: bc-circle 0.6s cubic-bezier(0.65,0,0.45,1) forwards; }
                .bc-check  { stroke-dasharray: 48;  stroke-dashoffset: 48;  animation: bc-check  0.4s cubic-bezier(0.65,0,0.45,1) 0.5s forwards; }
              `}</style>
              <circle className="bc-circle" cx="26" cy="26" r="25" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
              <polyline className="bc-check" points="14,26 22,34 38,18" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>

          <motion.h1 custom={0.15} variants={childVar} initial="hidden" animate="visible"
            style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-coffee)', marginBottom: '10px' }}>
            {venmoPending ? 'Booking saved — finish on Venmo' : 'You\'re almost set!'}
          </motion.h1>
          <motion.p custom={0.22} variants={childVar} initial="hidden" animate="visible"
            style={{ color: '#4A3A34', fontSize: '1rem', marginBottom: '24px', lineHeight: '1.6' }}>
            {venmoPending ? (
              <>
                Your booking is saved but it&apos;s <strong>not confirmed yet</strong>. A Venmo tab should have opened with the amount and note pre-filled — confirm the payment there. We&apos;ll email you as soon as the transfer clears (usually within one business day).
              </>
            ) : (
              'Your storage is booked. A confirmation is on its way to your inbox — check your email.'
            )}
            {!venmoPending && (
              <span style={{ display: 'block', marginTop: '8px', fontSize: '0.85rem', color: '#9B8880', padding: '8px 12px', background: 'var(--color-paper)', borderRadius: '8px', border: '1px solid var(--color-latte)' }}>
                📬 Don&apos;t see it? Check your <strong>junk or spam folder</strong> — it may have landed there.
              </span>
            )}
          </motion.p>

          {venmoPending && venmoPayUrl && (
            <motion.div custom={0.28} variants={childVar} initial="hidden" animate="visible"
              style={{
                background: 'linear-gradient(135deg, #EEF8FE 0%, #f6fafd 100%)',
                border: '1px solid #bae6fd',
                borderRadius: '14px',
                padding: '18px 20px',
                marginBottom: '22px',
                textAlign: 'center',
              }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0369a1', marginBottom: '10px' }}>
                Venmo didn&apos;t open?
              </div>
              <a
                href={venmoPayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="button-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  textDecoration: 'none',
                  padding: '13px 20px',
                  fontSize: '0.95rem',
                  marginBottom: '10px',
                  boxSizing: 'border-box',
                }}
              >
                <span>Tap to open Venmo — pay ${venmoAmountDollars.toFixed(2)}</span>
                <span aria-hidden style={{ fontSize: '1rem', lineHeight: 1 }}>→</span>
              </a>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#075985', lineHeight: 1.5 }}>
                Amount and note are pre-filled.{bookingId ? (
                  <> Reference: <strong style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{shortBookingId(bookingId)}</strong></>
                ) : null}
              </p>
            </motion.div>
          )}

          {(formattedDate || school || boxes || monthlyTotal) && (
            <motion.div custom={0.3} variants={childVar} initial="hidden" animate="visible"
              style={{
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
                  <span style={{ color: '#6B5A52', fontSize: '0.875rem' }}>Move-out</span>
                  <span style={{ color: 'var(--color-coffee)', fontWeight: '600', fontSize: '0.875rem' }}>{formattedDate}</span>
                </div>
              )}
              {(boxes !== undefined && boxes !== null) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: '#6B5A52', fontSize: '0.875rem' }}>Boxes</span>
                  <span style={{ color: 'var(--color-coffee)', fontWeight: '600', fontSize: '0.875rem' }}>
                    {parseInt(boxes) === 0 ? '0 (items only)' : `${boxes} box${parseInt(boxes) !== 1 ? 'es' : ''}`}
                  </span>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--color-latte)', paddingTop: '12px', marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ color: '#6B5A52', fontSize: '0.875rem', fontWeight: '600' }}>
                    {venmoPending ? 'Balance due on Venmo' : 'Total charged'}
                  </span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: 'var(--color-coffee)', fontWeight: '800', fontSize: '1.1rem' }}>
                      ${venmoPending && balanceDueLabel ? balanceDueLabel : (totalPrice || monthlyTotal)}{months ? ` · ${months} months` : ''}
                    </span>
                    {monthlyTotal && totalPrice && (
                      <div style={{ color: '#9E8E88', fontSize: '0.75rem', marginTop: '2px' }}>
                        ${monthlyTotal}/month{venmoPending && balanceDueLabel ? ` · $50 deposit already paid` : ''}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div custom={0.36} variants={childVar} initial="hidden" animate="visible"
            style={{
              background: 'var(--color-paper)',
              border: '1px solid var(--color-latte)',
              borderRadius: '12px',
              padding: '18px 20px',
              marginBottom: '24px',
              textAlign: 'left',
            }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
              What happens next
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1rem', lineHeight: 1 }}>📦</span>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-coffee)' }}>Box delivery — 2–3 days before move-out</div>
                  <div style={{ fontSize: '0.8125rem', color: '#6B5A52', marginTop: '2px' }}>We&apos;ll drop off empty boxes at your dorm and contact you beforehand with the exact date.</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1rem', lineHeight: 1 }}>🚚</span>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-coffee)' }}>
                    Move-out pickup{formattedDate ? ` — ${formattedDate}` : ''}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#6B5A52', marginTop: '2px' }}>Our team picks up your packed boxes and items from your dorm.</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1rem', lineHeight: 1 }}>🏠</span>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-coffee)' }}>Move-in delivery</div>
                  <div style={{ fontSize: '0.8125rem', color: '#6B5A52', marginTop: '2px' }}>We deliver everything back to you at the start of next semester.</div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div custom={0.38} variants={childVar} initial="hidden" animate="visible">
            <Link href="/dashboard">
              <button type="button" className="button-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem', marginBottom: '12px' }}>
                View My Booking
              </button>
            </Link>
            <Link href="/">
              <button type="button" className="button-secondary" style={{ width: '100%', padding: '12px', fontSize: '0.9rem' }}>
                Back to Home
              </button>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </AuthPageWrapper>
  );
}

export default function BookingConfirmedPage() {
  return (
    <Suspense fallback={<AuthPageWrapper><div /></AuthPageWrapper>}>
      <BookingConfirmedContent />
    </Suspense>
  );
}
