'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

function BookingUpdatedContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'changes';

  const isDates = type === 'dates';
  const isItems = type === 'items';
  const title = isDates ? 'Dates updated ✓' : isItems ? 'Booking updated ✓' : 'Changes saved ✓';
  const message = isDates
    ? "Your new move-out and move-in dates have been locked in. We'll schedule everything around them."
    : isItems
      ? 'Your boxes and items have been updated. Any additional charge has been processed and receipted.'
      : 'Your booking changes have been saved successfully.';

  const cardVariants = {
    hidden: { opacity: 0, y: 28, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as [number,number,number,number] } },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: (delay: number) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay, ease: [0.25, 0.1, 0.25, 1] as [number,number,number,number] } }),
  };

  return (
    <div className="auth-container">
      <motion.div className="auth-card" style={{ maxWidth: '480px' }} variants={cardVariants} initial="hidden" animate="visible">
        <div className="auth-logo">
          <Image src="/brand/notime-storage-logo.png" alt="NoTime Storage" width={60} height={60} />
        </div>

        <div style={{ textAlign: 'center', padding: '8px 0 32px' }}>
          <motion.div custom={0.05} variants={childVariants} initial="hidden" animate="visible" style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
            <svg viewBox="0 0 52 52" width="88" height="88" style={{ display: 'block' }}>
              <style>{`
                @keyframes bc-circle { from { stroke-dashoffset: 166; } to { stroke-dashoffset: 0; } }
                @keyframes bc-check  { from { stroke-dashoffset: 48;  } to { stroke-dashoffset: 0; } }
                .bc-circle { stroke-dasharray: 166; stroke-dashoffset: 166; animation: bc-circle 0.6s cubic-bezier(0.65,0,0.45,1) forwards; }
                .bc-check  { stroke-dasharray: 48;  stroke-dashoffset: 48;  animation: bc-check  0.4s cubic-bezier(0.65,0,0.45,1) 0.5s forwards; }
              `}</style>
              <circle className="bc-circle" cx="26" cy="26" r="25" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
              <polyline className="bc-check" points="14,26 22,34 38,18" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>

          <motion.h1 custom={0.15} variants={childVariants} initial="hidden" animate="visible"
            style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-coffee)', marginBottom: '10px' }}>
            {title}
          </motion.h1>
          <motion.p custom={0.22} variants={childVariants} initial="hidden" animate="visible"
            style={{ color: '#4A3A34', fontSize: '1rem', marginBottom: '28px', lineHeight: '1.6' }}>
            {message}
          </motion.p>

          <motion.div custom={0.3} variants={childVariants} initial="hidden" animate="visible">
            <Link href="/dashboard">
              <button type="button" className="button-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem', marginBottom: '12px' }}>
                View Dashboard
              </button>
            </Link>
            <Link href="/">
              <button type="button" className="button-secondary" style={{ width: '100%', padding: '12px', fontSize: '0.9rem' }}>
                Back to Home
              </button>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default function BookingUpdatedPage() {
  return (
    <Suspense fallback={<div className="auth-container" />}>
      <BookingUpdatedContent />
    </Suspense>
  );
}

