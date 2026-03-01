'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { createBooking } from '@/lib/booking/create-booking';
import { chargeBookingPayment } from '@/lib/square/charge-booking';
import type { CreateBookingInput, BookingItemType } from '@/lib/booking/types';
import { formatDate, formatTime } from '@/lib/utils/date';

const ITEM_TYPE_MAP: Record<string, BookingItemType> = {
  smallWithBox: 'small_with_box',
  smallWithoutBox: 'small_without_box',
  mediumWithBox: 'medium_with_box',
  mediumWithoutBox: 'medium_without_box',
  large: 'large',
};

const UNIT_PRICE_CENTS: Record<string, number> = {
  small_with_box: 900,
  small_without_box: 1100,
  medium_with_box: 900,
  medium_without_box: 1200,
  large: 1500,
};

function PaymentPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [isSandbox, setIsSandbox] = useState(true);
  const [appId, setAppId] = useState('');
  const [locationId, setLocationId] = useState('');

  const [sdkReady, setSdkReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'idle' | 'creating' | 'charging' | 'done'>('idle');

  const cardInstanceRef = useRef<any>(null);

  // Load user + Square config from server
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));

    // Fetch Square config from a simple API route
    fetch('/api/square-config')
      .then(r => r.json())
      .then(({ applicationId, locationId: loc, isSandbox: sb }) => {
        setAppId(applicationId);
        setLocationId(loc);
        setIsSandbox(sb);
      })
      .catch(console.error);
  }, []);

  // Init Square Web Payments SDK once we have config
  useEffect(() => {
    if (!appId || !locationId) return;
    if (cardInstanceRef.current) return;

    const scriptSrc = isSandbox
      ? 'https://sandbox.web.squarecdn.com/v1/square.js'
      : 'https://web.squarecdn.com/v1/square.js';

    const existing = document.querySelector(`script[src="${scriptSrc}"]`);
    const initSquare = async () => {
      if (cardInstanceRef.current) return;
      try {
        const sq = (window as any).Square;
        if (!sq) return;
        const payments = sq.payments(appId, locationId);
        const container = document.getElementById('sq-card-booking');
        if (container) container.innerHTML = '';
        const card = await payments.card({
          style: {
            input: { color: '#4B2E25', fontSize: '15px' },
            '.input-container': { borderColor: '#C9A47E', borderRadius: '8px' },
            '.input-container.is-focus': { borderColor: '#4B2E25' },
          },
        });
        await card.attach('#sq-card-booking');
        cardInstanceRef.current = card;
        setSdkReady(true);
      } catch (err: any) {
        setError(err?.message ?? 'Could not load payment form.');
      }
    };

    if (existing) {
      initSquare();
    } else {
      const script = document.createElement('script');
      script.src = scriptSrc;
      script.onload = initSquare;
      script.onerror = () => setError('Failed to load payment SDK. Please refresh.');
      document.head.appendChild(script);
    }

    return () => { cardInstanceRef.current?.destroy?.(); cardInstanceRef.current = null; };
  }, [appId, locationId, isSandbox]);

  // URL params
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

  // Pricing
  const storageMonths = (() => {
    if (!moveOutDate || !moveInDate) return 3;
    const diff = (new Date(moveInDate).getTime() - new Date(moveOutDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    return Math.max(3, Math.round(diff));
  })();

  const getBoxPrice = (qty: number) => {
    if (qty === 1) return 80;
    if (qty === 2 || qty === 3) return 55;
    if (qty >= 4) return 60;
    return 80;
  };
  const getBoxPriceCents = (qty: number) => getBoxPrice(qty) * 100;

  const boxQty = parseInt(boxes);
  const boxPrice = getBoxPrice(boxQty);
  const boxesTotal = boxPrice * boxQty;

  const itemPrices: Record<string, number> = {
    smallWithBox: 9, smallWithoutBox: 11,
    mediumWithBox: 9, mediumWithoutBox: 12, large: 15,
  };

  let itemsTotal = 0;
  const itemsList: string[] = [];
  ['smallWithBox', 'smallWithoutBox', 'mediumWithBox', 'mediumWithoutBox', 'large'].forEach(key => {
    const qty = parseInt(searchParams.get(key) || '0');
    if (qty > 0) {
      itemsTotal += qty * itemPrices[key];
      itemsList.push(`${qty}× ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
    }
  });

  const monthlyTotal = boxesTotal + itemsTotal;
  const monthlyTotalCents = Math.round(monthlyTotal * 100);
  const totalPrice = monthlyTotal * storageMonths;
  const totalPriceCents = Math.round(totalPrice * 100);

  const buildBookingPayload = (): CreateBookingInput | null => {
    if (!userId || !moveOutDate || !moveInDate || !moveOutTime || !dorm || !elevator || !stairs) return null;
    if (boxQty < 1) return null;
    const items: CreateBookingInput['items'] = [];
    items.push({ item_type: 'box', quantity: boxQty, unit_price_cents: getBoxPriceCents(boxQty) });
    ['smallWithBox', 'smallWithoutBox', 'mediumWithBox', 'mediumWithoutBox', 'large'].forEach(key => {
      const qty = parseInt(searchParams.get(key) || '0');
      if (qty > 0) {
        const itemType = ITEM_TYPE_MAP[key];
        items.push({ item_type: itemType, quantity: qty, unit_price_cents: UNIT_PRICE_CENTS[itemType] });
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
    };
  };

  const handlePayAndConfirm = async () => {
    if (!userId) {
      router.push(`/auth/login?redirect=${encodeURIComponent(`/booking/payment?${searchParams.toString()}`)}`);
      return;
    }
    if (!cardInstanceRef.current) { setError('Payment form not ready. Please wait.'); return; }

    setError(null);
    setProcessing(true);

    // Step 1: tokenize card
    const tokenResult = await cardInstanceRef.current.tokenize();
    if (tokenResult.status !== 'OK') {
      setError(tokenResult.errors?.[0]?.message ?? 'Card details invalid.');
      setProcessing(false);
      return;
    }

    // Step 2: create booking
    setStep('creating');
    const payload = buildBookingPayload();
    if (!payload) { setError('Missing booking details.'); setProcessing(false); return; }

    const bookingResult = await createBooking(payload);
    if (!bookingResult.success) {
      setError(bookingResult.error);
      setProcessing(false);
      setStep('idle');
      return;
    }

    // Step 3: charge card
    setStep('charging');
    const chargeResult = await chargeBookingPayment(
      tokenResult.token,
      bookingResult.bookingId,
      totalPriceCents,
    );

    if (!chargeResult.success) {
      setError(`Payment failed: ${chargeResult.error} — Your booking was saved but not charged. Please contact support.`);
      setProcessing(false);
      setStep('idle');
      return;
    }

    // Step 4: redirect to confirmed
    setStep('done');
    window.location.href = `/booking/confirmed?moveOutDate=${moveOutDate}&school=${encodeURIComponent(school)}&boxes=${boxes}&monthlyTotal=${monthlyTotal}&totalPrice=${totalPrice}&months=${storageMonths}`;
  };

  const stepLabel = step === 'creating' ? 'Saving booking…' : step === 'charging' ? 'Processing payment…' : 'Pay & Confirm';

  return (
    <div className="auth-container">
      <div style={{ maxWidth: '800px', width: '100%', background: 'white', borderRadius: '16px', padding: 'clamp(20px, 5vw, 48px)', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Link href="/">
            <Image src="/brand/notime-storage-logo.png" alt="NoTime Storage" width={80} height={80} style={{ marginBottom: '24px' }} />
          </Link>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--color-coffee)', marginBottom: '12px' }}>
            Review & Pay
          </h1>
          <p style={{ fontSize: '1.125rem', color: 'var(--color-gray-600)' }}>
            Confirm your details and complete payment
          </p>
        </div>

        {/* Booking Summary */}
        <div style={{ padding: '28px', background: 'var(--color-paper)', borderRadius: '12px', marginBottom: '28px', border: '2px solid var(--color-latte)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-coffee)', marginBottom: '20px' }}>Booking Summary</h2>

          <div style={{ color: 'var(--color-gray-700)', fontSize: '0.875rem', lineHeight: '2', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--color-latte)' }}>
            <div><strong>School:</strong> {school}</div>
            <div><strong>Move-out:</strong> {formatDate(moveOutDate)} at {formatTime(moveOutTime)}</div>
            {moveInDate && <div><strong>Move-in:</strong> {formatDate(moveInDate)}</div>}
            <div><strong>Location:</strong> {dorm}{room ? `, Room ${room}` : ''}</div>
            <div><strong>Access:</strong> {elevator === 'yes' ? 'Elevator available' : 'No elevator'}{stairs === 'yes' ? ', stairs required' : ''}</div>
            <div><strong>Boxes:</strong> {boxQty} × ${boxPrice}/mo = ${boxesTotal}/mo</div>
            {itemsList.length > 0 && <div><strong>Additional:</strong> {itemsList.join(', ')}</div>}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#9E8E88', marginBottom: '4px' }}>{storageMonths} months storage</div>
              {/* Crossed-out: storage total + $50 deposit (what it would cost without the deposit) */}
              <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#C0A090', textDecoration: 'line-through', textDecorationColor: '#E53E3E', textDecorationThickness: '2px' }}>
                ${(totalPrice + 50).toFixed(2)}
              </div>
              {/* Actual charge: storage total only (deposit already paid) */}
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-coffee)', lineHeight: '1.1' }}>
                ${totalPrice.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#2D7D46', fontWeight: '600', marginTop: '2px' }}>$50 deposit already applied ✓</div>
            </div>
            <div style={{ textAlign: 'right', color: '#9E8E88', fontSize: '0.8rem' }}>${monthlyTotal}/month</div>
          </div>
        </div>

        {/* Payment section */}
        <div style={{ padding: '28px', background: 'var(--color-paper)', borderRadius: '12px', marginBottom: '24px', border: '2px solid var(--color-latte)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-coffee)', marginBottom: '6px' }}>Payment</h2>
          <p style={{ fontSize: '0.875rem', color: '#6B5A52', marginBottom: '20px' }}>
            Your <strong>$50 commitment deposit</strong> has been deducted. You will be charged <strong>${totalPrice.toFixed(2)}</strong> today.
          </p>

          {isSandbox && (
            <div style={{ background: '#FEF9C3', border: '1px solid #FDE047', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '0.8rem', color: '#713F12' }}>
              <strong>Sandbox mode</strong> — Test card: <code>4111 1111 1111 1111</code>, any future date, any CVV.
            </div>
          )}

          <div id="sq-card-booking" style={{ minHeight: '89px', marginBottom: '8px' }} />
        </div>

        {error && (
          <div style={{ padding: '12px 16px', marginBottom: '16px', background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: '8px', color: '#B91C1C', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <button
            type="button"
            onClick={handlePayAndConfirm}
            disabled={!sdkReady || processing}
            className="button-primary"
            style={{ width: '100%', padding: '16px', fontSize: '1.1rem', opacity: (!sdkReady || processing) ? 0.65 : 1, cursor: (!sdkReady || processing) ? 'wait' : 'pointer' }}
          >
            {processing ? stepLabel : `Pay $${totalPrice.toFixed(2)} & Confirm`}
          </button>

          <Link href={`/booking/schedule?${searchParams.toString()}`}>
            <button type="button" className="button-secondary" style={{ padding: '10px 28px', fontSize: '0.9rem' }}>
              ← Edit Details
            </button>
          </Link>
        </div>

        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.78rem', color: '#9E8E88' }}>
          Secured by Square · $50 deposit already applied
        </p>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="auth-container" />}>
      <PaymentPageContent />
    </Suspense>
  );
}
