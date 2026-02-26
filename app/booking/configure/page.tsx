'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

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
    if (plan === '1box') setBoxQuantity(1);
    else if (plan === '2boxes') setBoxQuantity(2);
    else if (plan === '4boxes') setBoxQuantity(4);
  }, [plan]);

  // Pricing logic
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

  const updateItem = (key: keyof typeof additionalItems, value: number) => {
    setAdditionalItems(prev => ({ ...prev, [key]: Math.max(0, value) }));
  };

  const handleContinue = () => {
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
    <div className="auth-container">
      <div style={{ maxWidth: '900px', width: '100%', background: 'white', borderRadius: '16px', padding: '48px', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
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
            Configure Your Storage
          </h1>
          <p style={{ fontSize: '1.125rem', color: 'var(--color-gray-600)' }}>
            Customize your boxes and add any additional items
          </p>
        </div>

        {/* Box Selection */}
        <div style={{ marginBottom: '40px', padding: '32px', background: 'var(--color-paper)', borderRadius: '12px', border: '2px solid var(--color-latte)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-coffee)', marginBottom: '24px' }}>
            📦 Storage Boxes
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <label style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--color-gray-700)', minWidth: '120px' }}>
              Quantity:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => setBoxQuantity(Math.max(1, boxQuantity - 1))}
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
              <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>
                ${boxPrice}/box/month
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-coffee)' }}>
                ${boxesTotal}/month
              </div>
            </div>
          </div>
        </div>

        {/* Additional Items */}
        <div style={{ marginBottom: '40px', padding: '32px', background: 'var(--color-white)', borderRadius: '12px', border: '2px solid var(--color-latte-soft)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-coffee)', marginBottom: '8px' }}>
            ➕ Additional Items (Optional)
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)', marginBottom: '24px' }}>
            Add items that don't fit in boxes
          </p>

          {/* Small Items */}
          <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--color-latte-soft)' }}>
            <div style={{ fontWeight: '600', marginBottom: '12px', color: 'var(--color-gray-800)' }}>Small Items (lamp, fan, small bin)</div>
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

          {/* Medium Items */}
          <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--color-latte-soft)' }}>
            <div style={{ fontWeight: '600', marginBottom: '12px', color: 'var(--color-gray-800)' }}>Medium Items (monitor, microwave, chair)</div>
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

          {/* Large Items */}
          <div>
            <div style={{ fontWeight: '600', marginBottom: '12px', color: 'var(--color-gray-800)' }}>Large Items (mini fridge, desk, futon)</div>
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

        {/* Total & Continue */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', background: 'var(--color-latte-soft)', borderRadius: '12px', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Monthly Total</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-coffee)' }}>
              ${monthlyTotal}/month
            </div>
          </div>
          <button onClick={handleContinue} className="button-primary" style={{ padding: '16px 48px', fontSize: '1.125rem' }}>
            Continue to Schedule →
          </button>
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link href="/" style={{ color: 'var(--color-gray-600)', fontSize: '0.875rem', textDecoration: 'underline' }}>
            ← Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ConfigurePage() {
  return (
    <Suspense fallback={<div className="auth-container" />}>
      <ConfigurePageContent />
    </Suspense>
  );
}
