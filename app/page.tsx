'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { submitReminderSignup } from '@/lib/reminder/signup';
import { SCHOOLS } from '@/lib/schools/config';
import { CircularCarousel } from '@/app/components/CircularCarousel';
import { SiteHeader } from '@/app/components/SiteHeader';
// #region agent log
const DEBUG_LOG = (data: Record<string, unknown>) => { fetch('http://127.0.0.1:7791/ingest/e0f7eab6-ff14-43bf-bf05-6812e1535afb', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '104cb8' }, body: JSON.stringify({ sessionId: '104cb8', location: 'page.tsx', timestamp: Date.now(), ...data }) }).catch(() => {}); };
// #endregion

function FixedCarousel({ images, title, fullHeight = false }: { images: { src: string; alt: string; objectPosition?: string }[]; title: string; fullHeight?: boolean }) {
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setLoaded(false); }, [current]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setCurrent(p => (p === 0 ? images.length - 1 : p - 1));
      if (e.key === 'ArrowRight') setCurrent(p => (p === images.length - 1 ? 0 : p + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [images.length]);

  return (
    <div className={`carousel-section${fullHeight ? ' carousel-section--full' : ''}`} role="region" aria-label={title}>
      {title && <p className="carousel-title">{title}</p>}
      <div className={`carousel-container${fullHeight ? ' carousel-container--full' : ''}${loaded ? '' : ' loading'}`} role="img" aria-label={images[current].alt}>
        <AnimatePresence mode="wait">
          <motion.img
            key={current}
            src={images[current].src}
            alt={images[current].alt}
            className={`carousel-image${fullHeight ? ' carousel-image--full' : ''}`}
            style={images[current].objectPosition ? { objectPosition: images[current].objectPosition } : undefined}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          />
        </AnimatePresence>
        {/* Dark brown vignette overlay for full-height real-life images */}
        {fullHeight && <div className="carousel-vignette" aria-hidden="true" />}
      </div>
      {images.length > 1 && (
        <div className="carousel-dots" role="tablist" aria-label={`${title} image selector`}>
          {images.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === current}
              className={`carousel-dot${i === current ? ' active' : ''}`}
              onClick={() => setCurrent(i)}
              aria-label={`View image ${i + 1} of ${images.length}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BoxShowcase() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section id="box-specifications" className="box-showcase-section">
      {/* ── Trigger ── */}
      <button
        className={`box-showcase-trigger${isOpen ? ' open' : ''}`}
        onClick={() => setIsOpen(o => !o)}
        aria-expanded={isOpen}
      >
        {/* Decorative top rule */}
        <motion.div
          className="trigger-rule"
          animate={{ scaleX: isOpen ? 0.3 : 1, opacity: isOpen ? 0 : 1 }}
          transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
        />

        {/* Box icon — fades out when open */}
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
                <rect x="4" y="14" width="32" height="22" rx="3" stroke="#C9A47E" strokeWidth="2" fill="none"/>
                <path d="M4 14l5-8h22l5 8" stroke="#C9A47E" strokeWidth="2" strokeLinejoin="round" fill="none"/>
                <path d="M14 14v5a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-5" stroke="#C9A47E" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.span
          className="box-showcase-trigger-text"
          animate={isOpen ? {
            fontSize: '11px',
            letterSpacing: '2.9px',
            fontWeight: 600,
            color: '#C9A47E',
          } : {
            fontSize: 'clamp(2.2rem, 4.5vw, 3.2rem)',
            letterSpacing: '-0.5px',
            fontWeight: 800,
            color: '#4B2E25',
          }}
          transition={{ duration: 0.52, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ textTransform: isOpen ? 'uppercase' : 'none', display: 'block', textAlign: 'center' }}
        >
          Box Specifications
        </motion.span>

        {/* Teaser specs — visible only when closed */}
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
            <path d="M4 7l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      </button>

      {/* ── Expanded content ── */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="box-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="box-showcase-inner">
              <div className="box-showcase-header">
                <h2 className="box-showcase-title">Premium Storage Boxes, Built for Students</h2>
              </div>

              <div className="box-showcase-content">
                {/* LEFT BOX: Real-life photos, tall/full-height */}
                <motion.div
                  className="box-carousels-left"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.08, ease: [0.32, 0.72, 0, 1] }}
                >
                  <FixedCarousel
                    title="Our Boxes in Action"
                    fullHeight
                    images={[
                      { src: '/brand/box-scale-side.png', alt: 'Person standing next to NoTime Storage box showing scale', objectPosition: 'center center' },
                      { src: '/brand/box-scale-inside.png', alt: 'Person standing inside NoTime Storage box showing depth', objectPosition: 'center 75%' },
                    ]}
                  />
                </motion.div>

                <motion.div
                  className="box-specs-panel"
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
                >
                  <p className="box-specs-intro" style={{
                    fontSize: 'clamp(1.2rem, 2vw, 1.5rem)',
                    fontWeight: 700,
                    textAlign: 'center',
                    lineHeight: 1.5,
                    color: 'var(--color-coffee)',
                    textShadow: '0 0 18px rgba(201,164,126,0.22), 0 0 40px rgba(201,164,126,0.10)',
                    margin: 0,
                  }}>
                    Each box handles a full dorm room&apos;s worth of belongings — from bedding and clothes to books and small appliances.
                  </p>

                  <div className="box-specs-carousel-wrap">
                    <FixedCarousel
                      title="Technical Specs"
                      images={[
                        { src: '/brand/box-3d-view.png', alt: '3D isometric view showing 40×30×30 inch dimensions' },
                        { src: '/brand/box-birdseye-view.png', alt: "Bird's-eye view showing 40×30 inch floor area" },
                      ]}
                    />
                  </div>

                  <div className="box-specs-quick">
                    <p className="box-section-label">Box Metrics</p>
                    <div className="specs-badges-row">
                      <span className="spec-badge"><span className="spec-badge-icon">📏</span>40″ × 30″ × 30″</span>
                      <span className="spec-badge"><span className="spec-badge-icon">⚖️</span>225 lbs max</span>
                      <span className="spec-badge"><span className="spec-badge-icon">📦</span>20.8 ft<sup className="spec-sup">3</sup></span>
                    </div>
                  </div>

                  <div className="box-fits-section">
                    <p className="box-section-label">What Fits Inside</p>
                    <div className="items-grid">
                      {[
                        { icon: '🛏️', label: 'Bedding',    tip: 'Sheets, blankets & pillows' },
                        { icon: '👔', label: 'Clothes',    tip: 'Jackets, shirts, pants, shoes' },
                        { icon: '📚', label: 'Books',      tip: 'Textbooks, notebooks, binders' },
                        { icon: '🎒', label: 'Supplies',   tip: 'Pens, folders, school gear' },
                        { icon: '💡', label: 'Appliances', tip: 'Fans, lamps, mini fridges' },
                        { icon: '🖼️', label: 'Decor',      tip: 'Posters, photos, wall art' },
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
                      <div className="rule-item"><span>❌</span>No liquids</div>
                      <div className="rule-item"><span>✅</span>Tape all flaps shut</div>
                      <div className="rule-item"><span>⚠️</span>Don&apos;t overpack</div>
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
                        <path d="M4 10h12m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
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

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  // #region agent log
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  if (typeof window !== 'undefined' && (renderCountRef.current <= 3 || renderCountRef.current % 25 === 0)) { DEBUG_LOG({ message: 'Home render', data: { count: renderCountRef.current }, hypothesisId: 'rerender', runId: 'init' }); }
  // #endregion

  // Check authentication status (never block the page: timeout + show content)
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const timeout = setTimeout(() => {
      if (cancelled) return;
      setLoading(false);
    }, 2500);

    supabase.auth.getUser()
      .then(({ data: { user } }) => {
        if (!cancelled) {
          setUser(user);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      })
      .finally(() => clearTimeout(timeout));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // #region agent log
      DEBUG_LOG({ message: 'onAuthStateChange', data: { event: _event, hasSession: !!session }, hypothesisId: 'auth', runId: 'init' });
      // #endregion
      if (!cancelled) setUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);
  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  // Additional items dropdown state
  const [additionalItemsOpen, setAdditionalItemsOpen] = useState(false);

  const [reminderEmail, setReminderEmail] = useState('');
  const [reminderSubmitting, setReminderSubmitting] = useState(false);
  const [reminderSuccess, setReminderSuccess] = useState(false);
  const [reminderError, setReminderError] = useState<string | null>(null);

  const handleReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReminderError(null);
    setReminderSubmitting(true);
    const result = await submitReminderSignup({ email: reminderEmail });
    setReminderSubmitting(false);
    if (result.success) {
      setReminderSuccess(true);
      setReminderEmail('');
    } else {
      setReminderError(result.error);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Animation variants for hero elements
  const fadeInUp = {
    hidden: { 
      opacity: 0, 
      y: 20 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number]
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  return (
    <div>
      <SiteHeader />

      {/* Hero Section */}
      <section className="hero">
        <motion.div 
          className="hero-content"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.p 
            className="hero-subtitle"
            variants={fadeInUp}
          >
            Secure, climate-controlled storage with easy pickup & delivery
          </motion.p>
          <motion.h1 
            className="hero-title"
            variants={fadeInUp}
          >
            Stress-Free, Door-to-Door Storage for College Students
          </motion.h1>
          <motion.div 
            className="hero-buttons"
            variants={fadeInUp}
          >
            {(loading || !user) ? (
              <a href="/auth/signup">
                <button className="button-primary" type="button">Get Started</button>
              </a>
            ) : (
              <a href="/booking/configure">
                <button className="button-primary" type="button">Book Your Storage</button>
              </a>
            )}
            <a href="#how-it-works">
              <button className="button-secondary">Learn More</button>
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* Trust & Social Proof Strip - Campus logos from lib/schools/config */}
      <section className="trust-strip">
        <div className="trust-strip-content">
          <div className="trust-heading-wrapper">
            <motion.p
              className="trust-heading"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ textShadow: '0 2px 18px rgba(10, 4, 2, 0.85), 0 1px 6px rgba(10, 4, 2, 0.6)' }}
            >
              Official Moving Partners of:
            </motion.p>
            <motion.span
              className="trust-heading-underline"
              initial={{ scaleX: 0, opacity: 0 }}
              whileInView={{ scaleX: 1, opacity: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            />
          </div>
          <motion.div
            className="trust-social-proof"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="trust-social-proof-item">
              <span className="trust-social-stars">★★★★★</span>
              <span className="trust-social-value">5.0</span>
              <span className="trust-social-label">Student Rating</span>
            </div>
            <div className="trust-social-divider" />
            <div className="trust-social-proof-item">
              <span className="trust-social-value">300+</span>
              <span className="trust-social-label">Students Served</span>
            </div>
          </motion.div>
          <div className="campus-cards-row">
            <div>
              {[...SCHOOLS, ...SCHOOLS].map((school, idx) => {
                const logoSlug = school.logoSlug ?? school.shortName;
                return (
                  <div
                    key={`${school.name}-${idx}`}
                    aria-hidden={idx >= SCHOOLS.length}
                    className={`campus-school-tile campus-school-tile--${logoSlug.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Image
                      src={`/brand/school-logos/${logoSlug}.png?v=2`}
                      alt={school.name}
                      width={190}
                      height={190}
                      className="campus-school-logo"
                      unoptimized
                    />
                    <div className="campus-school-text">
                      <div className="campus-school-name">{school.name}</div>
                      <div className="campus-school-location">{school.location ?? ''}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Why NoTime Storage */}
      <section className="why-section">
        <div className="why-container">
          <motion.h2 
            className="why-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          >
            Why Choose NoTime Storage?
          </motion.h2>
          <motion.p 
            className="why-subtitle"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          >
            Built specifically for the needs of college students
          </motion.p>
          
          <CircularCarousel autoPlayInterval={5000} />
          <motion.div 
            className="section-cta"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {(loading || !user) ? (
              <Link href="/auth/signup"><button className="button-primary">Reserve Your Spot</button></Link>
            ) : (
              <Link href="/booking/configure"><button className="button-primary">Start Your Booking</button></Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works">
        <div className="how-it-works-container">
          <motion.h2 
            className="how-it-works-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          >
            How It Works
          </motion.h2>
          <motion.p 
            className="how-it-works-subtitle"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          >
            Simple, reliable storage in three steps
          </motion.p>
          
          <div className="steps-container">
            <motion.div 
              className="step"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Image src="/brand/schedule-pickup.png" alt="Schedule Pickup" width={240} height={240} className="step-image-placeholder" />
              <div className="step-number">1</div>
              <h3 className="step-title">Schedule Pickup</h3>
              <p className="step-description">Book a convenient time for us to collect your items. We come to you with all necessary packing materials.</p>
            </motion.div>
            
            <motion.div 
              className="step-arrow"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            >
              →
            </motion.div>
            
            <motion.div 
              className="step"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Image src="/brand/secure-storage.png" alt="Secure Storage" width={240} height={240} className="step-image-placeholder" />
              <div className="step-number">2</div>
              <h3 className="step-title">Secure Storage</h3>
              <p className="step-description">Your belongings are safely stored in our climate-controlled facility with 24/7 security and monitoring.</p>
            </motion.div>
            
            <motion.div 
              className="step-arrow"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            >
              →
            </motion.div>
            
            <motion.div 
              className="step"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, delay: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Image src="/brand/easy-redelivery.png" alt="Schedule move-in" width={240} height={240} className="step-image-placeholder" />
              <div className="step-number">3</div>
              <h3 className="step-title">Schedule Move-In</h3>
              <p className="step-description">During your booking you&apos;ll pick a move-in date and time. We deliver your items straight to your door when you&apos;re back on campus.</p>
            </motion.div>
          </div>
          <motion.div 
            className="section-cta"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {(loading || !user) ? (
              <Link href="/auth/signup"><button className="button-primary">Get Started Today</button></Link>
            ) : (
              <Link href="/booking/configure"><button className="button-primary">Book Your Pickup</button></Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* Storage Box Showcase */}
      <BoxShowcase />

      {/* Pricing Section */}
      <section className="pricing" id="pricing" data-section="pricing">
        <div className="pricing-container">
          {/* Hero Text Above Box */}
          <div className="pricing-hero">
            {/* Eyebrow */}
            <motion.div 
              className="pricing-eyebrow"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            >
              Student Storage Pricing
            </motion.div>

            {/* Main Headline */}
            <motion.h2 
              className="pricing-title"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            >
              Simple pricing.<br />Zero surprises.
            </motion.h2>

            {/* Accent underline */}
            <motion.div 
              className="pricing-accent"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            />

            {/* Subheadline */}
            <motion.p 
              className="pricing-subtitle"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            >
              Monthly per-box pricing. The more you store, the more you save.
            </motion.p>
          </div>

          {/* Wrapper for box + cards (same width constraint) */}
          <div className="pricing-content-wrapper">
            {/* Open Box Image - Behind Cards */}
            <motion.div 
              className="pricing-box-image"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Image
                src="/brand/box.png"
                alt=""
                width={1100}
                height={400}
                className="box-img"
                priority
              />
            </motion.div>

            {/* Pricing Cards - In Front of Box */}
            <div className="pricing-cards">
            {/* 1 Box */}
            <motion.div 
              className="pricing-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="card-header">
                <h3 className="plan-name">1 Box</h3>
                <p className="plan-description">Light traveler</p>
              </div>
              <div className="card-price">
                <span className="price-amount">$80</span>
                <span className="price-period">/box/month</span>
              </div>
              <ul className="features-list">
                <li>1 large storage box</li>
                <li>Free pickup & delivery</li>
                <li>Climate-controlled storage</li>
                <li>Insurance included</li>
              </ul>
              {(loading || !user) ? (
                <Link href="/auth/signup?redirect=/deposit">
                  <button className="button-primary">Select</button>
                </Link>
              ) : (
                <Link href="/deposit">
                  <button className="button-primary">Select</button>
                </Link>
              )}
            </motion.div>

            {/* 2 Boxes - Best Value */}
            <motion.div 
              className="pricing-card featured"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="featured-badge">Best Value</div>
              <div className="savings-badge">Save $50/month</div>
              <div className="card-header">
                <h3 className="plan-name">2-3 Boxes</h3>
                <p className="plan-description">Most popular choice</p>
              </div>
              <div className="card-price">
                <span className="price-amount">$55</span>
                <span className="price-period">/box/month</span>
              </div>
              <ul className="features-list">
                <li>2-3 large storage boxes</li>
                <li>Free pickup & delivery</li>
                <li>Climate-controlled storage</li>
                <li>Insurance included</li>
                <li>Priority scheduling</li>
              </ul>
              {(loading || !user) ? (
                <Link href="/auth/signup?redirect=/deposit">
                  <button className="button-primary">Select</button>
                </Link>
              ) : (
                <Link href="/deposit">
                  <button className="button-primary">Select</button>
                </Link>
              )}
            </motion.div>

            {/* 4 Boxes */}
            <motion.div 
              className="pricing-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="card-header">
                <h3 className="plan-name">4 Boxes</h3>
                <p className="plan-description">Maximum capacity</p>
              </div>
              <div className="card-price">
                <span className="price-amount">$60</span>
                <span className="price-period">/box/month</span>
              </div>
              <ul className="features-list">
                <li>4 large storage boxes</li>
                <li>Free pickup & delivery</li>
                <li>Climate-controlled storage</li>
                <li>Insurance included</li>
                <li>Priority scheduling</li>
              </ul>
              {(loading || !user) ? (
                <Link href="/auth/signup?redirect=/deposit">
                  <button className="button-primary">Select</button>
                </Link>
              ) : (
                <Link href="/deposit">
                  <button className="button-primary">Select</button>
                </Link>
              )}
            </motion.div>
          </div>

          {/* Additional Items Section - Collapsible */}
          <motion.div 
            className="pricing-section-header additional-items-header"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <button 
              className="additional-items-toggle"
              onClick={() => setAdditionalItemsOpen(!additionalItemsOpen)}
              aria-expanded={additionalItemsOpen}
            >
              <div className="additional-items-toggle-content">
                <div>
                  <h3 className="pricing-subsection-title">Additional Items (Optional)</h3>
                  <p className="pricing-subsection-subtitle">Store items that don't fit in boxes — furniture, sports equipment, and more</p>
                </div>
                <svg 
                  className={`additional-items-chevron ${additionalItemsOpen ? 'open' : ''}`}
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </button>
          </motion.div>

          <AnimatePresence>
            {additionalItemsOpen && (
              <>
                <motion.div 
                  className="items-pricing-grid"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <div className="item-pricing-card">
                    <div className="item-icon">📦</div>
                    <h4 className="item-name">Small Item</h4>
                    <p className="item-examples">Lamp, fan, small bin</p>
                    <div className="item-prices">
                      <div className="item-price-row">
                        <span className="item-option">With box</span>
                        <span className="item-cost">$9/month</span>
                      </div>
                      <div className="item-price-row">
                        <span className="item-option">Without box</span>
                        <span className="item-cost">$11/month</span>
                      </div>
                    </div>
                  </div>

                  <div className="item-pricing-card">
                    <div className="item-icon">📺</div>
                    <h4 className="item-name">Medium Item</h4>
                    <p className="item-examples">Monitor, microwave, chair</p>
                    <div className="item-prices">
                      <div className="item-price-row">
                        <span className="item-option">With box</span>
                        <span className="item-cost">$9/month</span>
                      </div>
                      <div className="item-price-row">
                        <span className="item-option">Without box</span>
                        <span className="item-cost">$12/month</span>
                      </div>
                    </div>
                  </div>

                  <div className="item-pricing-card">
                    <div className="item-icon">🛋️</div>
                    <h4 className="item-name">Large Item</h4>
                    <p className="item-examples">Mini fridge, desk, futon</p>
                    <div className="item-prices">
                      <div className="item-price-row single">
                        <span className="item-option">Any size</span>
                        <span className="item-cost">$15/month</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  className="pricing-note"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <p>💡 Mix and match boxes and items to create your perfect storage solution</p>
                </motion.div>
              </>
            )}
          </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Comparison Table - before reviews for conversion */}
      <section className="comparison-section">
        <div className="comparison-container">
          <motion.h2 
            className="comparison-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          >
            NoTime Storage vs DIY
          </motion.h2>
          <motion.p 
            className="comparison-subtitle"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          >
            Save time, avoid hassle, keep your belongings safe.
          </motion.p>
          
          <motion.div
            className="cv2-table"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {/* Column headers */}
            <div className="cv2-row cv2-header-row">
              <div className="cv2-feature-cell" />
              <div className="cv2-notime-cell cv2-notime-header">
                <Image src="/brand/notime-storage-logo.png?v=2" alt="NoTime Storage" width={36} height={36} className="cv2-logo" unoptimized />
                <div className="cv2-notime-header-name">NoTime Storage</div>
                <div className="cv2-notime-header-sub">Stress-free, door-to-door</div>
              </div>
              <div className="cv2-diy-cell cv2-diy-header">
                <div className="cv2-diy-header-name">DIY Storage</div>
                <div className="cv2-diy-header-sub">The hidden cost breakdown</div>
              </div>
            </div>

            {/* Rows */}
            <div className="cv2-row">
              <div className="cv2-feature-cell">Pickup &amp; Delivery</div>
              <div className="cv2-notime-cell"><span className="cv2-check">✓</span><span>Included</span></div>
              <div className="cv2-diy-cell"><span className="cv2-x">✗</span><div className="cv2-cost"><span className="cv2-cost-amount">$800+</span><span className="cv2-cost-source">Move.org</span></div></div>
            </div>

            <div className="cv2-row">
              <div className="cv2-feature-cell">Packing Materials</div>
              <div className="cv2-notime-cell"><span className="cv2-check">✓</span><span>Free</span></div>
              <div className="cv2-diy-cell"><span className="cv2-x">✗</span><div className="cv2-cost"><span className="cv2-cost-amount">$68+</span><span className="cv2-cost-source">Home Depot</span></div></div>
            </div>

            <div className="cv2-row">
              <div className="cv2-feature-cell">Climate Control</div>
              <div className="cv2-notime-cell"><span className="cv2-check">✓</span><span>Always included</span></div>
              <div className="cv2-diy-cell"><span className="cv2-x">✗</span><div className="cv2-cost"><span className="cv2-cost-amount">+$50/mo</span><span className="cv2-cost-source">Storage.com</span></div></div>
            </div>

            <div className="cv2-row">
              <div className="cv2-feature-cell">Insurance</div>
              <div className="cv2-notime-cell"><span className="cv2-check">✓</span><span>Included</span></div>
              <div className="cv2-diy-cell"><span className="cv2-x">✗</span><div className="cv2-cost"><span className="cv2-cost-amount">+$15/mo</span><span className="cv2-cost-source">Add-on cost</span></div></div>
            </div>

            <div className="cv2-row">
              <div className="cv2-feature-cell">Access Anytime</div>
              <div className="cv2-notime-cell"><span className="cv2-check">✓</span><span>Request delivery</span></div>
              <div className="cv2-diy-cell"><span className="cv2-tilde">~</span><div className="cv2-cost"><span className="cv2-cost-amount">Drive to unit</span><span className="cv2-cost-source">Your time & gas</span></div></div>
            </div>

            <div className="cv2-row">
              <div className="cv2-feature-cell">Time Investment</div>
              <div className="cv2-notime-cell"><span className="cv2-check">✓</span><span>10 minutes</span></div>
              <div className="cv2-diy-cell"><span className="cv2-x">✗</span><div className="cv2-cost"><span className="cv2-cost-amount">4–8 hours</span><span className="cv2-cost-source">Moving day alone</span></div></div>
            </div>

            {/* Total row */}
            <div className="cv2-row cv2-total-row">
              <div className="cv2-feature-cell cv2-total-label">Est. First Month</div>
              <div className="cv2-notime-cell cv2-notime-total">
                <div className="cv2-total-price-notime">From $80</div>
                <div className="cv2-total-sub-notime">per month</div>
              </div>
              <div className="cv2-diy-cell cv2-diy-total">
                <div className="cv2-total-price-diy">$800+</div>
                <div className="cv2-total-sub-diy">first month alone</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="comparison-cta"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {(loading || !user) ? (
              <Link href="/auth/signup">
                <button className="button-primary">Choose NoTime Storage</button>
              </Link>
            ) : (
              <Link href="/booking/configure">
                <button className="button-primary">Book Your Storage</button>
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="testimonials-container">
          <h2 className="testimonials-title">
            Student Reviews
            <span className="testimonials-title-accent" />
          </h2>
          <p className="testimonials-subtitle">Here's what students have to say about NoTime Storage</p>
          
          {(() => {
            const reviews = [
              { name: 'Sammy F.', sub: 'Stonehill Junior · California', text: '"It was overall a great experience, and it made my life so much easier and less stressful."' },
              { name: 'Kira P.', sub: 'Stonehill Junior · Pennsylvania', text: '"Jermaine (the owner) was very open and worked hard to make everything convenient for us."' },
              { name: 'Emma T.', sub: 'Stonehill Sophomore · Connecticut', text: '"I would recommend the service to a friend — to support a student-run business, and because of the affordable pricing."' },
              { name: 'Trevian R.', sub: 'Stonehill Sophomore · Maryland', text: '"I would honestly pay more. I didn\'t touch a thing, and the move was legit 5 minutes."' },
              { name: 'Hannah W.', sub: 'Stonehill Sophomore · Massachusetts', text: '"I didn\'t think I needed the service since I live an hour away, but I\'m so glad I did. Saves so much time and stress — sooo worth it!"' },
            ];
            return (
              <div className="reviews-scroll-row">
                <div>
                  {[...reviews, ...reviews].map((r, idx) => (
                    <div key={idx} aria-hidden={idx >= reviews.length} className="testimonial-card" style={{ width: '300px', flexShrink: 0 }}>
                      <div className="testimonial-stars">★★★★★</div>
                      <p className="testimonial-text">{r.text}</p>
                      <div className="testimonial-author">
                        <strong>{r.name}</strong>
                        <span>{r.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
          <motion.div 
            className="section-cta"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {(loading || !user) ? (
              <Link href="/auth/signup"><button className="button-primary">Join Happy Students</button></Link>
            ) : (
              <Link href="/booking/configure"><button className="button-primary">Book Storage Now</button></Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="faq">
        <div className="faq-container">
          <motion.h2 
            className="faq-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          >
            Frequently Asked Questions
          </motion.h2>
          <motion.p 
            className="faq-subtitle"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          >
            Common questions from students and parents
          </motion.p>
          
          <div className="faq-list">
            {[
              {
                q: "How does the pickup and delivery process work?",
                a: "After booking online, we show up at your dorm on your scheduled move-out day — no lugging boxes to a facility yourself. We carefully load everything into our truck and store it at our secure warehouse over the summer. When move-in rolls around, we deliver everything directly back to your new room on the date you chose at checkout."
              },
              {
                q: "How much does it cost and what's included?",
                a: "Pricing is based on the number of boxes and any additional items (mini-fridge, fan, rug, etc.) you need stored. A $50 deposit is collected at booking to secure your spot, and the remaining balance is due before pickup. We also offer a monthly payment plan that splits the remaining balance into 3 equal installments — great if you want to spread the cost over the summer."
              },
              {
                q: "What exactly counts as a 'box'?",
                a: "Our standard box is a medium-sized moving box (roughly 18\" × 18\" × 16\"). You can use your own boxes as long as they're sealed and sturdy. Oversized items like mini-fridges, fans, lamps, rugs, and chairs are listed separately as add-ons when you configure your order. If you have something unusual, reach out and we'll let you know how to list it."
              },
              {
                q: "What are the move-out and move-in date windows?",
                a: "Move-out windows are set per campus and aligned with each school's official checkout schedule — typically mid-to-late April through mid-May. Move-in delivery windows open in late August through September. You select your preferred dates and time slots at checkout, and we coordinate from there. Exact windows for your school are shown during booking."
              },
              {
                q: "Is my stuff safe while in storage?",
                a: "All belongings are stored in our climate-controlled, secure warehouse facility. Items are tracked and logged at pickup. While we take every precaution to ensure items are handled carefully, we recommend not storing irreplaceable valuables. If you have questions about a specific item, reach out before booking."
              },
              {
                q: "Can I add extra items after I've already booked?",
                a: "Yes — reach out to us before your pickup date and we can update your order. Additional items may affect your total price. We do our best to accommodate last-minute changes, especially if you contact us at least 48 hours before your scheduled pickup."
              },
              {
                q: "What if I need to cancel my booking?",
                a: "If you need to cancel, contact us as soon as possible. The $50 deposit is non-refundable once a pickup is scheduled, but any remaining balance paid will be refunded. If you cancel well in advance before a pickup date is confirmed, we'll work with you on a case-by-case basis."
              },
              {
                q: "Which schools do you currently serve?",
                a: "We currently serve Stonehill College, with plans to expand to additional campuses each semester. If your school isn't listed yet, sign up for our reminder list and we'll notify you when we launch at your campus. We're a student-run business founded at Stonehill, so new schools are added based on demand."
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                className={`faq-item ${openFaq === i ? 'active' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <button
                  className="faq-question"
                  onClick={() => toggleFaq(i)}
                  aria-expanded={openFaq === i}
                >
                  <span>{item.q}</span>
                  <span className="faq-icon">{openFaq === i ? '−' : '+'}</span>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      className="faq-answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                      <p>{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
          <motion.div 
            className="section-cta"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <Link href="/contact"><button className="button-primary">Need More Answers?</button></Link>
          </motion.div>
        </div>
      </section>

      {/* Early Reminder CTA */}
      <section className="reminder-cta-section">
        <div className="reminder-cta-container">
          <h2 className="reminder-cta-title">Get Reminders for Next Semester</h2>
          <p className="reminder-cta-subtitle">Get notified when storage booking opens for your campus</p>
          
          <form className="reminder-form" onSubmit={handleReminderSubmit}>
            <input 
              type="email" 
              placeholder="Enter your email address" 
              className="reminder-input"
              value={reminderEmail}
              onChange={(e) => setReminderEmail(e.target.value)}
              disabled={reminderSubmitting || reminderSuccess}
              required
            />
            <button 
              type="submit" 
              className="button-primary" 
              disabled={reminderSubmitting || reminderSuccess}
            >
              {reminderSubmitting ? 'Saving…' : reminderSuccess ? 'Signed up' : 'Set Reminder'}
            </button>
          </form>

          {reminderSuccess && (
            <p className="reminder-note reminder-success">
              You're on the list. We'll email you when storage booking opens.
            </p>
          )}
          {reminderError && (
            <p className="reminder-note reminder-error" role="alert">
              {reminderError}
            </p>
          )}
          {!reminderSuccess && !reminderError && (
            <p className="reminder-note">We'll notify you when the next season opens.</p>
          )}
        </div>
      </section>

      {/* Footer Section */}
      <footer className="footer">
        <motion.div 
          className="footer-container"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {/* Footer CTA */}
          <div className="footer-cta-section">
            <p className="footer-cta-text">Ready to store your things? Get started in minutes.</p>
            {(loading || !user) ? (
              <Link href="/auth/signup">
                <button className="button-primary">Get Started</button>
              </Link>
            ) : (
              <Link href="/booking/configure">
                <button className="button-primary">Book Storage Now</button>
              </Link>
            )}
          </div>

          <div className="footer-content">
            {/* Brand Column */}
            <div className="footer-column footer-brand">
              <Link href="/admin" aria-label="NoTime Storage admin sign-in">
                <Image
                  src="/brand/notime-storage-logo.png?v=2"
                  alt="NoTime Storage Logo"
                  width={150}
                  height={150}
                  className="footer-logo-image"
                  unoptimized
                />
              </Link>
              <p className="footer-description">
                Premium storage solutions designed for students, professionals, and anyone who needs secure, convenient storage.
              </p>
            </div>

            {/* Services Column */}
            <div className="footer-column">
              <h4 className="footer-heading">Services</h4>
              <ul className="footer-links">
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#how-it-works">How It Works</a></li>
                <li><a href="#pricing">Storage Options</a></li>
                <li><a href="#how-it-works">Pickup & Delivery</a></li>
              </ul>
            </div>

            {/* Company Column */}
            <div className="footer-column">
              <h4 className="footer-heading">Company</h4>
              <ul className="footer-links">
                <li><a href="#about">About Us</a></li>
                <li><a href="#faq">FAQ</a></li>
                <li><Link href="/contact">Contact</Link></li>
                <li><a href="#careers">Careers</a></li>
              </ul>
            </div>

            {/* Contact Column */}
            <div className="footer-column">
              <h4 className="footer-heading">Contact</h4>
              <ul className="footer-contact">
                <li>notimestorage@gmail.com</li>
                <li>(555) 123-4567</li>
                <li>Mon-Fri: 8am - 8pm</li>
                <li>Sat-Sun: 9am - 6pm</li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="footer-bottom">
            <p className="footer-copyright">© 2026 NoTime Storage. All rights reserved.</p>
            <div className="footer-legal">
              <a href="#privacy">Privacy Policy</a>
              <a href="#terms">Terms of Service</a>
            </div>
          </div>
        </motion.div>
      </footer>
    </div>
  );
}
