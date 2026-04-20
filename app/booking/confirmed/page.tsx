'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatDate } from '@/lib/utils/date';
import { AuthPageWrapper } from '@/app/components/AuthPageWrapper';
import { buildVenmoNote, buildVenmoPayUrl, getVenmoHandleFromEnv, shortBookingId } from '@/lib/payment/venmo';

type BookingStatus = {
  id: string;
  payment_status: string;
  status: string;
  total_price: number;
  total_monthly_rate: number;
  storage_months: number | null;
  school: string;
  move_out_date: string;
  dorm: string;
  box_quantity: number;
};

/** Fallback values derived from the DB when the URL doesn't carry them
 *  (Stripe success_url only brings session_id + bookingId, not the full summary).
 */
function useBookingStatusPoll(bookingId: string, enabled: boolean) {
  const [data, setData] = useState<BookingStatus | null>(null);
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    if (!enabled || !bookingId) return;
    let cancelled = false;
    const start = Date.now();

    const tick = async () => {
      try {
        const res = await fetch(`/api/booking/status?bookingId=${encodeURIComponent(bookingId)}`, {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const json = (await res.json()) as BookingStatus;
        if (cancelled) return;
        setData(json);
        if (json.payment_status === 'paid') {
          clearInterval(interval);
        }
      } catch {
        // keep polling — webhook is eventually consistent
      }
      if (Date.now() - start > 60_000) {
        setGaveUp(true);
        clearInterval(interval);
      }
    };

    const interval = setInterval(tick, 2_000);
    tick();

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [bookingId, enabled]);

  return { data, gaveUp };
}

function BookingConfirmedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
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
  const stripeSessionId = searchParams.get('session_id') || '';

  // Stripe landing: only session_id + bookingId are in the URL. Poll the DB
  // until the webhook flips the booking to paid, then render the success view.
  const stripeMode = !!stripeSessionId && !venmoPending;
  const { data: poll, gaveUp: pollGaveUp } = useBookingStatusPoll(bookingId, stripeMode);
  const stripeConfirmed = stripeMode && poll?.payment_status === 'paid';
  const stripeProcessing = stripeMode && !stripeConfirmed;

  // Prefer URL values (Venmo flow); fall back to polled DB values (Stripe flow).
  const schoolEff = school || poll?.school || '';
  const moveOutDateEff = moveOutDate || poll?.move_out_date || '';
  const boxesEff = boxes !== '0' ? boxes : (poll?.box_quantity != null ? String(poll.box_quantity) : '0');
  const totalPriceEff = totalPrice || (poll?.total_price ? String(poll.total_price) : '');
  const monthlyTotalEff = monthlyTotal || (poll?.total_monthly_rate ? String(poll.total_monthly_rate) : '');
  const monthsEff = months || (poll?.storage_months != null ? String(poll.storage_months) : '');

  const totalPriceNum = parseFloat(totalPriceEff) || 0;
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

  const formattedDate = moveOutDateEff ? formatDate(moveOutDateEff) : '';

  // Once Stripe finally confirms, drop session_id from the URL so a refresh
  // doesn't re-trigger the polling branch. Replace in place, no new history.
  useEffect(() => {
    if (stripeConfirmed && typeof window !== 'undefined' && searchParams.get('session_id')) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('session_id');
      router.replace(`/booking/confirmed?${params.toString()}`);
    }
  }, [stripeConfirmed, searchParams, router]);

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
            {stripeProcessing ? (
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  border: '4px solid var(--color-latte)',
                  borderTopColor: 'transparent',
                  animation: 'bc-spin 0.9s linear infinite',
                }}
                aria-label="Confirming payment"
              />
            ) : (
              <svg viewBox="0 0 52 52" width="88" height="88" style={{ display: 'block' }}>
                <style>{`
                  @keyframes bc-circle { from { stroke-dashoffset: 166; } to { stroke-dashoffset: 0; } }
                  @keyframes bc-check  { from { stroke-dashoffset: 48; }  to { stroke-dashoffset: 0; } }
                  @keyframes bc-spin   { from { transform: rotate(0); } to { transform: rotate(360deg); } }
                  .bc-circle { stroke-dasharray: 166; stroke-dashoffset: 166; animation: bc-circle 0.6s cubic-bezier(0.65,0,0.45,1) forwards; }
                  .bc-check  { stroke-dasharray: 48;  stroke-dashoffset: 48;  animation: bc-check  0.4s cubic-bezier(0.65,0,0.45,1) 0.5s forwards; }
                `}</style>
                <circle className="bc-circle" cx="26" cy="26" r="25" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
                <polyline className="bc-check" points="14,26 22,34 38,18" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </motion.div>

          <motion.h1 custom={0.15} variants={childVar} initial="hidden" animate="visible"
            style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-coffee)', marginBottom: '10px' }}>
            {venmoPending
              ? 'Booking saved — finish on Venmo'
              : stripeProcessing
                ? (pollGaveUp ? 'Still confirming…' : 'Confirming your payment…')
                : 'You\'re all set!'}
          </motion.h1>
          <motion.p custom={0.22} variants={childVar} initial="hidden" animate="visible"
            style={{ color: '#4A3A34', fontSize: '1rem', marginBottom: '24px', lineHeight: '1.6' }}>
            {venmoPending ? (
              <>
                Your booking is saved but it&apos;s <strong>not confirmed yet</strong>. A Venmo tab should have opened with the amount and note pre-filled — confirm the payment there. We&apos;ll email you as soon as the transfer clears (usually within one business day).
              </>
            ) : stripeProcessing ? (
              pollGaveUp ? (
                <>Your payment went through but we&apos;re still syncing the confirmation. You can safely close this tab — we&apos;ll email you when it&apos;s locked in.</>
              ) : (
                <>Your card was charged — we&apos;re finalizing the booking now. This page updates automatically as soon as it&apos;s confirmed.</>
              )
            ) : (
              'Your storage is booked. A confirmation is on its way to your inbox — check your email.'
            )}
            {!venmoPending && !stripeProcessing && (
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

          {(formattedDate || schoolEff || boxesEff || monthlyTotalEff) && (
            <motion.div custom={0.3} variants={childVar} initial="hidden" animate="visible"
              style={{
                background: 'var(--color-paper)',
                border: '1px solid var(--color-latte)',
                borderRadius: '12px',
                padding: '20px 24px',
                marginBottom: '28px',
                textAlign: 'left',
              }}>
              {schoolEff && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: '#6B5A52', fontSize: '0.875rem' }}>School</span>
                  <span style={{ color: 'var(--color-coffee)', fontWeight: '600', fontSize: '0.875rem' }}>{schoolEff}</span>
                </div>
              )}
              {formattedDate && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: '#6B5A52', fontSize: '0.875rem' }}>Move-out</span>
                  <span style={{ color: 'var(--color-coffee)', fontWeight: '600', fontSize: '0.875rem' }}>{formattedDate}</span>
                </div>
              )}
              {(boxesEff !== undefined && boxesEff !== null) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: '#6B5A52', fontSize: '0.875rem' }}>Boxes</span>
                  <span style={{ color: 'var(--color-coffee)', fontWeight: '600', fontSize: '0.875rem' }}>
                    {parseInt(boxesEff) === 0 ? '0 (items only)' : `${boxesEff} box${parseInt(boxesEff) !== 1 ? 'es' : ''}`}
                  </span>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--color-latte)', paddingTop: '12px', marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ color: '#6B5A52', fontSize: '0.875rem', fontWeight: '600' }}>
                    {venmoPending ? 'Balance due on Venmo' : 'Total'}
                  </span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: 'var(--color-coffee)', fontWeight: '800', fontSize: '1.1rem' }}>
                      ${venmoPending && balanceDueLabel ? balanceDueLabel : (totalPriceEff || monthlyTotalEff)}{monthsEff ? ` · ${monthsEff} months` : ''}
                    </span>
                    {monthlyTotalEff && totalPriceEff && (
                      <div style={{ color: '#9E8E88', fontSize: '0.75rem', marginTop: '2px' }}>
                        ${monthlyTotalEff}/month
                        {venmoPending && balanceDueLabel
                          ? ` · $50 deposit already paid`
                          : balanceDueLabel
                            ? ` · $50 deposit + $${balanceDueLabel} balance`
                            : ''}
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
