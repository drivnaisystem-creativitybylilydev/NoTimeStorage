'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const noopSubscribe = () => () => {};
function getDocumentBody(): Element | null {
  return typeof document !== 'undefined' ? document.body : null;
}

function FixedCarousel({
  images,
  title,
  fullHeight = false,
  expandable = false,
}: {
  images: { src: string; alt: string; objectPosition?: string }[];
  title: string;
  fullHeight?: boolean;
  expandable?: boolean;
}) {
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const portalEl = useSyncExternalStore(noopSubscribe, getDocumentBody, () => null);

  useEffect(() => {
    setLoaded(false);
  }, [current]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (lightboxIndex !== null) {
        if (e.key === 'Escape') setLightboxIndex(null);
        return;
      }
      if (e.key === 'ArrowLeft') setCurrent((p) => (p === 0 ? images.length - 1 : p - 1));
      if (e.key === 'ArrowRight') setCurrent((p) => (p === images.length - 1 ? 0 : p + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [images.length, lightboxIndex]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightboxIndex]);

  const carouselInner = (
    <>
      <AnimatePresence mode="wait">
        <motion.img
          key={current}
          src={images[current].src}
          alt={images[current].alt}
          className={`carousel-image${fullHeight ? ' carousel-image--full' : ''}`}
          style={images[current].objectPosition ? { objectPosition: images[current].objectPosition } : undefined}
          loading={current === 0 ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          draggable={false}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0.85 }}
          transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
        />
      </AnimatePresence>
      {fullHeight && <div className="carousel-vignette" aria-hidden="true" />}
    </>
  );

  const containerClass = `carousel-container${fullHeight ? ' carousel-container--full' : ''}${loaded ? '' : ' loading'}${expandable ? ' carousel-container--expandable' : ''}`;

  return (
    <div className={`carousel-section${fullHeight ? ' carousel-section--full' : ''}`} role="region" aria-label={title}>
      {title && (
        <p className="carousel-title">
          {title}
          {expandable && <span className="carousel-title-hint"> · Tap image to enlarge</span>}
        </p>
      )}
      {expandable ? (
        <button
          type="button"
          className={containerClass}
          onClick={() => setLightboxIndex(current)}
          aria-label={`${images[current].alt} — open full screen`}
        >
          {carouselInner}
        </button>
      ) : (
        <div className={containerClass} role="img" aria-label={images[current].alt}>
          {carouselInner}
        </div>
      )}
      {images.length > 1 && (
        <div className="carousel-dots" role="tablist" aria-label={`${title} image selector`}>
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === current}
              className={`carousel-dot${i === current ? ' active' : ''}`}
              onClick={() => setCurrent(i)}
              aria-label={`View image ${i + 1} of ${images.length}`}
            />
          ))}
        </div>
      )}
      {expandable && lightboxIndex !== null && portalEl &&
        createPortal(
          <motion.div
            className="carousel-lightbox-root"
            role="dialog"
            aria-modal="true"
            aria-label={images[lightboxIndex].alt}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              className="carousel-lightbox-backdrop"
              aria-label="Close full screen image"
              onClick={() => setLightboxIndex(null)}
            />
            <img
              src={images[lightboxIndex].src}
              alt={images[lightboxIndex].alt}
              className="carousel-lightbox-img"
              style={
                images[lightboxIndex].objectPosition
                  ? { objectPosition: images[lightboxIndex].objectPosition }
                  : undefined
              }
              decoding="async"
            />
            <button
              type="button"
              className="carousel-lightbox-close"
              aria-label="Close"
              onClick={() => setLightboxIndex(null)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>
          </motion.div>,
          portalEl
        )}
    </div>
  );
}

/** Below-the-fold carousel + specs; dynamically imported from the homepage bundle. */
export default function BoxShowcaseSection() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section id="box-specifications" className="box-showcase-section">
      <button
        type="button"
        className={`box-showcase-trigger${isOpen ? ' open' : ''}`}
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
      >
        <motion.div
          className="trigger-rule"
          animate={{ scaleX: isOpen ? 0.3 : 1, opacity: isOpen ? 0 : 1 }}
          transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
        />

        <AnimatePresence>
          {!isOpen && (
            <motion.div
              className="trigger-icon"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <svg width="38" height="38" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <rect x="4" y="14" width="32" height="22" rx="3" stroke="#C9A47E" strokeWidth="2" fill="none" />
                <path d="M4 14l5-8h22l5 8" stroke="#C9A47E" strokeWidth="2" strokeLinejoin="round" fill="none" />
                <path d="M14 14v5a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-5" stroke="#C9A47E" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.span
          className="box-showcase-trigger-text"
          animate={
            isOpen
              ? {
                  fontSize: '11px',
                  letterSpacing: '2.9px',
                  fontWeight: 600,
                  color: '#C9A47E',
                }
              : {
                  fontSize: 'clamp(2.2rem, 4.5vw, 3.2rem)',
                  letterSpacing: '-0.5px',
                  fontWeight: 800,
                  color: '#4B2E25',
                }
          }
          transition={{ duration: 0.52, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ textTransform: isOpen ? 'uppercase' : 'none', display: 'block', textAlign: 'center' }}
        >
          Box Specifications
        </motion.span>

        <AnimatePresence>
          {!isOpen && (
            <motion.p
              className="trigger-teaser"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              40″ × 30″ × 30″ &nbsp;·&nbsp; 225 lbs max &nbsp;·&nbsp; 20.8 ft³
            </motion.p>
          )}
        </AnimatePresence>

        <motion.div
          className="box-showcase-trigger-arrow"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
        >
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
            <path d="M4 7l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="box-content"
            className="box-showcase-expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="box-showcase-inner">
              <div className="box-showcase-header">
                <h2 className="box-showcase-title">Premium Storage Boxes, Built for Students</h2>
              </div>

              <div className="box-showcase-content">
                <motion.div
                  className="box-carousels-left"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.08, ease: [0.32, 0.72, 0, 1] }}
                >
                  <FixedCarousel
                    title="Our Boxes in Action"
                    fullHeight
                    expandable
                    images={[
                      {
                        src: '/brand/box-scale-side.png',
                        alt: 'Person standing next to NoTime Storage box showing scale',
                        objectPosition: 'center center',
                      },
                      {
                        src: '/brand/box-scale-inside.png',
                        alt: 'Person standing inside NoTime Storage box showing depth',
                        objectPosition: 'center 75%',
                      },
                    ]}
                  />
                </motion.div>

                <motion.div
                  className="box-specs-panel"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.06, ease: [0.32, 0.72, 0, 1] }}
                >
                  <p
                    className="box-specs-intro"
                    style={{
                      fontSize: 'clamp(1.2rem, 2vw, 1.5rem)',
                      fontWeight: 700,
                      textAlign: 'center',
                      lineHeight: 1.5,
                      color: 'var(--color-coffee)',
                      textShadow: '0 0 18px rgba(201,164,126,0.22), 0 0 40px rgba(201,164,126,0.10)',
                      margin: 0,
                    }}
                  >
                    Each box handles a full dorm room&apos;s worth of belongings — from bedding and clothes to books
                    and small appliances.
                  </p>

                  <div className="box-specs-carousel-wrap">
                    <FixedCarousel
                      title="Technical Specs"
                      expandable
                      images={[
                        { src: '/brand/box-3d-view.png', alt: '3D isometric view showing 40×30×30 inch dimensions' },
                        { src: '/brand/box-birdseye-view.png', alt: "Bird's-eye view showing 40×30 inch floor area" },
                      ]}
                    />
                  </div>

                  <div className="box-specs-quick">
                    <p className="box-section-label">Box Metrics</p>
                    <div className="specs-badges-row">
                      <span className="spec-badge">
                        <span className="spec-badge-icon">📏</span>40″ × 30″ × 30″
                      </span>
                      <span className="spec-badge">
                        <span className="spec-badge-icon">⚖️</span>225 lbs max
                      </span>
                      <span className="spec-badge">
                        <span className="spec-badge-icon">📦</span>20.8 ft<sup className="spec-sup">3</sup>
                      </span>
                    </div>
                  </div>

                  <div className="box-fits-section">
                    <p className="box-section-label">What Fits Inside</p>
                    <div className="items-grid">
                      {[
                        { icon: '🛏️', label: 'Bedding', tip: 'Sheets, blankets & pillows' },
                        { icon: '👔', label: 'Clothes', tip: 'Jackets, shirts, pants, shoes' },
                        { icon: '📚', label: 'Books', tip: 'Textbooks, notebooks, binders' },
                        { icon: '🎒', label: 'Supplies', tip: 'Pens, folders, school gear' },
                        { icon: '💡', label: 'Appliances', tip: 'Fans, lamps, mini fridges' },
                        { icon: '🖼️', label: 'Decor', tip: 'Posters, photos, wall art' },
                      ].map(({ icon, label, tip }) => (
                        <div key={label} className="item-card" data-tooltip={tip}>
                          <div className="item-icon">{icon}</div>
                          <span className="item-label">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="box-rules-card">
                    <div className="rules-row">
                      <div className="rule-item">
                        <span>❌</span>No liquids
                      </div>
                      <div className="rule-item">
                        <span>✅</span>Tape all flaps shut
                      </div>
                      <div className="rule-item">
                        <span>⚠️</span>Don&apos;t overpack
                      </div>
                    </div>
                  </div>

                  <Link href="/booking/configure" style={{ display: 'block', textDecoration: 'none' }}>
                    <motion.button
                      type="button"
                      className="box-section-cta"
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                    >
                      Reserve Your Boxes
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                        <path
                          d="M4 10h12m0 0l-4-4m4 4l-4 4"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </motion.button>
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
