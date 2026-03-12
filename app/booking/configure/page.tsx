'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { AuthPageWrapper } from '@/app/components/AuthPageWrapper';

function ConfigurePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const plan = searchParams.get('plan') || '1box';

  // State for configuration
  const [boxQuantity, setBoxQuantity] = useState(1);
  const [additionalItems, setAdditionalItems] = useState({
    smallWithBox: 0,
    smallWithoutBox: 0,
    mediumWithBox: 0,
    mediumWithoutBox: 0,
    large: 0,
  });

  // Set initial box quantity based on plan
  useEffect(() => {
    if (plan === '0box') setBoxQuantity(0);
    else if (plan === '1box') setBoxQuantity(1);
    else if (plan === '2boxes') setBoxQuantity(2);
    else if (plan === '4boxes') setBoxQuantity(4);
  }, [plan]);

  // Pricing logic (0 boxes = $0; no box required)
  const getBoxPrice = (qty: number) => {
    if (qty === 0) return 0;
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

  // Calculate totals
  const boxPrice = getBoxPrice(boxQuantity);
  const boxesTotal = boxPrice * boxQuantity;
  
  const itemsTotal = 
    additionalItems.smallWithBox * itemPrices.smallWithBox +
    additionalItems.smallWithoutBox * itemPrices.smallWithoutBox +
    additionalItems.mediumWithBox * itemPrices.mediumWithBox +
    additionalItems.mediumWithoutBox * itemPrices.mediumWithoutBox +
    additionalItems.large * itemPrices.large;

  const monthlyTotal = boxesTotal + itemsTotal;

  const MAX_ADDITIONAL_ITEMS = 4;
  const totalAdditionalItems = Object.values(additionalItems).reduce((sum, v) => sum + v, 0);

  const updateItem = (key: keyof typeof additionalItems, delta: number) => {
    setAdditionalItems(prev => {
      const next = Math.max(0, prev[key] + delta);
      const newTotal = totalAdditionalItems - prev[key] + next;
      if (newTotal > MAX_ADDITIONAL_ITEMS) return prev;
      return { ...prev, [key]: next };
    });
  };

  const canContinue = boxQuantity >= 1 || totalAdditionalItems >= 1;
  const zeroBoxesWithItems = boxQuantity === 0 && totalAdditionalItems >= 1 && totalAdditionalItems <= 4;

  const handleContinue = () => {
    if (!canContinue) return;
    if (boxQuantity === 0 && (totalAdditionalItems < 1 || totalAdditionalItems > 4)) return;
    // Navigate to schedule page with configuration in URL
    const params = new URLSearchParams({
      boxes: boxQuantity.toString(),
      ...Object.fromEntries(
        Object.entries(additionalItems)
          .filter(([_, value]) => value > 0)
          .map(([key, value]) => [key, value.toString()])
      ),
    });
    router.push(`/booking/schedule?${params.toString()}`);
  };

  return (
    <AuthPageWrapper>
      <div
        style={{
          maxWidth: '900px',
          width: '100%',
          background: 'white',
          borderRadius: '18px',
          padding: 'clamp(14px, 3.5vw, 28px)',
          paddingTop: 'clamp(14px, 3.5vw, 22px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
          // Visually centered with breathing room, but keep full card within viewport
          margin: '32px 0 40px',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Link href="/">
            <Image
              src="/brand/notime-storage-logo.png"
              alt="NoTime Storage"
              width={80}
              height={80}
              style={{ marginBottom: '12px' }}
            />
          </Link>
          <h1 style={{ fontSize: '2.15rem', fontWeight: '800', color: 'var(--color-coffee)', marginBottom: '8px' }}>
            Configure Your Storage
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--color-gray-600)' }}>
            Choose boxes (optional) and/or additional items — up to 4 items if you skip boxes
          </p>
        </div>

        {/* Box Selection */}
        <div style={{ marginBottom: '24px', padding: 'clamp(10px, 2.5vw, 20px)', paddingTop: 'clamp(10px, 2.5vw, 14px)', background: 'var(--color-paper)', borderRadius: '14px', border: '2px solid var(--color-latte)' }}>
          <h2 style={{ fontSize: 'clamp(1.15rem, 3.5vw, 1.4rem)', fontWeight: '700', color: 'var(--color-coffee)', marginBottom: '16px', marginTop: 0 }}>
            📦 Storage Boxes (optional)
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-gray-700)' }}>
              Quantity:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => setBoxQuantity(Math.max(0, boxQuantity - 1))}
                className="button-secondary"
                style={{ padding: '8px 20px', fontSize: '1.25rem', minWidth: '50px' }}
              >
                −
              </button>
              <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-coffee)', minWidth: '40px', textAlign: 'center' }}>
                {boxQuantity}
              </span>
              <button
                onClick={() => setBoxQuantity(boxQuantity + 1)}
                className="button-secondary"
                style={{ padding: '8px 20px', fontSize: '1.25rem', minWidth: '50px' }}
              >
                +
              </button>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              {boxQuantity > 0 && (
                <>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>
                    ${boxPrice}/box/month
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-coffee)' }}>
                    ${boxesTotal}/month
                  </div>
                </>
              )}
              {boxQuantity === 0 && (
                <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>
                  Add items only below
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Items */}
        <div style={{ marginBottom: '24px', padding: 'clamp(10px, 2.5vw, 20px)', paddingTop: 'clamp(10px, 2.5vw, 14px)', background: 'var(--color-white)', borderRadius: '14px', border: '2px solid var(--color-latte-soft)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', marginTop: 0 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--color-coffee)', margin: 0 }}>
              ➕ Additional Items (Optional)
            </h2>
            <span style={{
              fontSize: '0.8rem', fontWeight: '700', padding: '4px 10px',
              borderRadius: '20px', whiteSpace: 'nowrap',
              background: totalAdditionalItems >= MAX_ADDITIONAL_ITEMS ? '#FEE2E2' : 'var(--color-paper)',
              color: totalAdditionalItems >= MAX_ADDITIONAL_ITEMS ? '#B91C1C' : '#6B5A52',
              border: `1px solid ${totalAdditionalItems >= MAX_ADDITIONAL_ITEMS ? '#FCA5A5' : 'var(--color-latte)'}`,
            }}>
              {totalAdditionalItems} / {MAX_ADDITIONAL_ITEMS} items
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-gray-600)', marginBottom: '18px' }}>
            {boxQuantity === 0
              ? `Store up to ${MAX_ADDITIONAL_ITEMS} loose items without boxes (e.g. mini fridge, lamp).`
              : `Items that don't fit in boxes — max ${MAX_ADDITIONAL_ITEMS} additional items.`
            }
          </p>

          {/* Small Items */}
          <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--color-latte-soft)' }}>
            <div style={{ fontWeight: '600', marginBottom: '10px', color: 'var(--color-gray-800)' }}>Small Items (lamp, fan, small bin)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem' }}>With box - $9/mo</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={() => updateItem('smallWithBox', -1)} className="button-secondary" style={{ padding: '4px 12px', fontSize: '1rem' }}>−</button>
                  <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '600' }}>{additionalItems.smallWithBox}</span>
                  <button onClick={() => updateItem('smallWithBox', +1)} disabled={totalAdditionalItems >= MAX_ADDITIONAL_ITEMS} className="button-secondary" style={{ padding: '4px 12px', fontSize: '1rem', opacity: totalAdditionalItems >= MAX_ADDITIONAL_ITEMS ? 0.35 : 1 }}>+</button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem' }}>Without box - $11/mo</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={() => updateItem('smallWithoutBox', -1)} className="button-secondary" style={{ padding: '4px 12px', fontSize: '1rem' }}>−</button>
                  <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '600' }}>{additionalItems.smallWithoutBox}</span>
                  <button onClick={() => updateItem('smallWithoutBox', +1)} disabled={totalAdditionalItems >= MAX_ADDITIONAL_ITEMS} className="button-secondary" style={{ padding: '4px 12px', fontSize: '1rem', opacity: totalAdditionalItems >= MAX_ADDITIONAL_ITEMS ? 0.35 : 1 }}>+</button>
                </div>
              </div>
            </div>
          </div>

          {/* Medium Items */}
          <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--color-latte-soft)' }}>
            <div style={{ fontWeight: '600', marginBottom: '10px', color: 'var(--color-gray-800)' }}>Medium Items (monitor, microwave, chair)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem' }}>With box - $9/mo</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={() => updateItem('mediumWithBox', -1)} className="button-secondary" style={{ padding: '4px 12px', fontSize: '1rem' }}>−</button>
                  <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '600' }}>{additionalItems.mediumWithBox}</span>
                  <button onClick={() => updateItem('mediumWithBox', +1)} disabled={totalAdditionalItems >= MAX_ADDITIONAL_ITEMS} className="button-secondary" style={{ padding: '4px 12px', fontSize: '1rem', opacity: totalAdditionalItems >= MAX_ADDITIONAL_ITEMS ? 0.35 : 1 }}>+</button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem' }}>Without box - $12/mo</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={() => updateItem('mediumWithoutBox', -1)} className="button-secondary" style={{ padding: '4px 12px', fontSize: '1rem' }}>−</button>
                  <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '600' }}>{additionalItems.mediumWithoutBox}</span>
                  <button onClick={() => updateItem('mediumWithoutBox', +1)} disabled={totalAdditionalItems >= MAX_ADDITIONAL_ITEMS} className="button-secondary" style={{ padding: '4px 12px', fontSize: '1rem', opacity: totalAdditionalItems >= MAX_ADDITIONAL_ITEMS ? 0.35 : 1 }}>+</button>
                </div>
              </div>
            </div>
          </div>

          {/* Large Items */}
          <div>
            <div style={{ fontWeight: '600', marginBottom: '10px', color: 'var(--color-gray-800)' }}>Large Items (mini fridge, desk, futon)</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem' }}>Any size - $15/mo</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={() => updateItem('large', -1)} className="button-secondary" style={{ padding: '4px 12px', fontSize: '1rem' }}>−</button>
                <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '600' }}>{additionalItems.large}</span>
                <button onClick={() => updateItem('large', +1)} disabled={totalAdditionalItems >= MAX_ADDITIONAL_ITEMS} className="button-secondary" style={{ padding: '4px 12px', fontSize: '1rem', opacity: totalAdditionalItems >= MAX_ADDITIONAL_ITEMS ? 0.35 : 1 }}>+</button>
              </div>
            </div>
          </div>
        </div>

        {/* Total & Continue */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', padding: 'clamp(12px, 3vw, 20px)', background: 'var(--color-latte-soft)', borderRadius: '14px', marginBottom: '18px' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Monthly Total</div>
            <div style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: '800', color: 'var(--color-coffee)' }}>
              ${monthlyTotal}/month
            </div>
          </div>
          <button
            onClick={handleContinue}
            disabled={!canContinue || (boxQuantity === 0 && (totalAdditionalItems < 1 || totalAdditionalItems > 4))}
            className="button-primary"
            style={{ padding: '12px 28px', fontSize: '1.05rem', flexShrink: 0, opacity: canContinue && (boxQuantity >= 1 || (totalAdditionalItems >= 1 && totalAdditionalItems <= 4)) ? 1 : 0.6 }}
          >
            Continue to Schedule →
          </button>
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link href="/" style={{ color: 'var(--color-gray-600)', fontSize: '0.875rem', textDecoration: 'underline' }}>
            ← Back to homepage
          </Link>
        </div>
      </div>
    </AuthPageWrapper>
  );
}

export default function ConfigurePage() {
  return (
    <Suspense fallback={<AuthPageWrapper><div /></AuthPageWrapper>}>
      <ConfigurePageContent />
    </Suspense>
  );
}
