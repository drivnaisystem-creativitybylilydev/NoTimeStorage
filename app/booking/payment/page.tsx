'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { createBooking } from '@/lib/booking/create-booking';
import { chargeBookingPayment } from '@/lib/square/charge-booking';
import { chargeFirstMonthPayment, createMonthlyPaymentSchedule } from '@/app/actions/monthly-payments';
import type { CreateBookingInput, BookingItemType } from '@/lib/booking/types';
import { formatDate, formatTime } from '@/lib/utils/date';
import { AuthPageWrapper } from '@/app/components/AuthPageWrapper';
import { isEligibleForMonthlyPlan, calculateMonthlyBreakdown } from '@/lib/payment-plan-calculator';

const ITEM_TYPE_MAP: Record<string, BookingItemType> = {
  smallWithBox: 'small_with_box',
  smallWithoutBox: 'small_without_box',
  mediumWithBox: 'medium_with_box',
  mediumWithoutBox: 'medium_without_box',
  large: 'large',
};

const UNIT_PRICE_CENTS: Record<string, number> = {
  // TEST PRICES — change back to 900/1100/900/1200/1500 after testing
  small_with_box: 100,
  small_without_box: 100,
  medium_with_box: 100,
  medium_without_box: 100,
  large: 100,
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
  const paymentsRef = useRef<any>(null);
  const [billingAddress, setBillingAddress] = useState<{ addressLine1: string; city: string; state?: string; postalCode: string; country?: string }>({
    addressLine1: '', city: '', state: '', postalCode: '', country: 'US',
  });
  const paymentProcessorRef = useRef<((token: string, verificationToken?: string, billingAddress?: { addressLine1: string; city: string; state?: string; postalCode: string; country?: string }) => Promise<void>) | null>(null);
  const initializingRef = useRef(false);

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
  const paymentPlan = (searchParams.get('paymentPlan') || 'full') as 'full' | 'monthly';

  const storageMonths = (() => {
    if (!moveOutDate || !moveInDate) return 3;
    const diff = (new Date(moveInDate).getTime() - new Date(moveOutDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    return Math.max(3, Math.round(diff));
  })();

  const getBoxPrice = (qty: number) => {
    // TEST PRICES — change back to 80/55/60 after testing
    if (qty === 0) return 0;
    return 1;
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
  // totalPriceCents = remaining balance after deposit (used for full-pay charge)
  const totalPriceCents = Math.round((totalPrice - 50) * 100);
  // fullPriceCents = total before deposit (used as input to monthly breakdown)
  const fullPriceCents = Math.round(totalPrice * 100);

  const monthlyBreakdown =
    paymentPlan === 'monthly' && isEligibleForMonthlyPlan(totalPriceCents)
      ? calculateMonthlyBreakdown(fullPriceCents, new Date())
      : null;

  // Amount actually charged today
  const dueTodayCents = monthlyBreakdown ? monthlyBreakdown.month1Cents : totalPriceCents;

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
      payment_plan: paymentPlan,
    };
  }, [userId, moveOutDate, moveInDate, moveOutTime, dorm, elevator, stairs, room, instructions, school, boxQty, monthlyTotalCents, paymentPlan, searchParams]);

  const DECLINE_MSG = 'Your card was declined. This can happen with new merchants. Please try a different card, or contact your bank to approve the transaction.';

  const formatPaymentError = useCallback((raw: string) => {
    const lower = raw.toLowerCase();
    if (lower.includes('generic_decline') || lower.includes('declined') || lower.includes('authorization error')) return DECLINE_MSG;
    return raw;
  }, []);

  const verifyAndProcess = useCallback(async (token: string) => {
    let verificationToken: string | undefined;
    const payments = paymentsRef.current;
    const hasBilling = billingAddress.addressLine1?.trim() && billingAddress.city?.trim() && billingAddress.postalCode?.trim();
    const billingContact = hasBilling ? {
      addressLines: [billingAddress.addressLine1.trim()],
      city: billingAddress.city.trim(),
      state: billingAddress.state?.trim() || undefined,
      postalCode: billingAddress.postalCode.trim(),
      country: billingAddress.country || 'US',
    } : {};

    if (payments?.verifyBuyer) {
      try {
        const verificationResult = await payments.verifyBuyer(token, {
          amount: (dueTodayCents / 100).toFixed(2),
          currencyCode: 'USD',
          intent: 'CHARGE',
          billingContact,
        });
        if (verificationResult?.token) verificationToken = verificationResult.token;
      } catch (err) {
        console.warn('[3DS] verifyBuyer failed, proceeding without:', err);
      }
    }

    const billingForApi = hasBilling ? {
      addressLine1: billingAddress.addressLine1.trim(),
      city: billingAddress.city.trim(),
      state: billingAddress.state?.trim(),
      postalCode: billingAddress.postalCode.trim(),
      country: billingAddress.country || 'US',
    } : undefined;

    await paymentProcessorRef.current?.(token, verificationToken, billingForApi);
  }, [dueTodayCents, billingAddress]);

  const processPaymentWithToken = useCallback(async (
    token: string,
    verificationToken?: string,
    billingAddress?: { addressLine1: string; city: string; state?: string; postalCode: string; country?: string },
  ) => {
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
    const bookingId = bookingResult.bookingId;
    const confirmedBase = `/booking/confirmed?moveOutDate=${moveOutDate}&school=${encodeURIComponent(school)}&boxes=${boxes}&monthlyTotal=${monthlyTotal}&totalPrice=${totalPrice}&months=${storageMonths}`;

    if (paymentPlan === 'monthly' && monthlyBreakdown) {
      // — Monthly path —
      const month1Result = await chargeFirstMonthPayment(token, bookingId, monthlyBreakdown.month1Cents, verificationToken, billingAddress);
      if (!month1Result.success) {
        setError(`Payment failed: ${formatPaymentError(month1Result.error)} — Your booking was saved. Please contact support.`);
        setProcessing(false);
        setStep('idle');
        return;
      }

      // Fire-and-forget invoice creation (non-blocking — booking is confirmed even if invoice fails)
      createMonthlyPaymentSchedule({
        bookingId,
        customerId: month1Result.customerId,
        cardId: month1Result.cardId,
        month2Cents: monthlyBreakdown.month2Cents,
        month2Date: monthlyBreakdown.month2Date,
        month3Cents: monthlyBreakdown.month3Cents,
        month3Date: monthlyBreakdown.month3Date,
      }).catch((err) => console.error('[monthly invoice]', err));

      setStep('done');
      window.location.href = `${confirmedBase}&paymentPlan=monthly&month1=${monthlyBreakdown.month1Cents}&month2=${monthlyBreakdown.month2Cents}&month2Date=${monthlyBreakdown.month2Date}&month3=${monthlyBreakdown.month3Cents}&month3Date=${monthlyBreakdown.month3Date}`;
    } else {
      // — Pay in Full path (unchanged) —
      const chargeResult = await chargeBookingPayment(token, bookingId, totalPriceCents, verificationToken, billingAddress);
      if (!chargeResult.success) {
        setError(`Payment failed: ${formatPaymentError(chargeResult.error)} — Your booking was saved but not charged. Please contact support.`);
        setProcessing(false);
        setStep('idle');
        return;
      }
      setStep('done');
      window.location.href = `${confirmedBase}&paymentPlan=full`;
    }
  }, [buildBookingPayload, totalPriceCents, paymentPlan, monthlyBreakdown, moveOutDate, school, boxes, monthlyTotal, totalPrice, storageMonths, formatPaymentError]);

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

    const waitForSquare = (): Promise<any> => new Promise((resolve, reject) => {
      const sq = (window as any).Square;
      if (sq) { resolve(sq); return; }
      let attempts = 0;
      const interval = setInterval(() => {
        const s = (window as any).Square;
        if (s) { clearInterval(interval); resolve(s); }
        else if (++attempts > 20) { clearInterval(interval); reject(new Error('Square SDK timed out')); }
      }, 150);
    });

    const existing = document.querySelector(`script[src="${scriptSrc}"]`);
    const initSquare = async () => {
      if (cardInstanceRef.current || initializingRef.current) return;
      initializingRef.current = true;
      try {
        const sq = await waitForSquare().catch(() => null);
        if (!sq) { initializingRef.current = false; return; }
        const payments = sq.payments(appId, locationId);
        paymentsRef.current = payments;
        const cardContainer = document.getElementById('sq-card-booking');
        if (cardContainer) cardContainer.innerHTML = '';

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
        const totalAmountDisplay = (dueTodayCents / 100).toFixed(2);
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
          if (googlePayRef.current) throw new Error('already attached');
          const gpContainer = document.getElementById('google-pay-button');
          if (gpContainer) gpContainer.innerHTML = '';
          const googlePay = await payments.googlePay(paymentRequest);
          // Double-check after async — another concurrent init may have won
          if (googlePayRef.current) {
            googlePay.destroy?.();
            throw new Error('already attached');
          }
          if (gpContainer) gpContainer.innerHTML = '';
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
          // Google Pay handles its own authentication natively — no verifyBuyer needed
          googlePayEl?.addEventListener('click', onGooglePayClick);
          googlePayCleanup = () => googlePayEl?.removeEventListener('click', onGooglePayClick);
        } catch (e) {
          console.log('Google Pay not available', e);
        }
      } catch (err: any) {
        setError(err?.message ?? 'Could not load payment form.');
      } finally {
        initializingRef.current = false;
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
      initializingRef.current = false;
      googlePayCleanup?.();
      if (googlePayRef.current && typeof googlePayRef.current.destroy === 'function') {
        googlePayRef.current.destroy();
      }
      googlePayRef.current = null;
      cardInstanceRef.current?.destroy?.();
      cardInstanceRef.current = null;
      applePayRef.current = null;
      setSdkReady(false);
      setApplePayInstance(null);
      setGooglePayInstance(null);
      const cardEl = document.getElementById('sq-card-booking');
      if (cardEl) cardEl.innerHTML = '';
      const gpEl = document.getElementById('google-pay-button');
      if (gpEl) gpEl.innerHTML = '';
    };
  }, [appId, locationId, isSandbox, dueTodayCents]);

  const handleApplePayClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!applePayRef.current) return;
    setError(null);
    setProcessing(true);
    try {
      const result = await applePayRef.current.tokenize();
      if (result.status === 'OK' && result.token) {
        await verifyAndProcess(result.token);
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
      await verifyAndProcess(tokenResult.token);
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

            {/* Payment schedule — monthly plan */}
            {paymentPlan === 'monthly' && monthlyBreakdown ? (
              <div className="payment-schedule-card">
                <div style={{ fontSize: '0.6875rem', fontWeight: '700', letterSpacing: '0.1em', color: 'var(--color-coffee)', marginBottom: '14px', textTransform: 'uppercase' }}>
                  Payment Schedule
                </div>

                {/* Month 1 — today */}
                <div className="payment-schedule-row today">
                  <div>
                    <div style={{ fontWeight: '700', color: 'var(--color-coffee)' }}>Today (Month 1)</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-gray-600)' }}>Auto-charged today</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <span style={{ color: '#2e7d32', fontWeight: '700' }}>✓</span>
                    <span style={{ fontWeight: '700', color: 'var(--color-coffee)', fontSize: '1.0625rem' }}>
                      ${(monthlyBreakdown.month1Cents / 100).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Month 2 */}
                <div className="payment-schedule-row future">
                  <div>
                    <div style={{ fontWeight: '600' }}>Month 2</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-gray-500)' }}>
                      {new Date(monthlyBreakdown.month2Date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <span>🔄</span>
                    <span style={{ fontWeight: '600' }}>${(monthlyBreakdown.month2Cents / 100).toFixed(2)}</span>
                  </div>
                </div>

                {/* Month 3 */}
                <div className="payment-schedule-row future">
                  <div>
                    <div style={{ fontWeight: '600' }}>Month 3</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-gray-500)' }}>
                      {new Date(monthlyBreakdown.month3Date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <span>🔄</span>
                    <span style={{ fontWeight: '600' }}>${(monthlyBreakdown.month3Cents / 100).toFixed(2)}</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-latte)', marginTop: '12px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '700', color: 'var(--color-coffee)' }}>Total</span>
                  <span style={{ fontWeight: '700', color: 'var(--color-coffee)' }}>${(monthlyBreakdown.totalCents / 100).toFixed(2)}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: '8px' }}>
                  ✓ = Charged today · 🔄 = Auto-charged on date shown
                </div>
              </div>
            ) : (
              <div className="booking-summary-total">
                <span>Total due today</span>
                <span>${(totalPrice - 50).toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Right: Payment */}
          <div className="booking-payment-card">
            <h2>Payment</h2>
            <div className="payment-trust-message">
              {paymentPlan === 'monthly' && monthlyBreakdown
                ? <>Your $50 deposit credit is applied to month 1. You will be charged <strong>${(monthlyBreakdown.month1Cents / 100).toFixed(2)}</strong> today, then auto-charged monthly.</>
                : <>Your $50 commitment deposit has been deducted. You will be charged <strong>${(totalPrice - 50).toFixed(2)}</strong> today.</>
              }
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

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6B5A52', marginBottom: '8px' }}>
                Billing address <span style={{ fontWeight: 400, color: '#9E8E88' }}>(optional — helps reduce declines)</span>
              </div>
              <div style={{ display: 'grid', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Street address"
                  value={billingAddress.addressLine1}
                  onChange={e => setBillingAddress(a => ({ ...a, addressLine1: e.target.value }))}
                  style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #E7D3BF', fontSize: '0.9rem' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="City"
                    value={billingAddress.city}
                    onChange={e => setBillingAddress(a => ({ ...a, city: e.target.value }))}
                    style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #E7D3BF', fontSize: '0.9rem' }}
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={billingAddress.state}
                    onChange={e => setBillingAddress(a => ({ ...a, state: e.target.value }))}
                    style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #E7D3BF', fontSize: '0.9rem' }}
                  />
                </div>
                <input
                  type="text"
                  placeholder="ZIP / Postal code"
                  value={billingAddress.postalCode}
                  onChange={e => setBillingAddress(a => ({ ...a, postalCode: e.target.value }))}
                  style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #E7D3BF', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '10px' }}>
              {['visa', 'mastercard', 'amex', 'discovery'].map((card) => (
                <div key={card} style={{ width: '44px', height: '28px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={`/card-logos/${card}.jpg`} alt={card} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              ))}
            </div>
            <div id="sq-card-booking" className="square-card-container" />

            <button
              type="button"
              className="booking-payment-button"
              onClick={handlePayAndConfirm}
              disabled={!sdkReady || processing}
            >
              {processing && <span className="payment-spinner" aria-hidden />}
              {processing
                ? stepLabel
                : paymentPlan === 'monthly' && monthlyBreakdown
                  ? `Pay $${(monthlyBreakdown.month1Cents / 100).toFixed(2)} Today & Confirm`
                  : `Pay $${(totalPrice - 50).toFixed(2)} & Confirm`
              }
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
