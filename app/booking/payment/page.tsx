'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { createBooking } from '@/lib/booking/create-booking';
import { chargeBookingPayment } from '@/lib/square/charge-booking';
import type { CreateBookingInput, BookingItemType } from '@/lib/booking/types';
import { formatDate, formatTime } from '@/lib/utils/date';
import { AuthPageWrapper } from '@/app/components/AuthPageWrapper';

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

  const [applePayInstance, setApplePayInstance] = useState<any>(null);
  const [googlePayInstance, setGooglePayInstance] = useState<any>(null);

  const cardInstanceRef = useRef<any>(null);
  const applePayRef = useRef<any>(null);
  const googlePayRef = useRef<any>(null);
  const paymentProcessorRef = useRef<((token: string) => Promise<void>) | null>(null);

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

  const getBoxPrice = (qty: number) => {
    if (qty === 0) return 0;
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
  const totalPriceCents = Math.round((totalPrice - 50) * 100);

  const buildBookingPayload = useCallback((): CreateBookingInput | null => {
    if (!userId || !moveOutDate || !moveInDate || !moveOutTime || !dorm || !elevator || !stairs) return null;
    const additionalQty = ['smallWithBox', 'smallWithoutBox', 'mediumWithBox', 'mediumWithoutBox', 'large']
      .reduce((sum, key) => sum + parseInt(searchParams.get(key) || '0'), 0);
    if (boxQty < 1 && additionalQty < 1) return null;
    if (boxQty === 0 && (additionalQty < 1 || additionalQty > 4)) return null;
    const items: CreateBookingInput['items'] = [];
    if (boxQty > 0) {
      items.push({ item_type: 'box', quantity: boxQty, unit_price_cents: getBoxPriceCents(boxQty) });
    }
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
  }, [userId, moveOutDate, moveInDate, moveOutTime, dorm, elevator, stairs, room, instructions, school, boxQty, monthlyTotalCents, searchParams]);

  const processPaymentWithToken = useCallback(async (token: string) => {
    const payload = buildBookingPayload();
    if (!payload) {
      setError('Missing booking details.');
      setProcessing(false);
      return;
    }
    setStep('creating');
    const bookingResult = await createBooking(payload);
    if (!bookingResult.success) {
      setError(bookingResult.error);
      setProcessing(false);
      setStep('idle');
      return;
    }
    setStep('charging');
    const chargeResult = await chargeBookingPayment(token, bookingResult.bookingId, totalPriceCents);
    if (!chargeResult.success) {
      setError(`Payment failed: ${chargeResult.error} — Your booking was saved but not charged. Please contact support.`);
      setProcessing(false);
      setStep('idle');
      return;
    }
    setStep('done');
    window.location.href = `/booking/confirmed?moveOutDate=${moveOutDate}&school=${encodeURIComponent(school)}&boxes=${boxes}&monthlyTotal=${monthlyTotal}&totalPrice=${totalPrice}&months=${storageMonths}`;
  }, [buildBookingPayload, totalPriceCents, moveOutDate, school, boxes, monthlyTotal, totalPrice, storageMonths]);

  paymentProcessorRef.current = processPaymentWithToken;

  // Load user + Square config
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));
    fetch('/api/square-config')
      .then(r => r.json())
      .then(({ applicationId, locationId: loc, isSandbox: sb }) => {
        setAppId(applicationId);
        setLocationId(loc);
        setIsSandbox(sb);
      })
      .catch(console.error);
  }, []);

  // Init Square Web Payments SDK (card + wallets), existing script pattern
  useEffect(() => {
    if (!appId || !locationId) return;
    if (cardInstanceRef.current) return;

    let googlePayCleanup: (() => void) | null = null;
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

        // Square card style: only properties Square accepts (no boxShadow, no fontSize).
        const card = await payments.card({
          style: {
            input: {
              color: '#4B2E25',
              fontFamily: 'Helvetica Neue, sans-serif',
            },
            '.input-container': {
              borderColor: '#C9A47E',
              borderRadius: '8px',
              borderWidth: '2px',
            },
            '.input-container.is-focus': {
              borderColor: '#4B2E25',
              borderWidth: '2px',
            },
            '.input-container.is-error': {
              borderColor: '#991b1b',
            },
            '.message-text': { color: '#4B2E25' },
          },
        });
        await card.attach('#sq-card-booking');
        cardInstanceRef.current = card;
        setSdkReady(true);

        // PaymentRequest: amount must be decimal string for display (e.g. "393.00"), not cents
        const totalAmountDisplay = (totalPriceCents / 100).toFixed(2);
        const paymentRequest = payments.paymentRequest({
          countryCode: 'US',
          currencyCode: 'USD',
          total: { amount: totalAmountDisplay, label: 'NoTime Storage' },
        });

        // Apple Pay: create with paymentRequest, no attach (Square docs). Custom button + tokenize on click.
        try {
          const applePay = await payments.applePay(paymentRequest);
          applePayRef.current = applePay;
          setApplePayInstance(applePay);
        } catch (e) {
          console.log('Apple Pay not available', e);
        }

        // Google Pay: create with paymentRequest, attach to div with button options only
        try {
          const googlePay = await payments.googlePay(paymentRequest);
          await googlePay.attach('#google-pay-button', { buttonColor: 'default', buttonType: 'long' });
          googlePayRef.current = googlePay;
          setGooglePayInstance(googlePay);
          const googlePayEl = document.getElementById('google-pay-button');
          const onGooglePayClick = async () => {
            setProcessing(true);
            setError(null);
            try {
              const result = await googlePay.tokenize();
              if (result.status === 'OK' && result.token) {
                await paymentProcessorRef.current?.(result.token);
              } else {
                setError(result.errors?.[0]?.message ?? 'Google Pay failed');
              }
            } catch (err: any) {
              setError(err?.message ?? 'Google Pay failed');
            } finally {
              setProcessing(false);
            }
          };
          googlePayEl?.addEventListener('click', onGooglePayClick);
          googlePayCleanup = () => googlePayEl?.removeEventListener('click', onGooglePayClick);
        } catch (e) {
          console.log('Google Pay not available', e);
        }
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
  }, [appId, locationId, isSandbox, totalPriceCents]);

  const handleApplePayClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!applePayRef.current) return;
    setError(null);
    setProcessing(true);
    try {
      const result = await applePayRef.current.tokenize();
      if (result.status === 'OK' && result.token) {
        await processPaymentWithToken(result.token);
      } else {
        setError(result.errors?.[0]?.message ?? 'Apple Pay failed');
      }
    } catch (err: any) {
      setError(err?.message ?? 'Apple Pay failed');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayAndConfirm = async () => {
    if (!userId) {
      router.push(`/auth/login?redirect=${encodeURIComponent(`/booking/payment?${searchParams.toString()}`)}`);
      return;
    }
    if (!cardInstanceRef.current) {
      setError('Payment form not ready. Please wait.');
      return;
    }
    setError(null);
    setProcessing(true);
    try {
      const tokenResult = await cardInstanceRef.current.tokenize();
      if (tokenResult.status !== 'OK') {
        setError(tokenResult.errors?.[0]?.message ?? 'Card details invalid.');
        setProcessing(false);
        return;
      }
      await processPaymentWithToken(tokenResult.token);
    } catch (err: any) {
      setError(err?.message ?? 'Payment processing failed. Please try again.');
      setProcessing(false);
    }
  };

  const stepLabel = step === 'creating' ? 'Saving booking…' : step === 'charging' ? 'Processing payment…' : 'Pay & Confirm';
  const hasWallet = applePayInstance || googlePayInstance;

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
          {/* Left: Order Summary */}
          <div className="booking-order-summary">
            <h2>Booking Summary</h2>

            <div className="booking-summary-section">
              <h3>Details</h3>
              <div className="booking-summary-line">
                <span>School</span>
                <span>{school}</span>
              </div>
              <div className="booking-summary-line">
                <span>Move-out</span>
                <span>{formatDate(moveOutDate)} at {formatTime(moveOutTime)}</span>
              </div>
              {moveInDate && (
                <div className="booking-summary-line">
                  <span>Move-in</span>
                  <span>{formatDate(moveInDate)}</span>
                </div>
              )}
              <div className="booking-summary-line">
                <span>Location</span>
                <span>{dorm}{room ? `, Room ${room}` : ''}</span>
              </div>
              <div className="booking-summary-line">
                <span>Access</span>
                <span>{elevator === 'yes' ? 'Elevator' : 'No elevator'}{stairs === 'yes' ? ', stairs' : ''}</span>
              </div>
            </div>

            <div className="booking-summary-section">
              <h3>Storage</h3>
              {boxQty > 0 && (
                <div className="booking-summary-line">
                  <span>{boxQty} {boxQty === 1 ? 'Box' : 'Boxes'}</span>
                  <span>${boxesTotal}/mo</span>
                </div>
              )}
              {boxQty === 0 && itemsList.length > 0 && (
                <div className="booking-summary-line">
                  <span>Items only (no boxes)</span>
                  <span>${itemsTotal.toFixed(2)}/mo</span>
                </div>
              )}
              {itemsList.length > 0 && (
                <div className="booking-summary-line">
                  <span>{boxQty === 0 ? 'Items' : 'Additional'}</span>
                  <span>{itemsList.join(', ')}</span>
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
              {/* Original subtotal — crossed out, deposit not yet deducted */}
              <div className="booking-summary-line" style={{ opacity: 0.55 }}>
                <span>Subtotal</span>
                <span style={{ textDecoration: 'line-through' }}>${totalPrice.toFixed(2)}</span>
              </div>
              {/* Deposit deduction */}
              <div className="booking-summary-line" style={{ color: 'var(--color-latte)', fontSize: '14px' }}>
                <span>Deposit (already paid)</span>
                <span style={{ color: '#2e7d32', fontWeight: '600' }}>−$50.00</span>
              </div>
              {/* Discounted subtotal */}
              <div className="booking-summary-line highlight">
                <span>Subtotal after deposit</span>
                <span>${(totalPrice - 50).toFixed(2)}</span>
              </div>
            </div>

            <div className="booking-summary-total">
              <span>Total due today</span>
              <span>${(totalPrice - 50).toFixed(2)}</span>
            </div>
          </div>

          {/* Right: Payment */}
          <div className="booking-payment-card">
            <h2>Payment</h2>
            <div className="payment-trust-message">
              Your $50 commitment deposit has been deducted. You will be charged <strong>${(totalPrice - 50).toFixed(2)}</strong> today.
            </div>

            {isSandbox && (
              <div className="sandbox-warning">
                Test mode — use card 4111 1111 1111 1111, any future date, any CVV. No real charges.
              </div>
            )}

            {error && (
              <div className="payment-error-message" role="alert">
                {error}
              </div>
            )}

            {/* Apple Pay: custom button (Square has no attach); Google Pay: attach renders into div */}
            <div className="payment-digital-wallets" style={{ display: hasWallet ? 'flex' : 'none' }}>
              {applePayInstance && (
                <button
                  type="button"
                  id="apple-pay-button"
                  className="payment-wallet-button payment-wallet-button-apple"
                  onClick={handleApplePayClick}
                  disabled={processing}
                  aria-label="Pay with Apple Pay"
                />
              )}
              <div id="google-pay-button" className="payment-wallet-button" />
            </div>

            {hasWallet && (
              <div className="payment-method-divider">
                <span>or pay with card</span>
              </div>
            )}

            <div id="sq-card-booking" className="square-card-container" />

            <button
              type="button"
              className="booking-payment-button"
              onClick={handlePayAndConfirm}
              disabled={!sdkReady || processing}
            >
              {processing && <span className="payment-spinner" aria-hidden />}
              {processing ? stepLabel : `Pay $${totalPrice.toFixed(2)} & Confirm`}
            </button>

            <div className="payment-trust-badges">
              <span>🔒 256-bit encrypted</span>
              <span>✓ PCI compliant</span>
              <span>Powered by Square</span>
            </div>
          </div>
        </div>

        <Link href={`/booking/schedule?${searchParams.toString()}`} className="booking-payment-back">
          ← Edit details
        </Link>
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
