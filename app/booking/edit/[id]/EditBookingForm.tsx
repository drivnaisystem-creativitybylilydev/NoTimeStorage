'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { updateBookingItems } from '@/lib/booking/update-booking';
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
  if (qty === 1) return 8000;
  if (qty === 2 || qty === 3) return 5500;
  if (qty >= 4) return 6000;
  return 8000;
}

type AdditionalItems = {
  smallWithBox: number;
  smallWithoutBox: number;
  mediumWithBox: number;
  mediumWithoutBox: number;
  large: number;
};

export function EditBookingForm({
  bookingId,
  initialBoxQuantity,
  initialAdditionalItems,
}: {
  bookingId: string;
  initialBoxQuantity: number;
  initialAdditionalItems: AdditionalItems;
}) {
  const router = useRouter();
  const [boxQuantity, setBoxQuantity] = useState(initialBoxQuantity);
  const [additionalItems, setAdditionalItems] = useState(initialAdditionalItems);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getBoxPrice = (qty: number) => {
    if (qty === 1) return 80;
    if (qty === 2 || qty === 3) return 55;
    if (qty >= 4) return 60;
    return 80;
  };

  const itemPrices = {
    smallWithBox: 9,
    smallWithoutBox: 11,
    mediumWithBox: 9,
    mediumWithoutBox: 12,
    large: 15,
  };

  const boxPrice = getBoxPrice(boxQuantity);
  const boxesTotal = boxPrice * boxQuantity;
  const itemsTotal =
    additionalItems.smallWithBox * itemPrices.smallWithBox +
    additionalItems.smallWithoutBox * itemPrices.smallWithoutBox +
    additionalItems.mediumWithBox * itemPrices.mediumWithBox +
    additionalItems.mediumWithoutBox * itemPrices.mediumWithoutBox +
    additionalItems.large * itemPrices.large;
  const monthlyTotal = boxesTotal + itemsTotal;

  const updateItem = (key: keyof AdditionalItems, value: number) => {
    setAdditionalItems((prev) => ({ ...prev, [key]: Math.max(0, value) }));
  };

  const buildItems = (): BookingItemInput[] => {
    const items: BookingItemInput[] = [];
    if (boxQuantity > 0) {
      items.push({ item_type: 'box', quantity: boxQuantity, unit_price_cents: getBoxPriceCents(boxQuantity) });
    }
    (Object.keys(ITEM_TYPE_MAP) as (keyof typeof ITEM_TYPE_MAP)[]).forEach((key) => {
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
    if (items.length === 0) {
      setError('Add at least one box.');
      return;
    }
    setError(null);
    setSaving(true);
    const result = await updateBookingItems(bookingId, items);
    setSaving(false);
    if (result.success) {
      router.push('/dashboard');
      return;
    }
    setError(result.error);
  };

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

        <div style={{ marginBottom: '40px', padding: '32px', background: 'var(--color-paper)', borderRadius: '12px', border: '2px solid var(--color-latte)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-coffee)', marginBottom: '24px' }}>📦 Storage Boxes</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <label style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--color-gray-700)', minWidth: '120px' }}>Quantity:</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button onClick={() => setBoxQuantity(Math.max(1, boxQuantity - 1))} className="button-secondary" style={{ padding: '8px 20px', fontSize: '1.25rem', minWidth: '50px' }}>−</button>
              <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-coffee)', minWidth: '40px', textAlign: 'center' }}>{boxQuantity}</span>
              <button onClick={() => setBoxQuantity(boxQuantity + 1)} className="button-secondary" style={{ padding: '8px 20px', fontSize: '1.25rem', minWidth: '50px' }}>+</button>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>${boxPrice}/box/month</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-coffee)' }}>${boxesTotal}/month</div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '40px', padding: '32px', background: 'var(--color-white)', borderRadius: '12px', border: '2px solid var(--color-latte-soft)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-coffee)', marginBottom: '8px' }}>➕ Additional Items (Optional)</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)', marginBottom: '24px' }}>Add items that don&apos;t fit in boxes</p>
          <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--color-latte-soft)' }}>
            <div style={{ fontWeight: '600', marginBottom: '12px', color: 'var(--color-gray-800)' }}>Small Items</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem' }}>With box - $9/mo</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={() => updateItem('smallWithBox', additionalItems.smallWithBox - 1)} className="button-secondary" style={{ padding: '4px 12px', fontSize: '1rem' }}>−</button>
                  <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '600' }}>{additionalItems.smallWithBox}</span>
                  <button onClick={() => updateItem('smallWithBox', additionalItems.smallWithBox + 1)} className="button-secondary" style={{ padding: '4px 12px', fontSize: '1rem' }}>+</button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem' }}>Without box - $11/mo</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={() => updateItem('smallWithoutBox', additionalItems.smallWithoutBox - 1)} className="button-secondary" style={{ padding: '4px 12px', fontSize: '1rem' }}>−</button>
                  <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '600' }}>{additionalItems.smallWithoutBox}</span>
                  <button onClick={() => updateItem('smallWithoutBox', additionalItems.smallWithoutBox + 1)} className="button-secondary" style={{ padding: '4px 12px', fontSize: '1rem' }}>+</button>
                </div>
              </div>
            </div>
          </div>
          <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--color-latte-soft)' }}>
            <div style={{ fontWeight: '600', marginBottom: '12px', color: 'var(--color-gray-800)' }}>Medium Items</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem' }}>With box - $9/mo</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={() => updateItem('mediumWithBox', additionalItems.mediumWithBox - 1)} className="button-secondary" style={{ padding: '4px 12px', fontSize: '1rem' }}>−</button>
                  <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '600' }}>{additionalItems.mediumWithBox}</span>
                  <button onClick={() => updateItem('mediumWithBox', additionalItems.mediumWithBox + 1)} className="button-secondary" style={{ padding: '4px 12px', fontSize: '1rem' }}>+</button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem' }}>Without box - $12/mo</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={() => updateItem('mediumWithoutBox', additionalItems.mediumWithoutBox - 1)} className="button-secondary" style={{ padding: '4px 12px', fontSize: '1rem' }}>−</button>
                  <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '600' }}>{additionalItems.mediumWithoutBox}</span>
                  <button onClick={() => updateItem('mediumWithoutBox', additionalItems.mediumWithoutBox + 1)} className="button-secondary" style={{ padding: '4px 12px', fontSize: '1rem' }}>+</button>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: '600', marginBottom: '12px', color: 'var(--color-gray-800)' }}>Large Items</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem' }}>Any size - $15/mo</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={() => updateItem('large', additionalItems.large - 1)} className="button-secondary" style={{ padding: '4px 12px', fontSize: '1rem' }}>−</button>
                <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '600' }}>{additionalItems.large}</span>
                <button onClick={() => updateItem('large', additionalItems.large + 1)} className="button-secondary" style={{ padding: '4px 12px', fontSize: '1rem' }}>+</button>
              </div>
            </div>
          </div>
        </div>

        {error && <p style={{ color: '#b91c1c', fontSize: '0.9375rem', marginBottom: '16px' }}>{error}</p>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', background: 'var(--color-latte-soft)', borderRadius: '12px', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Monthly Total</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-coffee)' }}>${monthlyTotal}/month</div>
          </div>
          <button onClick={handleSave} disabled={saving} className="button-primary" style={{ padding: '16px 48px', fontSize: '1.125rem' }}>
            {saving ? 'Saving…' : 'Save changes'}
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
