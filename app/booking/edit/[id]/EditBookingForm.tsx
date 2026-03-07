'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { updateBookingItems } from '@/lib/booking/update-booking';
import { chargeBookingUpgrade } from '@/lib/square/charge-upgrade';
import type { BookingItemInput, BookingItemType } from '@/lib/booking/types';

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

function getBoxPriceCents(qty: number): number {
  if (qty === 0) return 0;
  if (qty === 1) return 8000;
  if (qty === 2 || qty === 3) return 5500;
  if (qty >= 4) return 6000;
  return 8000;
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

const MAX_ADDITIONAL_ITEMS = 4;

const ITEM_PRICES: Record<keyof AdditionalItems, number> = {
  smallWithBox: 9,
  smallWithoutBox: 11,
  mediumWithBox: 9,
  mediumWithoutBox: 12,
  large: 15,
};

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

  // Mount Square card when we have config and payment is needed
  useEffect(() => {
    if (!needsPayment || !appId || !locationId) return;
    if (cardInstanceRef.current) return;

    const scriptSrc = isSandbox
      ? 'https://sandbox.web.squarecdn.com/v1/square.js'
      : 'https://web.squarecdn.com/v1/square.js';

    const initSquare = async () => {
      if (cardInstanceRef.current) return;
      try {
        const sq = (window as any).Square;
        if (!sq) return;
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
      } catch (err: any) {
        setError(err?.message ?? 'Could not load payment form.');
      }
    };

    const existing = document.querySelector(`script[src="${scriptSrc}"]`);
    if (existing) { initSquare(); }
    else {
      const script = document.createElement('script');
      script.src = scriptSrc;
      script.onload = initSquare;
      script.onerror = () => setError('Failed to load payment SDK.');
      document.head.appendChild(script);
    }

    return () => { cardInstanceRef.current?.destroy?.(); cardInstanceRef.current = null; setSdkReady(false); };
  }, [needsPayment, appId, locationId, isSandbox]);

  // When the upgrade delta disappears (user removes items), destroy card
  useEffect(() => {
    if (!needsPayment && cardInstanceRef.current) {
      cardInstanceRef.current?.destroy?.();
      cardInstanceRef.current = null;
      setSdkReady(false);
    }
  }, [needsPayment]);

  const updateItem = (key: keyof AdditionalItems, delta: number) => {
    setAdditionalItems(prev => {
      const next = Math.max(0, prev[key] + delta);
      const newTotal = totalAdditionalItems - prev[key] + next;
      if (newTotal > MAX_ADDITIONAL_ITEMS) return prev;
      return { ...prev, [key]: next };
    });
  };

  const buildItems = (): BookingItemInput[] => {
    const items: BookingItemInput[] = [];
    if (boxQuantity > 0) {
      items.push({ item_type: 'box', quantity: boxQuantity, unit_price_cents: getBoxPriceCents(boxQuantity) });
    }
    (Object.keys(ITEM_TYPE_MAP) as (keyof typeof ITEM_TYPE_MAP)[]).forEach(key => {
      const qty = additionalItems[key as keyof AdditionalItems];
      if (qty > 0) {
        const itemType = ITEM_TYPE_MAP[key];
        items.push({ item_type: itemType, quantity: qty, unit_price_cents: UNIT_PRICE_CENTS[itemType] });
      }
    });
    return items;
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

  return (
    <div className="auth-container">
      <div style={{ maxWidth: '900px', width: '100%', background: 'white', borderRadius: '16px', padding: '48px', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>

        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <Link href="/">
            <Image src="/brand/notime-storage-logo.png" alt="NoTime Storage" width={80} height={80} style={{ marginBottom: '24px' }} />
          </Link>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--color-coffee)', marginBottom: '12px' }}>
            Edit boxes & items
          </h1>
          <p style={{ fontSize: '1.125rem', color: 'var(--color-gray-600)' }}>
            Change your selection below. Dates and dorm stay the same.
          </p>
        </div>

        {/* Storage Boxes */}
        <div style={{ marginBottom: '40px', padding: '32px', background: 'var(--color-paper)', borderRadius: '12px', border: '2px solid var(--color-latte)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-coffee)', marginBottom: '24px' }}>📦 Storage Boxes</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <label style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--color-gray-700)', minWidth: '120px' }}>Quantity:</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button onClick={() => setBoxQuantity(Math.max(0, boxQuantity - 1))} className="button-secondary" style={{ padding: '8px 20px', fontSize: '1.25rem', minWidth: '50px' }}>−</button>
              <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-coffee)', minWidth: '40px', textAlign: 'center' }}>{boxQuantity}</span>
              <button onClick={() => setBoxQuantity(boxQuantity + 1)} className="button-secondary" style={{ padding: '8px 20px', fontSize: '1.25rem', minWidth: '50px' }}>+</button>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>${boxPrice}/box/month</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-coffee)' }}>${boxesTotal}/month</div>
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
            <div style={{ fontWeight: '600', marginBottom: '12px', color: 'var(--color-gray-800)' }}>Small Items</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {(['smallWithBox', 'smallWithoutBox'] as const).map(key => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem' }}>{key === 'smallWithBox' ? 'With box – $9/mo' : 'Without box – $11/mo'}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => updateItem(key, -1)} className="button-secondary" style={{ padding: '4px 12px', fontSize: '1rem' }}>−</button>
                    <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '600' }}>{additionalItems[key]}</span>
                    <button onClick={() => updateItem(key, +1)} disabled={isAtItemCap} className="button-secondary" style={{ padding: '4px 12px', fontSize: '1rem', opacity: isAtItemCap ? 0.35 : 1 }}>+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Medium */}
          <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--color-latte-soft)' }}>
            <div style={{ fontWeight: '600', marginBottom: '12px', color: 'var(--color-gray-800)' }}>Medium Items</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {(['mediumWithBox', 'mediumWithoutBox'] as const).map(key => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem' }}>{key === 'mediumWithBox' ? 'With box – $9/mo' : 'Without box – $12/mo'}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => updateItem(key, -1)} className="button-secondary" style={{ padding: '4px 12px', fontSize: '1rem' }}>−</button>
                    <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '600' }}>{additionalItems[key]}</span>
                    <button onClick={() => updateItem(key, +1)} disabled={isAtItemCap} className="button-secondary" style={{ padding: '4px 12px', fontSize: '1rem', opacity: isAtItemCap ? 0.35 : 1 }}>+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Large */}
          <div>
            <div style={{ fontWeight: '600', marginBottom: '12px', color: 'var(--color-gray-800)' }}>Large Items</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem' }}>Any size – $15/mo</span>
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
            <div id="sq-card-upgrade" style={{ minHeight: '89px' }} />
          </div>
        )}

        {error && (
          <div style={{ padding: '12px 16px', marginBottom: '16px', background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: '8px', color: '#B91C1C', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {/* Summary + action */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', background: 'var(--color-latte-soft)', borderRadius: '12px', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Monthly Total</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-coffee)' }}>${monthlyTotal}/month</div>
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
            style={{ padding: '16px 48px', fontSize: '1.125rem', opacity: (processing || (needsPayment && !sdkReady)) ? 0.65 : 1 }}
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
    </div>
  );
}
