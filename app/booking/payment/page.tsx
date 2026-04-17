'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { createBooking } from '@/lib/booking/create-booking';
import type { CreateBookingInput, BookingItemType } from '@/lib/booking/types';
import { formatDate, formatTime } from '@/lib/utils/date';
import { AuthPageWrapper } from '@/app/components/AuthPageWrapper';
import { buildVenmoNote, buildVenmoPayUrl, getVenmoHandleFromEnv } from '@/lib/payment/venmo';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';
import {
  ADDON_PRICE_USD_MONTH,
  ADDON_UNIT_PRICE_CENTS,
  MAX_ADDITIONAL_ITEMS,
  getBoxUnitPriceCents,
} from '@/lib/booking/addon-pricing';

const ITEM_TYPE_MAP: Record<string, BookingItemType> = {
  smallWithBox: 'small_with_box',
  smallWithoutBox: 'small_without_box',
  mediumWithBox: 'medium_with_box',
  mediumWithoutBox: 'medium_without_box',
  large: 'large',
};

function PaymentPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'idle' | 'creating' | 'done'>('idle');

  // URL params (unchanged)
  const boxes = searchParams.get('boxes') || '0';
  const moveOutDate = searchParams.get('moveOutDate') || '';
  const moveInDate = searchParams.get('moveInDate') || '';
  const moveOutTime = searchParams.get('moveOutTime') || '';
  const moveInTime = searchParams.get('moveInTime') || '';
  const dorm = searchParams.get('dorm') || '';
  const elevator = searchParams.get('elevator') || '';
  const stairs = searchParams.get('stairs') || '';
  const room = searchParams.get('room') || '';
  const instructions = searchParams.get('instructions') || '';
  const school = searchParams.get('school') || 'Stonehill College';

  const storageMonths = (() => {
    if (!moveOutDate || !moveInDate) return 3;
    const diff = (new Date(moveInDate).getTime() - new Date(moveOutDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    return Math.max(3, Math.round(diff));
  })();

  const getBoxPrice = (qty: number) => getBoxUnitPriceCents(qty) / 100;
  const getBoxPriceCents = (qty: number) => getBoxUnitPriceCents(qty);

  const boxQty = Math.max(0, parseInt(boxes, 10) || 0);
  const boxPrice = getBoxPrice(boxQty);
  const boxesTotal = boxPrice * boxQty;

  const itemPrices: Record<string, number> = { ...ADDON_PRICE_USD_MONTH };

  let itemsTotal = 0;
  const itemsWithPrices: { label: string; price: number }[] = [];
  ['smallWithBox', 'smallWithoutBox', 'mediumWithBox', 'mediumWithoutBox', 'large'].forEach(key => {
    const qty = parseInt(searchParams.get(key) || '0');
    if (qty > 0) {
      const lineTotal = qty * itemPrices[key];
      itemsTotal += lineTotal;
      itemsWithPrices.push({
        label: `${qty}× ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
        price: lineTotal,
      });
    }
  });

  const monthlyTotal = boxesTotal + itemsTotal;
  const monthlyTotalCents = Math.round(monthlyTotal * 100);
  const totalPrice = monthlyTotal * storageMonths;
  const buildBookingPayload = useCallback((): CreateBookingInput | null => {
    if (!userId || !moveOutDate || !moveInDate || !moveOutTime || !dorm || !elevator || !stairs) return null;
    const additionalQty = ['smallWithBox', 'smallWithoutBox', 'mediumWithBox', 'mediumWithoutBox', 'large']
      .reduce((sum, key) => sum + parseInt(searchParams.get(key) || '0', 10), 0);
    if (boxQty < 1 && additionalQty < 1) return null;
    if (additionalQty > MAX_ADDITIONAL_ITEMS) return null;
    if (boxQty >= 1 && (parseInt(searchParams.get('smallWithoutBox') || '0', 10) > 0 || parseInt(searchParams.get('mediumWithoutBox') || '0', 10) > 0)) return null;
    if (boxQty < 1 && (parseInt(searchParams.get('smallWithBox') || '0', 10) > 0 || parseInt(searchParams.get('mediumWithBox') || '0', 10) > 0)) return null;
    const items: CreateBookingInput['items'] = [];
    if (boxQty > 0) {
      items.push({ item_type: 'box', quantity: boxQty, unit_price_cents: getBoxPriceCents(boxQty) });
    }
    ['smallWithBox', 'smallWithoutBox', 'mediumWithBox', 'mediumWithoutBox', 'large'].forEach(key => {
      const qty = parseInt(searchParams.get(key) || '0', 10);
      if (qty > 0) {
        const itemType = ITEM_TYPE_MAP[key];
        items.push({
          item_type: itemType,
          quantity: qty,
          unit_price_cents: ADDON_UNIT_PRICE_CENTS[itemType as Exclude<BookingItemType, 'box'>],
        });
      }
    });
    return {
      user_id: userId,
      move_out_date: moveOutDate,
      move_in_date: moveInDate,
      move_out_time_slot: moveOutTime,
      move_in_time_slot: moveInTime || undefined,
      dorm,
      room: room || undefined,
      elevator_available: elevator === 'yes',
      stairs_required: stairs === 'yes',
      special_instructions: instructions || undefined,
      school,
      monthly_total_cents: monthlyTotalCents,
      items,
      payment_plan: 'full',
    };
  }, [userId, moveOutDate, moveInDate, moveOutTime, moveInTime, dorm, elevator, stairs, room, instructions, school, boxQty, monthlyTotalCents, searchParams]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
      const meta = user?.user_metadata as { full_name?: string; first_name?: string } | undefined;
      const first = (meta?.first_name || meta?.full_name?.split(' ')[0] || '').trim();
      setFirstName(first);
    });
  }, []);

  const venmoSlug = getVenmoHandleFromEnv();
  const balanceDue = Math.max(0, totalPrice - 50);
  const balanceDueCents = Math.round(balanceDue * 100);
  const venmoAmountLabel = `$${balanceDue.toFixed(2)}`;

  const handleSaveBookingAndPayVenmo = async () => {
    if (!userId) {
      router.push(`/auth/login?redirect=${encodeURIComponent(`/booking/payment?${searchParams.toString()}`)}`);
      return;
    }
    if (!venmoSlug) {
      setError('Venmo checkout is not configured. Please contact support.');
      return;
    }
    const payload = buildBookingPayload();
    if (!payload) {
      setError('Missing booking details.');
      return;
    }

    // Open a named tab synchronously on click so popup blockers don't kill it —
    // we'll rewrite its URL after createBooking returns. If the tab is blocked,
    // we fall back to current-window navigation.
    const venmoTab = window.open('about:blank', 'venmo-pay');

    setError(null);
    setProcessing(true);
    setStep('creating');
    try {
      const bookingResult = await createBooking(payload);
      if (!bookingResult.success) {
        setError(bookingResult.error);
        setProcessing(false);
        setStep('idle');
        venmoTab?.close();
        return;
      }
      setStep('done');
      const bookingId = bookingResult.bookingId;
      const note = buildVenmoNote({ kind: 'booking', bookingId, firstName });
      const venmoUrl = buildVenmoPayUrl({
        slug: venmoSlug,
        amount: balanceDue,
        note,
      });

      if (venmoTab && !venmoTab.closed) {
        venmoTab.location.href = venmoUrl;
      } else {
        // Popup was blocked — fall back to opening in the same tab, then the
        // user can hit back to reach the confirmed page.
        window.location.href = venmoUrl;
        return;
      }

      const confirmedBase =
        `/booking/confirmed?moveOutDate=${moveOutDate}&school=${encodeURIComponent(school)}&boxes=${boxes}&monthlyTotal=${monthlyTotal}&totalPrice=${totalPrice}&months=${storageMonths}` +
        `&venmoPending=1&bookingId=${encodeURIComponent(bookingId)}` +
        `&venmoAmount=${balanceDueCents}` +
        (firstName ? `&fn=${encodeURIComponent(firstName)}` : '');

      window.location.href = `${confirmedBase}&paymentPlan=full`;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setProcessing(false);
      setStep('idle');
      venmoTab?.close();
    }
  };

  const stepLabel = step === 'creating' ? 'Saving your booking…' : 'Continue';

  return (
    <AuthPageWrapper>
      <div className="booking-payment-page">
        <div className="booking-payment-container">
        <div className="booking-payment-header">
          <Link href="/">
            <Image src="/brand/notime-storage-logo.png" alt="NoTime Storage" width={80} height={80} style={{ marginBottom: '24px', display: 'block' }} />
          </Link>
          <h1>Review & Pay</h1>
          <p>Confirm your details and complete payment</p>
        </div>

      <div className="booking-payment-content">
        {/* Order summary: first in DOM for mobile; CSS order places it right on ≥768px */}
        <div className="booking-order-summary">
            <h2>Booking Summary</h2>

            <div className="booking-summary-section booking-summary-details">
              <h3>Details</h3>
              <div className="booking-summary-line">
                <span className="booking-summary-label">School</span>
                <span>{school}</span>
              </div>
              <div className="booking-summary-line">
                <span className="booking-summary-label">Move-out</span>
                <span>{formatDate(moveOutDate)} at {formatTime(moveOutTime)}</span>
              </div>
              {moveInDate && (
                <div className="booking-summary-line">
                  <span className="booking-summary-label">Move-in</span>
                  <span>{formatDate(moveInDate)}</span>
                </div>
              )}
              <div className="booking-summary-line">
                <span className="booking-summary-label">Location</span>
                <span>{dorm}{room ? `, Room ${room}` : ''}</span>
              </div>
              <div className="booking-summary-line">
                <span className="booking-summary-label">Access</span>
                <span>{elevator === 'yes' ? 'Elevator' : 'No elevator'}{stairs === 'yes' ? ', stairs' : ''}</span>
              </div>
            </div>

            <div className="booking-summary-section booking-summary-storage">
              <h3>Storage</h3>
              {/* Boxes: label alone, then quantity + price row */}
              {boxQty > 0 && (
                <div className="booking-summary-storage-block">
                  <div className="booking-summary-storage-label">Boxes</div>
                  <div className="booking-summary-line">
                    <span>{boxQty} {boxQty === 1 ? 'Box' : 'Boxes'}</span>
                    <span>${boxesTotal.toFixed(2)}/mo</span>
                  </div>
                </div>
              )}
              {/* Additional: label alone, then each item + price right-aligned */}
              {itemsWithPrices.length > 0 && (
                <div className="booking-summary-storage-block">
                  <div className="booking-summary-storage-label">Additional</div>
                  <div className="booking-summary-storage-items">
                    {itemsWithPrices.map((item, i) => (
                      <div key={i} className="booking-summary-line">
                        <span>{item.label}</span>
                        <span className="booking-summary-storage-item-price">${item.price.toFixed(2)}/mo</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="booking-summary-section">
              <div className="booking-summary-line">
                <span>Monthly total</span>
                <span>${monthlyTotal.toFixed(2)}/month</span>
              </div>
              <div className="booking-summary-line">
                <span>Duration</span>
                <span>{storageMonths} months</span>
              </div>
              <div className="booking-summary-line" style={{ color: '#000' }}>
                <span>Subtotal</span>
                <span style={{ textDecoration: 'line-through', textDecorationColor: 'red' }}>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="booking-summary-line" style={{ color: 'var(--color-latte)', fontSize: '14px' }}>
                <span>Deposit (already paid)</span>
                <span style={{ color: '#2e7d32', fontWeight: '600' }}>−$50.00</span>
              </div>
            </div>

            <div className="booking-summary-total">
              <span>Total due today (pay in full)</span>
              <span>${(totalPrice - 50).toFixed(2)}</span>
            </div>
          </div>

        {/* Payment: CSS order places it left on ≥768px */}
        <div className="booking-payment-card">
            <h2>Payment</h2>
            <div className="payment-trust-message">
              Your $50 deposit is already applied. Pay the remaining <strong>{venmoAmountLabel}</strong> on Venmo — amount and note are pre-filled.
            </div>

            {!venmoSlug && (
              <div className="payment-error-message" role="status">
                Venmo checkout is not configured. Please email{' '}
                <a href={`mailto:${SITE_CONTACT_EMAIL}`} style={{ fontWeight: 700 }}>
                  {SITE_CONTACT_EMAIL}
                </a>{' '}
                to complete your booking.
              </div>
            )}

            {error && (
              <div className="payment-error-message" role="alert">
                {error}
              </div>
            )}

            {venmoSlug && (
              <div
                style={{
                  margin: '0 0 20px',
                  padding: '16px 18px',
                  background: 'var(--color-paper)',
                  border: '1px solid var(--color-latte)',
                  borderRadius: '12px',
                  fontSize: '0.88rem',
                  color: 'var(--color-coffee)',
                  lineHeight: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {[
                  'Tap the button below — we save your spot and open Venmo.',
                  'Confirm the pre-filled payment (Venmo app or web).',
                  'We verify the transfer and email your booking confirmation within one business day.',
                ].map((text, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <span
                      style={{
                        flexShrink: 0,
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: 'var(--color-coffee)',
                        color: 'var(--color-latte-soft)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: 1,
                        marginTop: '1px',
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ flex: 1 }}>{text}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              className="booking-payment-button"
              onClick={handleSaveBookingAndPayVenmo}
              disabled={!venmoSlug || processing}
            >
              {processing && <span className="payment-spinner" aria-hidden />}
              {processing ? stepLabel : 'Book my Storage'}
            </button>

            <div className="payment-trust-badges">
              <span>Pay securely through Venmo · no card info stored</span>
            </div>
          </div>
        </div>

        <Link href={`/booking/schedule?${searchParams.toString()}`} className="booking-payment-back">
          ← Edit details
        </Link>
          </div>
        </div>
    </AuthPageWrapper>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<AuthPageWrapper><div className="booking-payment-page" /></AuthPageWrapper>}>
      <PaymentPageContent />
    </Suspense>
  );
}
