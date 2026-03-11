'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function PackingGuide() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ marginBottom: '40px', background: 'var(--color-paper)', borderRadius: '12px', border: '2px solid var(--color-latte)', overflow: 'hidden' }}>

      {/* Trigger */}
      <button
        onClick={() => setIsOpen(o => !o)}
        aria-expanded={isOpen}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'clamp(16px, 4vw, 28px) clamp(16px, 4vw, 32px)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-coffee)', margin: 0 }}>
            📦 How to Pack Your Box
          </h2>
          {!isOpen && (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-gray-500)', margin: '4px 0 0', fontWeight: 400 }}>
              Packing tips, specs &amp; important reminders
            </p>
          )}
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          style={{
            flexShrink: 0,
            marginLeft: '16px',
            width: '32px', height: '32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '50%',
            border: '1.5px solid var(--color-latte)',
            background: 'rgba(255,255,255,0.5)',
            color: 'var(--color-coffee)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M4 7l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      </button>

      {/* Collapsible content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="packing-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 clamp(16px, 4vw, 32px) clamp(16px, 4vw, 28px)' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-gray-600)', marginBottom: '24px', marginTop: 0 }}>
                Follow these guidelines so your pickup goes smoothly and nothing gets damaged in storage.
              </p>

              {/* Box specs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {[
                  { icon: '📏', label: 'Dimensions', value: '40″ × 30″ × 30″' },
                  { icon: '⚖️', label: 'Max Weight', value: 'Up to 225 lbs' },
                  { icon: '📦', label: 'Volume', value: '20.8 ft³' },
                ].map(({ icon, label, value }) => (
                  <div key={label} style={{ background: 'white', borderRadius: '10px', padding: '16px', border: '1px solid var(--color-latte-soft)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-gray-600)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                      <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-coffee)' }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* What fits */}
              <div style={{ background: 'white', borderRadius: '10px', padding: '20px', border: '1px solid var(--color-latte-soft)', marginBottom: '16px' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-coffee)', marginBottom: '12px' }}>✅ What fits inside</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-gray-700)', lineHeight: '1.6', margin: 0 }}>
                  Bedding, pillows, clothes, shoes, books, school supplies, small appliances, wall decor, and more — everything you need packed into one secure box.
                </p>
              </div>

              {/* Packing steps */}
              <div style={{ background: 'white', borderRadius: '10px', padding: '20px', border: '1px solid var(--color-latte-soft)', marginBottom: '16px' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-coffee)', marginBottom: '12px' }}>🗂️ Packing steps</p>
                <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: 'var(--color-gray-700)', lineHeight: '2' }}>
                  <li>Place heavier items (books, shoes) at the <strong>bottom</strong>.</li>
                  <li>Fill gaps with soft items (clothes, bedding) to prevent shifting.</li>
                  <li>Do <strong>not</strong> exceed the <strong>225 lb weight limit</strong> — overstuffed boxes may be refused.</li>
                  <li>Keep contents below the rim so the lid sits flat — no bulging lids.</li>
                  <li>Tape <strong>all flaps securely shut</strong> with strong packing tape before pickup.</li>
                </ol>
              </div>

              {/* Warning */}
              <div style={{ background: '#FFF8E1', border: '1.5px solid #F5C842', borderRadius: '10px', padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.25rem', flexShrink: 0, marginTop: '1px' }}>⚠️</span>
                <div style={{ fontSize: '0.875rem', color: '#5A4A00', lineHeight: '1.65' }}>
                  <strong>Important reminders:</strong>
                  <ul style={{ margin: '6px 0 0', paddingLeft: '18px' }}>
                    <li><strong>No liquids</strong> of any kind inside the box.</li>
                    <li><strong>All flaps must be taped shut</strong> before our team arrives — untaped boxes may not be accepted.</li>
                    <li><strong>Do not overpack.</strong> If the box cannot close properly or exceeds 225 lbs, additional fees may apply.</li>
                    <li>Fragile items should be individually wrapped in bubble wrap or clothing.</li>
                    <li>Label your box with your name if you have multiple boxes.</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
