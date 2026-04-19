'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';
import { updateBookingItems } from '@/lib/booking/update-booking';
import { applyPaidBookingItemUpgradeVenmo } from '@/lib/booking/apply-paid-upgrade-venmo';
import { updatePaidBookingLineItems } from '@/lib/booking/update-paid-booking-line-items';
import { createUpgradeCheckoutSession } from '@/lib/stripe/upgrade';
import { isStripeEnabledClient } from '@/lib/stripe/config';
import { VenmoBackupSection } from '@/app/components/VenmoBackupSection';
import { getVenmoHandleFromEnv } from '@/lib/payment/venmo';
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
  const [firstName, setFirstName] = useState('');
  const [showVenmoUpgrade, setShowVenmoUpgrade] = useState(false);
  const stripeEnabled = isStripeEnabledClient();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      const meta = user?.user_metadata as { full_name?: string; first_name?: string } | undefined;
      const first = (meta?.first_name || meta?.full_name?.split(' ')[0] || '').trim();
      setFirstName(first);
    });
  }, []);

  const venmoSlug = getVenmoHandleFromEnv();

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

  const handleSave = async () => {
    const items = buildItems();
    if (items.length === 0) { setError('Add at least one box or additional item.'); return; }
    setError(null);
    setProcessing(true);

    if (needsPayment) {
      if (isPaid && stripeEnabled) {
        const result = await createUpgradeCheckoutSession(bookingId, items);
        setProcessing(false);
        if (!result.success) {
          setError(result.error);
          return;
        }
        window.location.href = result.url;
        return;
      }
      if (!venmoSlug) {
        setError('Payment is not configured. Please contact support.');
        setProcessing(false);
        return;
      }
      if (isPaid) {
        const result = await applyPaidBookingItemUpgradeVenmo(bookingId, items);
        setProcessing(false);
        if (result.success) {
          router.push('/booking/updated?type=items');
          return;
        }
        setError(result.error);
        return;
      }
      const result = await updateBookingItems(bookingId, items);
      setProcessing(false);
      if (result.success) {
        router.push('/booking/updated?type=items');
        return;
      }
      setError(result.error);
    } else if (isPaid) {
      const result = await updatePaidBookingLineItems(bookingId, items);
      setProcessing(false);
      if (result.success) { router.push('/booking/updated?type=items'); return; }
      setError(result.error);
    } else {
      const result = await updateBookingItems(bookingId, items);
      setProcessing(false);
      if (result.success) { router.push('/booking/updated?type=items'); return; }
      setError(result.error);
    }
  };

  const isAtItemCap = totalAdditionalItems >= MAX_ADDITIONAL_ITEMS;

  const saveBlocked =
    processing || (needsPayment && isPaid && !stripeEnabled && !venmoSlug);

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
        <Suspense fallback={null}>
          <UpgradeCheckoutReturnPoller bookingId={bookingId} />
        </Suspense>

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

        {/* Upgrade payment — Stripe primary when flag on; Venmo optional / legacy */}
        {needsPayment && !stripeEnabled && !venmoSlug && (
          <div style={{ padding: '14px 16px', marginBottom: '20px', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '10px', fontSize: '0.875rem', color: '#78350F' }}>
            Extra storage requires payment, but checkout is not configured. Please contact support before increasing your order.
          </div>
        )}

        {needsPayment && (stripeEnabled || venmoSlug) && (
          <div style={{ padding: '8px 0 0', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-coffee)', marginBottom: '6px' }}>Additional charge required</h2>
            <p style={{ fontSize: '0.875rem', color: '#6B5A52', marginBottom: '12px' }}>
              You&apos;re adding <strong>${deltaMonthly.toFixed(2)}/month</strong> more for {storageMonths} months.
              One-time difference: <strong>${(deltaTotalCents / 100).toFixed(2)}</strong>.
            </p>
            {stripeEnabled && (
              <p style={{ fontSize: '0.8rem', color: '#6B5A52', marginBottom: '12px' }}>
                Pay with card, Apple Pay, or Google Pay. Your new items apply automatically after payment clears (usually seconds).
              </p>
            )}
            {!stripeEnabled && venmoSlug && (
              <VenmoBackupSection
                venmoSlug={venmoSlug}
                amountLabel={`$${(deltaTotalCents / 100).toFixed(2)}`}
                amountCents={deltaTotalCents}
                purpose="upgrade"
                noteContext={{ kind: 'upgrade', bookingId, firstName }}
                ctaLabel={`Open Venmo — pay $${(deltaTotalCents / 100).toFixed(2)}`}
              />
            )}
            {stripeEnabled && venmoSlug && (
              <div style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowVenmoUpgrade((v) => !v)}
                  aria-expanded={showVenmoUpgrade}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: '1px dashed var(--color-latte)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'var(--color-coffee)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {showVenmoUpgrade ? 'Hide Venmo' : 'Prefer to pay with Venmo?'}
                </button>
                {showVenmoUpgrade && (
                  <div style={{ marginTop: '12px' }}>
                    <p style={{ fontSize: '0.78rem', color: '#6B5A52', marginBottom: '10px' }}>
                      Venmo upgrades are applied immediately; we confirm the transfer within about one business day.
                    </p>
                    <VenmoBackupSection
                      venmoSlug={venmoSlug}
                      amountLabel={`$${(deltaTotalCents / 100).toFixed(2)}`}
                      amountCents={deltaTotalCents}
                      purpose="upgrade"
                      noteContext={{ kind: 'upgrade', bookingId, firstName }}
                      ctaLabel={`Open Venmo — pay $${(deltaTotalCents / 100).toFixed(2)}`}
                    />
                  </div>
                )}
              </div>
            )}
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
            disabled={saveBlocked}
            className="button-primary"
            style={{ padding: '14px clamp(16px, 5vw, 48px)', fontSize: '1.05rem', flexShrink: 0, opacity: saveBlocked ? 0.65 : 1 }}
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

/**
 * After Stripe upgrade Checkout, land here with ?upgrade_session_id=…
 * and poll until the webhook applies line items.
 */
function UpgradeCheckoutReturnPoller({ bookingId }: { bookingId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('upgrade_session_id');
  const cancelled = searchParams.get('upgrade_cancelled') === '1';

  useEffect(() => {
    if (!cancelled) return;
    router.replace(`/booking/edit/${bookingId}`);
  }, [cancelled, bookingId, router]);

  useEffect(() => {
    if (!sessionId) return;
    let alive = true;
    const started = Date.now();

    const tick = async () => {
      try {
        const res = await fetch(`/api/booking/upgrade-status?session_id=${encodeURIComponent(sessionId)}`, {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data = (await res.json()) as { applied?: boolean };
        if (!alive) return;
        if (data.applied) {
          router.push('/booking/updated?type=items');
        }
      } catch {
        /* keep polling */
      }
      if (Date.now() - started > 90_000) {
        alive = false;
      }
    };

    const interval = setInterval(tick, 2_000);
    tick();
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [sessionId, router]);

  if (!sessionId) return null;

  return (
    <div
      style={{
        marginBottom: '20px',
        padding: '14px 18px',
        background: 'rgba(201, 164, 126, 0.12)',
        border: '1px solid var(--color-latte)',
        borderRadius: '12px',
        fontSize: '0.9rem',
        color: 'var(--color-coffee)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <span
        style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          border: '2px solid var(--color-latte)',
          borderTopColor: 'transparent',
          animation: 'edit-upgrade-spin 0.85s linear infinite',
          flexShrink: 0,
        }}
        aria-hidden
      />
      <span>Applying your upgrade… this usually takes a few seconds.</span>
      <style>{`
        @keyframes edit-upgrade-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
