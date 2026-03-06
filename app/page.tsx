'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { submitContactForm } from '@/lib/contact/submit';
import { submitReminderSignup } from '@/lib/reminder/signup';
import { SCHOOLS } from '@/lib/schools/config';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
  
  // Carousel state
  const [currentCard, setCurrentCard] = useState(0);

  // Additional items dropdown state
  const [additionalItemsOpen, setAdditionalItemsOpen] = useState(false);

  // Mobile nav state
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactSubjectOther, setContactSubjectOther] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  const [reminderEmail, setReminderEmail] = useState('');
  const [reminderSubmitting, setReminderSubmitting] = useState(false);
  const [reminderSuccess, setReminderSuccess] = useState(false);
  const [reminderError, setReminderError] = useState<string | null>(null);

  const CONTACT_SUBJECT_OPTIONS = [
    'Booking & scheduling',
    'Pricing & payment',
    'Technical support',
    'Partnership / Campus',
    'Billing or refund',
    'Other',
  ] as const;
  const isSubjectOther = contactSubject === 'Other';

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError(null);
    setContactSubmitting(true);
    const result = await submitContactForm({
      name: contactName,
      email: contactEmail,
      subject: contactSubject,
      subject_other: isSubjectOther ? contactSubjectOther : null,
      message: contactMessage,
    });
    setContactSubmitting(false);
    if (result.success) {
      setContactSubmitted(true);
      setContactName('');
      setContactEmail('');
      setContactSubject('');
      setContactSubjectOther('');
      setContactMessage('');
    } else {
      setContactError(result.error);
    }
  };

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

  // Value cards data
  const valueCards = [
    {
      icon: '📦',
      title: 'Stress-Free & Convenient',
      description: 'No trucks, no storage units, no hassle. We pick up and deliver to your door.'
    },
    {
      icon: '🔒',
      title: 'Secure & Climate-Controlled',
      description: '24/7 monitoring, climate control, and full insurance protection for your belongings.'
    },
    {
      icon: '💰',
      title: 'Transparent Student Pricing',
      description: 'Affordable rates built for students. No hidden fees, no surprises.'
    },
    {
      icon: '🚚',
      title: 'Door-to-Door Pickup & Return',
      description: 'We come to you. Schedule online and track your items anytime.'
    }
  ];

  // Auto-play carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCard((prev) => (prev + 1) % valueCards.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const goToCard = (index: number) => {
    setCurrentCard(index);
  };

  const shiftLeft = () => {
    setCurrentCard((prev) => (prev + 1) % valueCards.length);
  };

  const shiftRight = () => {
    setCurrentCard((prev) => (prev - 1 + valueCards.length) % valueCards.length);
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
      {/* Header */}
      <header className="header">
        <div className="header-container">
          <a href="/" className="header-logo">
            <Image
              src="/brand/notime-storage-logo.png?v=2"
              alt="NoTime Storage Logo"
              width={50}
              height={50}
              className="header-logo-image"
              priority
              unoptimized
            />
            <span className="header-logo-text">NoTime Storage</span>
          </a>
          <nav className="header-nav">
            <a href="#how-it-works">How It Works</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
            <a href="#contact">Contact</a>
            {(loading || !user) ? (
              <>
                <Link href="/auth/signup" className="header-cta">Get Started</Link>
                <Link href="/auth/login" className="header-login">Login</Link>
              </>
            ) : (
              <>
                <Link href="/booking/configure" className="header-cta">Book Storage</Link>
                <Link href="/dashboard" className="header-login">Dashboard</Link>
              </>
            )}
          </nav>
          <a href="https://www.instagram.com/notimestorage/" target="_blank" rel="noopener noreferrer" className="header-social" aria-label="Follow us on Instagram">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="currentColor"/>
            </svg>
          </a>
          {/* Hamburger button — only visible on mobile via CSS */}
          <button
            className={`hamburger-btn${mobileNavOpen ? ' open' : ''}`}
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            aria-label="Toggle navigation"
            aria-expanded={mobileNavOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {/* Mobile nav drawer */}
      <div className={`mobile-nav-drawer${mobileNavOpen ? ' open' : ''}`}>
        <a href="#how-it-works" onClick={() => setMobileNavOpen(false)}>How It Works</a>
        <a href="#pricing" onClick={() => setMobileNavOpen(false)}>Pricing</a>
        <a href="#faq" onClick={() => setMobileNavOpen(false)}>FAQ</a>
        <a href="#contact" onClick={() => setMobileNavOpen(false)}>Contact</a>
        {(loading || !user) ? (
          <>
            <Link href="/auth/login" onClick={() => setMobileNavOpen(false)}>Login</Link>
            <Link href="/auth/signup" className="mobile-nav-cta" onClick={() => setMobileNavOpen(false)}>Get Started</Link>
          </>
        ) : (
          <>
            <Link href="/dashboard" onClick={() => setMobileNavOpen(false)}>Dashboard</Link>
            <Link href="/booking/configure" className="mobile-nav-cta" onClick={() => setMobileNavOpen(false)}>Book Storage</Link>
          </>
        )}
      </div>

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
              <Link href="/auth/signup">
                <button className="button-primary">Get Started</button>
              </Link>
            ) : (
              <Link href="/booking/configure">
                <button className="button-primary">Book Your Storage</button>
              </Link>
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
              <span className="trust-social-value">4.7</span>
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
          
          {/* Circular Rotating Carousel */}
          <div className="peek-carousel-wrapper">
            <button 
              className="carousel-arrow carousel-arrow-left"
              onClick={shiftRight}
              aria-label="Previous card"
            >
              ‹
            </button>

            <div className="peek-carousel-container">
              <div className="peek-carousel-track">
                {/* Render all cards with circular positioning */}
                {valueCards.map((card, index) => {
                  // Calculate position relative to currentCard
                  const relativePosition = (index - currentCard + valueCards.length) % valueCards.length;
                  
                  // Show 4 positions to handle transitions smoothly: far-left, left, center, right
                  // Map them to: -2 (far left/exiting), -1 (left), 0 (center), 1 (right)
                  let displayPosition;
                  if (relativePosition === 0) displayPosition = 0; // center
                  else if (relativePosition === 1) displayPosition = 1; // right
                  else if (relativePosition === valueCards.length - 1) displayPosition = -1; // left
                  else if (relativePosition === valueCards.length - 2) displayPosition = -2; // far left (exiting)
                  else return null; // hide other cards
                  
                  // Calculate circular motion with strong depth separation
                  const radius = 400;
                  const angle = displayPosition * 45; // wider angle spread
                  const x = Math.sin((angle * Math.PI) / 180) * radius;
                  
                  // Exaggerated z-depth: cards further from center go much deeper back
                  let z;
                  if (displayPosition === 0) {
                    z = 0; // center card at front
                  } else if (displayPosition === -1 || displayPosition === 1) {
                    z = -150; // side cards go back
                  } else {
                    z = -300; // far cards go way back
                  }
                  
                  const isCenter = displayPosition === 0;
                  
                  // Z-index based on depth - closer cards on top
                  const zIndex = 50 - Math.abs(displayPosition) * 10;
                  
                  // Opacity management - hide far cards
                  let opacity;
                  if (isCenter) opacity = 1;
                  else if (displayPosition === -1 || displayPosition === 1) opacity = 0.5;
                  else opacity = 0; // far cards invisible
                  
                  return (
                    <motion.div
                      key={index}
                      className={`peek-carousel-card ${isCenter ? 'active' : ''}`}
                      animate={{
                        x: x,
                        z: z,
                        rotateY: -angle,
                        scale: isCenter ? 1 : 0.85,
                        opacity: opacity,
                      }}
                      transition={{
                        duration: 0.8,
                        ease: [0.45, 0.05, 0.55, 0.95],
                      }}
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        zIndex: zIndex,
                        pointerEvents: isCenter ? 'auto' : 'none',
                      }}
                    >
                      <div className="value-card">
                        <div className="value-icon">{card.icon}</div>
                        <h3 className="value-title">{card.title}</h3>
                        <p className="value-description">{card.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <button 
              className="carousel-arrow carousel-arrow-right"
              onClick={shiftLeft}
              aria-label="Next card"
            >
              ›
            </button>
          </div>

          {/* Carousel Dots */}
          <div className="carousel-dots">
            {valueCards.map((_, index) => (
              <button
                key={index}
                className={`carousel-dot ${currentCard === index ? 'active' : ''}`}
                onClick={() => goToCard(index)}
                aria-label={`Go to card ${index + 1}`}
              />
            ))}
          </div>
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
          <h2 className="testimonials-title">Student Reviews</h2>
          <p className="testimonials-subtitle">Sample testimonials — copy TBD</p>
          
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">"Made my summer break so much easier. They picked up everything from my dorm and delivered it back perfectly in the fall."</p>
              <div className="testimonial-author">
                <strong>Student Testimonial</strong>
                <span>Sample review</span>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">"My parents loved how easy and secure this was. No need to rent a storage unit or drive back and forth."</p>
              <div className="testimonial-author">
                <strong>Student Testimonial</strong>
                <span>Sample review</span>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">"Great pricing for students and the online tracking made it easy to see exactly what I had stored."</p>
              <div className="testimonial-author">
                <strong>Student Testimonial</strong>
                <span>Sample review</span>
              </div>
            </div>
          </div>
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
            {/* FAQ Item 1 */}
            <motion.div 
              className={`faq-item ${openFaq === 0 ? 'active' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <button 
                className="faq-question" 
                onClick={() => toggleFaq(0)}
                aria-expanded={openFaq === 0}
              >
                <span>How does the pickup and delivery process work?</span>
                <span className="faq-icon">{openFaq === 0 ? '−' : '+'}</span>
              </button>
              <AnimatePresence>
                {openFaq === 0 && (
                  <motion.div 
                    className="faq-answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <p>Simply schedule a pickup time that works for you through our website or app. We'll arrive with all necessary packing materials and carefully collect your items. When you need your belongings back, request delivery through your account and we'll bring them directly to your door.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* FAQ Item 2 */}
            <motion.div 
              className={`faq-item ${openFaq === 1 ? 'active' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <button 
                className="faq-question" 
                onClick={() => toggleFaq(1)}
                aria-expanded={openFaq === 1}
              >
                <span>Is my stuff insured while in storage?</span>
                <span className="faq-icon">{openFaq === 1 ? '−' : '+'}</span>
              </button>
              <AnimatePresence>
                {openFaq === 1 && (
                  <motion.div 
                    className="faq-answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <p>Yes, all items are covered by our comprehensive insurance policy at no additional cost. Your belongings are protected from the moment we pick them up until they're safely returned to you. Additional coverage options are available if needed.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* FAQ Item 3 */}
            <motion.div 
              className={`faq-item ${openFaq === 2 ? 'active' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <button 
                className="faq-question" 
                onClick={() => toggleFaq(2)}
                aria-expanded={openFaq === 2}
              >
                <span>Can I access my items while they're in storage?</span>
                <span className="faq-icon">{openFaq === 2 ? '−' : '+'}</span>
              </button>
              <AnimatePresence>
                {openFaq === 2 && (
                  <motion.div 
                    className="faq-answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <p>You can view your complete inventory 24/7 through our online portal. While we don't offer physical access to the storage facility for security reasons, you can request delivery of any items you need, and we'll bring them to you within 48 hours.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* FAQ Item 4 */}
            <motion.div 
              className={`faq-item ${openFaq === 3 ? 'active' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <button 
                className="faq-question" 
                onClick={() => toggleFaq(3)}
                aria-expanded={openFaq === 3}
              >
                <span>What items are not allowed in storage?</span>
                <span className="faq-icon">{openFaq === 3 ? '−' : '+'}</span>
              </button>
              <AnimatePresence>
                {openFaq === 3 && (
                  <motion.div 
                    className="faq-answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <p>We cannot store hazardous materials, perishable food items, illegal substances, firearms, or live plants. If you're unsure about a specific item, please contact our support team and we'll be happy to help clarify.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* FAQ Item 5 */}
            <motion.div 
              className={`faq-item ${openFaq === 4 ? 'active' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <button 
                className="faq-question" 
                onClick={() => toggleFaq(4)}
                aria-expanded={openFaq === 4}
              >
                <span>How do I cancel or change my storage plan?</span>
                <span className="faq-icon">{openFaq === 4 ? '−' : '+'}</span>
              </button>
              <AnimatePresence>
                {openFaq === 4 && (
                  <motion.div 
                    className="faq-answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <p>You can upgrade, downgrade, or cancel your plan at any time through your account dashboard. There are no cancellation fees. If you're canceling, simply schedule a delivery for all your items and your service will end once everything is returned.</p>
                  </motion.div>
                )}
              </AnimatePresence>
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
              <Link href="/auth/signup"><button className="button-primary">Create Your Account</button></Link>
            ) : (
              <Link href="/booking/configure"><button className="button-primary">Go to Booking</button></Link>
            )}
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

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="contact-container">
          <motion.h2
            className="contact-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          >
            Get in Touch
          </motion.h2>
          <motion.p
            className="contact-subtitle"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.25, 0.1, 0.25, 1] }}
          >
            Have a question or concern? We&apos;re here to help.
          </motion.p>

          <motion.div
            className="contact-form-wrapper"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {contactSubmitted ? (
              <motion.div
                className="contact-success"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <span className="contact-success-icon">✓</span>
                <h3 className="contact-success-title">Message sent</h3>
                <p className="contact-success-text">Thanks for reaching out. We&apos;ll get back to you soon.</p>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => { setContactSubmitted(false); setContactError(null); }}
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              <form className="contact-form" onSubmit={handleContactSubmit}>
                <div className="contact-form-row">
                  <label htmlFor="contact-name" className="contact-label">Name *</label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    placeholder="Your name"
                    className="contact-input"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    disabled={contactSubmitting}
                  />
                </div>
                <div className="contact-form-row">
                  <label htmlFor="contact-email" className="contact-label">Email *</label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="contact-input"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    disabled={contactSubmitting}
                  />
                </div>
                <div className="contact-form-row">
                  <label htmlFor="contact-subject" className="contact-label">Subject *</label>
                  <select
                    id="contact-subject"
                    required
                    className="contact-select"
                    value={contactSubject}
                    onChange={(e) => {
                      setContactSubject(e.target.value);
                      if (e.target.value !== 'Other') setContactSubjectOther('');
                    }}
                    disabled={contactSubmitting}
                  >
                    <option value="">Select a topic</option>
                    {CONTACT_SUBJECT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                {isSubjectOther && (
                  <motion.div
                    className="contact-form-row"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <label htmlFor="contact-subject-other" className="contact-label">Please specify</label>
                    <input
                      id="contact-subject-other"
                      type="text"
                      placeholder="Describe your concern"
                      className="contact-input"
                      value={contactSubjectOther}
                      onChange={(e) => setContactSubjectOther(e.target.value)}
                      disabled={contactSubmitting}
                    />
                  </motion.div>
                )}
                <div className="contact-form-row contact-form-row--full">
                  <label htmlFor="contact-message" className="contact-label">Your message *</label>
                  <textarea
                    id="contact-message"
                    required
                    rows={5}
                    placeholder="Tell us how we can help..."
                    className="contact-textarea"
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    disabled={contactSubmitting}
                  />
                </div>
                <div className="contact-form-actions">
                  {contactError && (
                    <p className="contact-form-error" role="alert">
                      {contactError}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="button-primary contact-submit"
                    disabled={contactSubmitting}
                  >
                    {contactSubmitting ? 'Sending…' : 'Send message'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
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
                <li><a href="#contact">Contact</a></li>
                <li><a href="#careers">Careers</a></li>
              </ul>
            </div>

            {/* Contact Column */}
            <div className="footer-column">
              <h4 className="footer-heading">Contact</h4>
              <ul className="footer-contact">
                <li>support@notimestorage.co</li>
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
