'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { createBooking } from '@/lib/booking/create-booking';
import type { CreateBookingInput, BookingItemType } from '@/lib/booking/types';

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

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));
  }, []);

  // Get all booking details from URL
  const boxes = searchParams.get('boxes') || '0';
  const moveOutDate = searchParams.get('moveOutDate') || '';
  const moveInDate = searchParams.get('moveInDate') || '';
  const moveOutTime = searchParams.get('moveOutTime') || '';
  const dorm = searchParams.get('dorm') || '';
  const elevator = searchParams.get('elevator') || '';
  const stairs = searchParams.get('stairs') || '';
  const instructions = searchParams.get('instructions') || '';

  // Calculate pricing
  const getBoxPrice = (qty: number) => {
    if (qty === 1) return 80;
    if (qty === 2 || qty === 3) return 55;
    if (qty >= 4) return 60;
    return 80;
  };

  const boxQty = parseInt(boxes);
  const boxPrice = getBoxPrice(boxQty);
  const boxesTotal = boxPrice * boxQty;

  const itemPrices: Record<string, number> = {
    smallWithBox: 9,
    smallWithoutBox: 11,
    mediumWithBox: 9,
    mediumWithoutBox: 12,
    large: 15,
  };

  let itemsTotal = 0;
  const itemsList: string[] = [];

  ['smallWithBox', 'smallWithoutBox', 'mediumWithBox', 'mediumWithoutBox', 'large'].forEach(key => {
    const qty = parseInt(searchParams.get(key) || '0');
    if (qty > 0) {
      itemsTotal += qty * itemPrices[key];
      const label = key.replace(/([A-Z])/g, ' $1').toLowerCase();
      itemsList.push(`${qty} ${label} item(s)`);
    }
  });

  const monthlyTotal = boxesTotal + itemsTotal;
  const monthlyTotalCents = Math.round(monthlyTotal * 100);

  const getBoxPriceCents = (qty: number) => {
    if (qty === 1) return 8000;
    if (qty === 2 || qty === 3) return 5500;
    if (qty >= 4) return 6000;
    return 8000;
  };

  const buildBookingPayload = (): CreateBookingInput | null => {
    if (!userId || !moveOutDate || !moveInDate || !moveOutTime || !dorm || !elevator || !stairs) return null;
    const boxQtyNum = parseInt(boxes);
    if (boxQtyNum < 1) return null;

    const items: CreateBookingInput['items'] = [];
    items.push({ item_type: 'box', quantity: boxQtyNum, unit_price_cents: getBoxPriceCents(boxQtyNum) });
    ['smallWithBox', 'smallWithoutBox', 'mediumWithBox', 'mediumWithoutBox', 'large'].forEach((key) => {
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
      dorm,
      elevator_available: elevator === 'yes',
      stairs_required: stairs === 'yes',
      special_instructions: instructions || undefined,
      school: searchParams.get('school') || 'Stonehill College',
      monthly_total_cents: monthlyTotalCents,
      items,
    };
  };

  const handleReserve = async () => {
    if (!userId) {
      router.push(`/auth/login?redirect=${encodeURIComponent(`/booking/payment?${searchParams.toString()}`)}`);
      return;
    }
    const payload = buildBookingPayload();
    if (!payload) {
      setSaveError('Missing booking details.');
      return;
    }
    setSaveError(null);
    setSaving(true);
    console.log('[payment] calling createBooking...');
    const result = await createBooking(payload);
    console.log('[payment] createBooking result:', result.success ? 'success' : 'error', result);
    setSaving(false);
    if (result.success) {
      router.push(`/dashboard?booking=${result.bookingId}`);
      return;
    }
    setSaveError(result.error);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="auth-container">
      <div style={{ maxWidth: '800px', width: '100%', background: 'white', borderRadius: '16px', padding: '48px', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <Link href="/">
            <Image
              src="/brand/notime-storage-logo.png"
              alt="NoTime Storage"
              width={80}
              height={80}
              style={{ marginBottom: '24px' }}
            />
          </Link>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--color-coffee)', marginBottom: '12px' }}>
            Review & Payment
          </h1>
          <p style={{ fontSize: '1.125rem', color: 'var(--color-gray-600)' }}>
            Confirm your booking details
          </p>
        </div>

        {/* Booking Summary */}
        <div style={{ padding: '32px', background: 'var(--color-paper)', borderRadius: '12px', marginBottom: '32px', border: '2px solid var(--color-latte)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-coffee)', marginBottom: '24px' }}>
            Booking Summary
          </h2>

          {/* Storage Details */}
          <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--color-latte)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-gray-900)', marginBottom: '12px' }}>
              📦 Storage Items
            </h3>
            <div style={{ color: 'var(--color-gray-700)', fontSize: '0.875rem', lineHeight: '1.8' }}>
              <div>{boxQty} storage box{boxQty > 1 ? 'es' : ''} × ${boxPrice}/month = ${boxesTotal}/month</div>
              {itemsList.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  {itemsList.map((item, idx) => (
                    <div key={idx}>+ {item}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pickup & delivery details */}
          <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--color-latte)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-gray-900)', marginBottom: '12px' }}>
              🚚 Pickup & delivery
            </h3>
            <div style={{ color: 'var(--color-gray-700)', fontSize: '0.875rem', lineHeight: '1.8' }}>
              <div><strong>Move-out:</strong> {formatDate(moveOutDate)} at {formatTime(moveOutTime)}</div>
              {moveInDate && <div><strong>Move-in:</strong> {formatDate(moveInDate)}</div>}
              <div><strong>Location:</strong> {dorm}</div>
              <div><strong>Elevator:</strong> {elevator === 'yes' ? 'Available' : 'Not available'}</div>
              <div><strong>Stairs:</strong> {stairs === 'yes' ? 'Required' : 'Not required'}</div>
            </div>
          </div>

          {/* Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)', marginBottom: '4px' }}>
                Monthly Total
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-coffee)' }}>
                ${monthlyTotal}/month
              </div>
            </div>
          </div>
        </div>

        {/* Reserve or pay */}
        {saveError && (
          <div style={{ padding: '12px', marginBottom: '16px', background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: '8px', color: '#B91C1C', fontSize: '0.875rem' }}>
            {saveError}
          </div>
        )}

        <div style={{ padding: '32px', background: 'var(--color-paper)', borderRadius: '12px', marginBottom: '32px', border: '2px solid var(--color-latte)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-coffee)', marginBottom: '12px' }}>
            Reserve your spot
          </h2>
          <p style={{ color: 'var(--color-gray-600)', fontSize: '0.875rem', marginBottom: '20px' }}>
            {userId
              ? 'Save this booking to your account. Payment (Stripe) will be added soon.'
              : 'Sign in or create an account to save your booking.'}
          </p>
          <button
            type="button"
            onClick={handleReserve}
            disabled={saving}
            className="button-primary"
            style={{ padding: '16px 48px', fontSize: '1.125rem', opacity: saving ? 0.7 : 1, cursor: saving ? 'wait' : 'pointer' }}
          >
            {saving ? 'Saving…' : userId ? 'Save booking' : 'Sign in to save booking'}
          </button>
        </div>

        <div style={{ padding: '24px', background: '#FEF3C7', borderRadius: '12px', marginBottom: '32px', border: '2px solid #F59E0B', textAlign: 'center' }}>
          <p style={{ color: '#78350F', fontSize: '0.875rem', margin: 0 }}>
            <strong>Payment (Stripe)</strong> and email confirmations are coming next. Your booking will sync to Google Calendar, Slack, and Airtable once those integrations are enabled.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href={`/booking/schedule?${searchParams.toString()}`}>
            <button type="button" className="button-secondary" style={{ padding: '16px 32px', fontSize: '1rem' }}>
              ← Edit Details
            </button>
          </Link>
          <Link href="/dashboard">
            <button type="button" className="button-primary" style={{ padding: '16px 48px', fontSize: '1.125rem' }}>
              Go to Dashboard
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
