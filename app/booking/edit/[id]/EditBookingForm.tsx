'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { updateBookingItems } from '@/lib/booking/update-booking';
import { chargeBookingUpgrade } from '@/lib/square/charge-upgrade';
import type { BookingItemInput, BookingItemType } from '@/lib/booking/types';
import { AuthPageWrapper } from '@/app/components/AuthPageWrapper';
import {
  ADDON_PRICE_USD_MONTH,
  ADDON_TIER_SUMMARY,
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

function getBoxPriceCents(qty: number): number {
  return getBoxUnitPriceCents(qty);
}

function getBoxPrice(qty: number): number {
  return getBoxPriceCents(qty) / 100;
}

type AdditionalItems = {
  smallWithBox: number;
  smallWithoutBox: number;
  mediumWithBox: number;
  mediumWithoutBox: number;
  large: number;
};

const ITEM_PRICES: Record<keyof AdditionalItems, number> = { ...ADDON_PRICE_USD_MONTH };

export function EditBookingForm({
  bookingId,
  initialBoxQuantity,
  initialAdditionalItems,
  isPaid,
  initialMonthlyTotal,
  storageMonths,
}: {
  bookingId: string;
  initialBoxQuantity: number;
  initialAdditionalItems: AdditionalItems;
  isPaid: boolean;
  initialMonthlyTotal: number;
  storageMonths: number;
}) {
  const router = useRouter();
  const [boxQuantity, setBoxQuantity] = useState(initialBoxQuantity);
  const [additionalItems, setAdditionalItems] = useState(initialAdditionalItems);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Square SDK state (only needed when isPaid and delta > 0)
  const [isSandbox, setIsSandbox] = useState(true);
  const [appId, setAppId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [sdkReady, setSdkReady] = useState(false);
  const cardInstanceRef = useRef<any>(null);
  const applePayRef = useRef<any>(null);
  const googlePayRef = useRef<any>(null);
  const initializingRef = useRef(false);
  const [applePayInstance, setApplePayInstance] = useState<any>(null);
  const [googlePayInstance, setGooglePayInstance] = useState<any>(null);
  const buildItemsRef = useRef<() => BookingItemInput[]>(() => []);
  const upgradeCtxRef = useRef({ bookingId, deltaTotalCents: 0 });

  const withBoxItemsUnlocked = boxQuantity >= 1;
  const withoutBoxItemsUnlocked = boxQuantity < 1;

  useEffect(() => {
    if (boxQuantity < 1) return;
    setAdditionalItems((prev) => {
      if (prev.smallWithoutBox === 0 && prev.mediumWithoutBox === 0) return prev;
      return { ...prev, smallWithoutBox: 0, mediumWithoutBox: 0 };
    });
  }, [boxQuantity]);

  useEffect(() => {
    if (boxQuantity >= 1) return;
    setAdditionalItems((prev) => {
      if (prev.smallWithBox === 0 && prev.mediumWithBox === 0) return prev;
      return { ...prev, smallWithBox: 0, mediumWithBox: 0 };
    });
  }, [boxQuantity]);

  // Pricing
  const boxPrice = getBoxPrice(boxQuantity);
  const boxesTotal = boxPrice * boxQuantity;
  const totalAdditionalItems = Object.values(additionalItems).reduce((s, v) => s + v, 0);
  const itemsTotal = (Object.keys(additionalItems) as (keyof AdditionalItems)[])
    .reduce((s, k) => s + additionalItems[k] * ITEM_PRICES[k], 0);
  const monthlyTotal = boxesTotal + itemsTotal;

  const deltaMonthly = monthlyTotal - initialMonthlyTotal;
  const deltaTotalCents = Math.round(Math.max(0, deltaMonthly) * storageMonths * 100);
  // Charge whenever more items are added, regardless of whether the booking is paid or not
  const needsPayment = deltaMonthly > 0;

  // Fetch Square config once when upgrade payment becomes needed
  useEffect(() => {
    if (!needsPayment) return;
    fetch('/api/square-config')
      .then(r => r.json())
      .then(({ applicationId, locationId: loc, isSandbox: sb }) => {
        setAppId(applicationId);
        setLocationId(loc);
        setIsSandbox(sb);
      })
      .catch(console.error);
  }, [needsPayment]);

  // Mount Square card + Apple Pay / Google Pay when upgrade charge is due (amount tracks delta)
  useEffect(() => {
    if (!needsPayment || !appId || !locationId || deltaTotalCents <= 0) return;

    let googlePayCleanup: (() => void) | null = null;
    const scriptSrc = isSandbox
      ? 'https://sandbox.web.squarecdn.com/v1/square.js'
      : 'https://web.squarecdn.com/v1/square.js';

    const waitForSquare = (): Promise<any> =>
      new Promise((resolve, reject) => {
        const sq = (window as any).Square;
        if (sq) {
          resolve(sq);
          return;
        }
        let attempts = 0;
        const interval = setInterval(() => {
          const s = (window as any).Square;
          if (s) {
            clearInterval(interval);
            resolve(s);
          } else if (++attempts > 40) {
            clearInterval(interval);
            reject(new Error('Square SDK timed out'));
          }
        }, 150);
      });

    const initSquare = async () => {
      if (initializingRef.current) return;
      initializingRef.current = true;
      try {
        const sq = await waitForSquare().catch(() => null);
        if (!sq) {
          initializingRef.current = false;
          return;
        }
        const payments = sq.payments(appId, locationId);
        const container = document.getElementById('sq-card-upgrade');
        if (container) container.innerHTML = '';
        const card = await payments.card({
          style: {
            input: { color: '#4B2E25', fontSize: '15px' },
            '.input-container': { borderColor: '#C9A47E', borderRadius: '8px' },
            '.input-container.is-focus': { borderColor: '#4B2E25' },
          },
        });
        await card.attach('#sq-card-upgrade');
        cardInstanceRef.current = card;
        setSdkReady(true);

        const totalAmountDisplay = (deltaTotalCents / 100).toFixed(2);
        const paymentRequest = payments.paymentRequest({
          countryCode: 'US',
          currencyCode: 'USD',
          total: { amount: totalAmountDisplay, label: 'NoTime Storage' },
        });

        try {
          const applePay = await payments.applePay(paymentRequest);
          applePayRef.current = applePay;
          setApplePayInstance(applePay);
        } catch {
          setApplePayInstance(null);
        }

        try {
          if (googlePayRef.current) throw new Error('already attached');
          const gpContainer = document.getElementById('upgrade-google-pay-button');
          if (gpContainer) gpContainer.innerHTML = '';
          const googlePay = await payments.googlePay(paymentRequest);
          if (googlePayRef.current) {
            googlePay.destroy?.();
            throw new Error('already attached');
          }
          if (gpContainer) gpContainer.innerHTML = '';
          await googlePay.attach('#upgrade-google-pay-button', { buttonColor: 'default', buttonType: 'long' });
          googlePayRef.current = googlePay;
          setGooglePayInstance(googlePay);
          const googlePayEl = document.getElementById('upgrade-google-pay-button');
          const onGooglePayClick = async () => {
            const items = buildItemsRef.current();
            const { bookingId: bid, deltaTotalCents: dtc } = upgradeCtxRef.current;
            setProcessing(true);
            setError(null);
            try {
              const result = await googlePay.tokenize();
              if (result.status === 'OK' && result.token) {
                const res = await chargeBookingUpgrade(bid, items, result.token, dtc);
                if (res.success) router.push('/booking/updated?type=items');
                else setError(res.error);
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
        } catch {
          setGooglePayInstance(null);
        }
      } catch (err: any) {
        setError(err?.message ?? 'Could not load payment form.');
      } finally {
        initializingRef.current = false;
      }
    };

    const existing = document.querySelector(`script[src="${scriptSrc}"]`);
    if (existing) initSquare();
    else {
      const script = document.createElement('script');
      script.src = scriptSrc;
      script.onload = () => { initSquare(); };
      script.onerror = () => setError('Failed to load payment SDK.');
      document.head.appendChild(script);
    }

    return () => {
      googlePayCleanup?.();
      if (googlePayRef.current && typeof googlePayRef.current.destroy === 'function') {
        googlePayRef.current.destroy();
      }
      googlePayRef.current = null;
      applePayRef.current = null;
      setApplePayInstance(null);
      setGooglePayInstance(null);
      cardInstanceRef.current?.destroy?.();
      cardInstanceRef.current = null;
      setSdkReady(false);
      initializingRef.current = false;
      const cardEl = document.getElementById('sq-card-upgrade');
      if (cardEl) cardEl.innerHTML = '';
      const gpEl = document.getElementById('upgrade-google-pay-button');
      if (gpEl) gpEl.innerHTML = '';
    };
  }, [needsPayment, appId, locationId, isSandbox, deltaTotalCents]);

  const updateItem = (key: keyof AdditionalItems, delta: number) => {
    const isWithBox = key === 'smallWithBox' || key === 'mediumWithBox';
    const isWithoutBox = key === 'smallWithoutBox' || key === 'mediumWithoutBox';
    if (isWithBox && !withBoxItemsUnlocked) return;
    if (isWithoutBox && !withoutBoxItemsUnlocked) return;
    setAdditionalItems(prev => {
      const next = Math.max(0, prev[key] + delta);
      const newTotal = totalAdditionalItems - prev[key] + next;
      if (newTotal > MAX_ADDITIONAL_ITEMS) return prev;
      return { ...prev, [key]: next };
    });
  };

  const buildItems = useCallback((): BookingItemInput[] => {
    const items: BookingItemInput[] = [];
    if (boxQuantity > 0) {
      items.push({ item_type: 'box', quantity: boxQuantity, unit_price_cents: getBoxPriceCents(boxQuantity) });
    }
    (Object.keys(ITEM_TYPE_MAP) as (keyof typeof ITEM_TYPE_MAP)[]).forEach(key => {
      const qty = additionalItems[key as keyof AdditionalItems];
      if (qty > 0) {
        const itemType = ITEM_TYPE_MAP[key];
        items.push({
          item_type: itemType,
          quantity: qty,
          unit_price_cents: ADDON_UNIT_PRICE_CENTS[itemType as Exclude<BookingItemType, 'box'>],
        });
      }
    });
    return items;
  }, [boxQuantity, additionalItems]);

  buildItemsRef.current = buildItems;
  upgradeCtxRef.current = { bookingId, deltaTotalCents };

  const handleApplePayClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!applePayRef.current) return;
    setError(null);
    setProcessing(true);
    try {
      const items = buildItemsRef.current();
      const { bookingId: bid, deltaTotalCents: dtc } = upgradeCtxRef.current;
      const result = await applePayRef.current.tokenize();
      if (result.status === 'OK' && result.token) {
        const res = await chargeBookingUpgrade(bid, items, result.token, dtc);
        if (res.success) router.push('/booking/updated?type=items');
        else setError(res.error);
      } else {
        setError(result.errors?.[0]?.message ?? 'Apple Pay failed');
      }
    } catch (err: any) {
      setError(err?.message ?? 'Apple Pay failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleSave = async () => {
    const items = buildItems();
    if (items.length === 0) { setError('Add at least one box or additional item.'); return; }
    setError(null);
    setProcessing(true);

    if (needsPayment) {
      // Items increased: charge the delta via Square (works for both paid and unpaid bookings)
      if (!cardInstanceRef.current) { setError('Payment form not ready.'); setProcessing(false); return; }
      const tokenResult = await cardInstanceRef.current.tokenize();
      if (tokenResult.status !== 'OK') {
        setError(tokenResult.errors?.[0]?.message ?? 'Card details invalid.');
        setProcessing(false);
        return;
      }
      const result = await chargeBookingUpgrade(bookingId, items, tokenResult.token, deltaTotalCents);
      setProcessing(false);
      if (result.success) { router.push('/booking/updated?type=items'); return; }
      setError(result.error);
    } else if (isPaid) {
      // Paid booking, items equal or reduced: update via chargeBookingUpgrade with no charge
      const result = await chargeBookingUpgrade(bookingId, items, null, 0);
      setProcessing(false);
      if (result.success) { router.push('/booking/updated?type=items'); return; }
      setError(result.error);
    } else {
      // Unpaid booking, items equal or reduced: just save
      const result = await updateBookingItems(bookingId, items);
      setProcessing(false);
      if (result.success) { router.push('/booking/updated?type=items'); return; }
      setError(result.error);
    }
  };

  const isAtItemCap = totalAdditionalItems >= MAX_ADDITIONAL_ITEMS;
  const hasWallet = !!(applePayInstance || googlePayInstance);

  return (
    <AuthPageWrapper>
      <div
        className="edit-booking-shell"
        style={{
          maxWidth: 'min(900px, 100%)',
          width: '100%',
          background: 'white',
          borderRadius: '16px',
          padding: 'clamp(16px, 4vw, 48px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
          boxSizing: 'border-box',
          minWidth: 0,
        }}
      >

        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <Link href="/">
            <Image src="/brand/notime-storage-logo.png" alt="NoTime Storage" width={80} height={80} style={{ marginBottom: '24px' }} />
          </Link>
          <h1 style={{ fontSize: 'clamp(1.35rem, 5vw, 2.25rem)', fontWeight: '800', color: 'var(--color-coffee)', marginBottom: '12px' }}>
            Edit boxes & items
          </h1>
          <p style={{ fontSize: '1.125rem', color: 'var(--color-gray-600)' }}>
            Change your selection below. Dates and dorm stay the same.
          </p>
        </div>

        {/* Storage Boxes */}
        <div style={{ marginBottom: '40px', padding: '32px', background: 'var(--color-paper)', borderRadius: '12px', border: '2px solid var(--color-latte)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-coffee)', marginBottom: '24px' }}>📦 Storage Boxes</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
            <label style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--color-gray-700)', minWidth: 'min(100%, 120px)' }}>Quantity:</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button onClick={() => setBoxQuantity(Math.max(0, boxQuantity - 1))} className="button-secondary" style={{ padding: '8px 20px', fontSize: '1.25rem', minWidth: '50px' }}>−</button>
              <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-coffee)', minWidth: '40px', textAlign: 'center' }}>{boxQuantity}</span>
              <button onClick={() => setBoxQuantity(boxQuantity + 1)} className="button-secondary" style={{ padding: '8px 20px', fontSize: '1.25rem', minWidth: '50px' }}>+</button>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right', flex: '1 1 140px' }}>
              {boxQuantity > 0 ? (
                <>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>${boxPrice}/box/month</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-coffee)' }}>${boxesTotal}/month</div>
                </>
              ) : (
                <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>No boxes — add-ons only</div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Items */}
        <div style={{ marginBottom: '40px', padding: '32px', background: 'var(--color-white)', borderRadius: '12px', border: '2px solid var(--color-latte-soft)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-coffee)', margin: 0 }}>➕ Additional Items <span style={{ fontSize: '1rem', fontWeight: '400' }}>(Optional)</span></h2>
            <span style={{
              fontSize: '0.8rem', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', whiteSpace: 'nowrap',
              background: isAtItemCap ? '#FEE2E2' : 'var(--color-paper)',
              color: isAtItemCap ? '#B91C1C' : '#6B5A52',
              border: `1px solid ${isAtItemCap ? '#FCA5A5' : 'var(--color-latte)'}`,
            }}>
              {totalAdditionalItems} / {MAX_ADDITIONAL_ITEMS} items
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)', marginBottom: '24px' }}>
            Add items that don&apos;t fit in boxes. Max {MAX_ADDITIONAL_ITEMS} additional items.
          </p>

          {/* Small */}
          <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--color-latte-soft)' }}>
            <div style={{ fontWeight: '600', marginBottom: '12px', color: 'var(--color-gray-800)', fontSize: '0.9rem' }}>Small — {ADDON_TIER_SUMMARY.small}</div>
            <div className="booking-edit-items-grid">
              {(['smallWithBox', 'smallWithoutBox'] as const).map(key => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: (key === 'smallWithBox' ? withBoxItemsUnlocked : withoutBoxItemsUnlocked) ? 1 : 0.55 }}>
                  <span style={{ fontSize: '0.875rem' }}>
                    {key === 'smallWithBox' ? `With box – $${ITEM_PRICES.smallWithBox}/mo` : `Without box – $${ITEM_PRICES.smallWithoutBox}/mo`}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => updateItem(key, -1)} className="button-secondary" style={{ padding: '4px 12px', fontSize: '1rem' }}>−</button>
                    <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '600' }}>{additionalItems[key]}</span>
                    <button
                      onClick={() => updateItem(key, +1)}
                      disabled={isAtItemCap || (key === 'smallWithBox' ? !withBoxItemsUnlocked : !withoutBoxItemsUnlocked)}
                      className="button-secondary"
                      style={{ padding: '4px 12px', fontSize: '1rem', opacity: (isAtItemCap || (key === 'smallWithBox' ? !withBoxItemsUnlocked : !withoutBoxItemsUnlocked)) ? 0.35 : 1 }}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Medium */}
          <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--color-latte-soft)' }}>
            <div style={{ fontWeight: '600', marginBottom: '12px', color: 'var(--color-gray-800)', fontSize: '0.9rem' }}>Medium — {ADDON_TIER_SUMMARY.medium}</div>
            <div className="booking-edit-items-grid">
              {(['mediumWithBox', 'mediumWithoutBox'] as const).map(key => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: (key === 'mediumWithBox' ? withBoxItemsUnlocked : withoutBoxItemsUnlocked) ? 1 : 0.55 }}>
                  <span style={{ fontSize: '0.875rem' }}>
                    {key === 'mediumWithBox' ? `With box – $${ITEM_PRICES.mediumWithBox}/mo` : `Without box – $${ITEM_PRICES.mediumWithoutBox}/mo`}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => updateItem(key, -1)} className="button-secondary" style={{ padding: '4px 12px', fontSize: '1rem' }}>−</button>
                    <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '600' }}>{additionalItems[key]}</span>
                    <button
                      onClick={() => updateItem(key, +1)}
                      disabled={isAtItemCap || (key === 'mediumWithBox' ? !withBoxItemsUnlocked : !withoutBoxItemsUnlocked)}
                      className="button-secondary"
                      style={{ padding: '4px 12px', fontSize: '1rem', opacity: (isAtItemCap || (key === 'mediumWithBox' ? !withBoxItemsUnlocked : !withoutBoxItemsUnlocked)) ? 0.35 : 1 }}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Large */}
          <div>
            <div style={{ fontWeight: '600', marginBottom: '12px', color: 'var(--color-gray-800)', fontSize: '0.9rem' }}>Large — {ADDON_TIER_SUMMARY.large}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem' }}>Large item – ${ITEM_PRICES.large}/mo</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={() => updateItem('large', -1)} className="button-secondary" style={{ padding: '4px 12px', fontSize: '1rem' }}>−</button>
                <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '600' }}>{additionalItems.large}</span>
                <button onClick={() => updateItem('large', +1)} disabled={isAtItemCap} className="button-secondary" style={{ padding: '4px 12px', fontSize: '1rem', opacity: isAtItemCap ? 0.35 : 1 }}>+</button>
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade payment section — only appears for paid bookings with a positive delta */}
        {needsPayment && (
          <div style={{ padding: '28px', background: 'var(--color-paper)', borderRadius: '12px', marginBottom: '24px', border: '2px solid var(--color-latte)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-coffee)', marginBottom: '6px' }}>Additional charge required</h2>
            <p style={{ fontSize: '0.875rem', color: '#6B5A52', marginBottom: '16px' }}>
              You&apos;re adding <strong>${deltaMonthly.toFixed(2)}/month</strong> more for {storageMonths} months.
              You&apos;ll be charged the difference: <strong>${(deltaTotalCents / 100).toFixed(2)}</strong>.
            </p>
            {isSandbox && (
              <div style={{ background: '#FEF9C3', border: '1px solid #FDE047', borderRadius: '8px', padding: '8px 12px', marginBottom: '14px', fontSize: '0.78rem', color: '#713F12' }}>
                <strong>Sandbox</strong> — Test card: <code>4111 1111 1111 1111</code>, any future date, any CVV.
              </div>
            )}
            <p style={{ fontSize: '0.8125rem', color: '#6B5A52', marginBottom: '12px', marginTop: 0 }}>
              Pay the upgrade with Apple Pay, Google Pay, or card when available on this device.
            </p>
            <div className="payment-digital-wallets" style={{ display: hasWallet ? 'flex' : 'none', marginBottom: hasWallet ? '12px' : 0 }}>
              {applePayInstance && (
                <button
                  type="button"
                  id="upgrade-apple-pay-button"
                  className="payment-wallet-button payment-wallet-button-apple"
                  onClick={handleApplePayClick}
                  disabled={processing}
                  aria-label="Pay upgrade with Apple Pay"
                />
              )}
              <div id="upgrade-google-pay-button" className="payment-wallet-button" />
            </div>
            {hasWallet && (
              <div className="payment-method-divider" style={{ marginBottom: '12px' }}>
                <span>or pay with card</span>
              </div>
            )}
            <div id="sq-card-upgrade" style={{ minHeight: '89px' }} />
          </div>
        )}

        {error && (
          <div style={{ padding: '12px 16px', marginBottom: '16px', background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: '8px', color: '#B91C1C', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {/* Summary + action */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', padding: 'clamp(16px, 4vw, 24px)', background: 'var(--color-latte-soft)', borderRadius: '12px', marginBottom: '24px' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Monthly Total</div>
            <div style={{ fontSize: 'clamp(1.35rem, 5vw, 2rem)', fontWeight: '800', color: 'var(--color-coffee)' }}>${monthlyTotal}/month</div>
            {needsPayment && (
              <div style={{ fontSize: '0.8rem', color: '#B45309', marginTop: '4px' }}>
                + ${(deltaTotalCents / 100).toFixed(2)} upgrade charge
              </div>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={processing || (needsPayment && !sdkReady)}
            className="button-primary"
            style={{ padding: '14px clamp(16px, 5vw, 48px)', fontSize: '1.05rem', flexShrink: 0, opacity: (processing || (needsPayment && !sdkReady)) ? 0.65 : 1 }}
          >
            {processing
              ? 'Processing…'
              : needsPayment
                ? `Pay $${(deltaTotalCents / 100).toFixed(2)} & Save`
                : 'Save changes'}
          </button>
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link href="/dashboard" style={{ color: 'var(--color-gray-600)', fontSize: '0.875rem', textDecoration: 'underline' }}>
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </AuthPageWrapper>
  );
}
