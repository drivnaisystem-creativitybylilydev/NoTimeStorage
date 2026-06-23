'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { submitReminderSignup } from '@/lib/reminder/signup';
import { SCHOOLS } from '@/lib/schools/config';
import AuthAwareCta from '@/app/components/AuthAwareCta';

const CircularCarousel = dynamic(
  () => import('@/app/components/CircularCarousel').then((m) => m.CircularCarousel),
  {
    loading: () => (
      <div
        aria-hidden
        style={{
          minHeight: 280,
          borderRadius: 16,
          background: 'rgba(75, 46, 37, 0.06)',
        }}
      />
    ),
    ssr: false,
  }
);
const BoxShowcaseSection = dynamic(() => import('@/app/home/BoxShowcaseSection'), {
  loading: () => (
    <section
      id="box-specifications"
      className="box-showcase-section"
      aria-hidden
      style={{ minHeight: 280 }}
    />
  ),
  ssr: false,
});
import { ADDON_PRICE_USD_MONTH, ADDON_TIER_HOMEPAGE_TEASER, ADDON_TIER_SUMMARY } from '@/lib/booking/addon-pricing';

const ADDON_TIER_FAQ_ANSWER =
  `Small (${ADDON_TIER_SUMMARY.small}): $${ADDON_PRICE_USD_MONTH.smallWithBox}/mo with a storage box, $${ADDON_PRICE_USD_MONTH.smallWithoutBox}/mo without. ` +
  `Medium (${ADDON_TIER_SUMMARY.medium}): $${ADDON_PRICE_USD_MONTH.mediumWithBox}/mo with box, $${ADDON_PRICE_USD_MONTH.mediumWithoutBox}/mo without. ` +
  `Large (${ADDON_TIER_SUMMARY.large}): $${ADDON_PRICE_USD_MONTH.large}/mo. If you rent storage boxes, small/medium add-ons use the “with box” rate; if you only use add-ons, use “without box” for small/medium.`;

const FAQ_ITEMS = [
  { q: "How does the move-out pickup work?", a: "After booking, you choose a move-out date and time slot (8:00 AM–4:40 PM). On your scheduled day, our team comes to your dorm room, loads your belongings into our truck, and takes them to our secure warehouse. We handle everything — no lugging boxes to a facility yourself. Each pickup takes about 5 minutes. If you have multiple students in the same hall, we can schedule pickups within 5 minutes of each other." },
  { q: "What is box distribution?", a: "\"Box distribution\" is the day before your scheduled move-out: we drop off empty storage boxes at your dorm so you can pack everything for pickup. It's not the same as move-in — that's when your packed items come back to campus later." },
  { q: "How does move-in delivery work?", a: "At checkout, you pick your preferred move-in delivery date or window. When the semester starts, we bring your belongings straight to your new room. About two weeks before move-in, we lock in the plan and contact you to double-check your dorm and room — so what's on file still matches where you're actually moving in." },
  { q: "What exactly counts as a 'box'?", a: "Our boxes are large, durable storage containers (40″ × 30″ × 30″, 225 lbs max, 20.8 ft³). Each fits a full dorm room's worth of belongings — bedding, clothes, books, small appliances, and decor. You can use our boxes or your own as long as they're sealed and sturdy. Bigger pieces that don't go inside a box are booked as add-ons (small / medium / large) at checkout." },
  { q: 'What counts as a small, medium, or large add-on?', a: ADDON_TIER_FAQ_ANSWER },
  { q: "What are the move-out and move-in date windows?", a: "Move-out windows are set per campus and aligned with each school's official checkout schedule — typically mid-to-late April through mid-May. Move-in delivery windows open in late August through September. You select your preferred dates and time slots at checkout. Exact windows for your school are shown during booking." },
  { q: "Is my stuff safe while in storage?", a: "All belongings are stored in our climate-controlled, secure warehouse facility. Items are tracked and logged at pickup. While we take every precaution to ensure items are handled carefully, we recommend not storing irreplaceable valuables. If you have questions about a specific item, reach out before booking." },
  { q: "How much does it cost and what's included?", a: "Pricing is based on the number of boxes and any additional items (mini-fridge, fan, rug, etc.) you need stored. A $50 deposit is collected first to secure your spot; the remaining balance for your whole storage term is due in full at checkout (before pickup), so you know the full cost up front." },
  { q: "Can I add extra items after I've already booked?", a: "Yes — reach out to us before your pickup date and we can update your order. Additional items may affect your total price. We do our best to accommodate last-minute changes, especially if you contact us at least 48 hours before your scheduled pickup." },
  { q: "What if I need to cancel my booking?", a: "If you need to cancel, contact us as soon as possible. The $50 deposit is non-refundable once a pickup is scheduled, but any remaining balance paid will be refunded. If you cancel well in advance before a pickup date is confirmed, we'll work with you on a case-by-case basis." },
  { q: "Which schools do you currently serve?", a: "We serve Stonehill College, University of New Haven, University of Dayton, University of Massachusetts, Brevard College, Gordon College, Central Connecticut State University, Sacred Heart University, Towson University, University of Notre Dame, James Madison University, and Bridgewater State University. If your school isn't listed yet, sign up for our reminder list and we'll notify you when we launch at your campus." },
];
import { SiteHeader } from '@/app/components/SiteHeader';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';


export default function Home() {
  // Auth-aware CTA buttons live in their own <AuthAwareCta /> island so Supabase
  // is code-split out of the homepage chunk (was ~200 KB raw on every visit).
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

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  return (
    <div className="home-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <SiteHeader />

      {/* Hero: static markup (no mount animation) improves LCP / INP */}
      <section className="hero">
        <div className="hero-content">
          <p className="hero-subtitle">
            Secure, climate-controlled storage with easy pickup & delivery
          </p>
          <div className="hero-service-toggle" role="group" aria-label="NoTime services">
            <span className="hero-service-toggle-tab hero-service-toggle-tab--active">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <polyline
                  points="3.27 6.96 12 12.01 20.73 6.96"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <line x1="12" y1="22.08" x2="12" y2="12" stroke="currentColor" strokeWidth="2" />
              </svg>
              Storage
            </span>
            <a href="https://notimemover.com" className="hero-service-toggle-tab hero-service-toggle-tab--inactive">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M10 17h4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M3 9h11v8H3V9z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 12h4l3 3v2h-7v-5z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <circle cx="7" cy="17" r="2" stroke="currentColor" strokeWidth="2" />
                <circle cx="17" cy="17" r="2" stroke="currentColor" strokeWidth="2" />
              </svg>
              Moving
            </a>
          </div>
          <h1 className="hero-title">
            <span className="hero-title-line">Stress-Free</span>
            <span className="hero-title-line">
              Door-to-Door <span className="hero-title-highlight">Storage</span>
            </span>
            <span className="hero-title-line">
              for <span className="hero-title-highlight">College Students</span>
            </span>
          </h1>
          <div className="hero-buttons">
            <AuthAwareCta
              useAnchor
              wrapperClassName="hero-cta-wrap"
              buttonClassName="hero-cta-primary"
              unauthHref="/auth/signup"
              unauthLabel="Get Started"
              authHref="/booking/configure"
              authLabel="Book Your Storage"
            />
            <a href="#how-it-works" className="hero-cta-wrap">
              <button className="hero-cta-secondary" type="button">
                Learn More
              </button>
            </a>
          </div>
        </div>
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
            transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
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
          <motion.div
            className="campus-cards-row"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.55, delay: 0.12, ease: [0.25, 0.1, 0.25, 1] }}
          >
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
                      src={`/brand/school-logos/${logoSlug}.png`}
                      alt={idx < SCHOOLS.length ? `${school.name} logo` : ''}
                      width={190}
                      height={190}
                      className="campus-school-logo"
                      loading="lazy"
                      sizes="(max-width: 640px) 35vw, 140px"
                    />
                    <div className="campus-school-text">
                      <div className="campus-school-name">{school.name}</div>
                      <div className="campus-school-location">{school.location ?? ''}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
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
            <AuthAwareCta
              unauthHref="/auth/signup"
              unauthLabel="Reserve Your Spot"
              authHref="/booking/configure"
              authLabel="Start Your Booking"
            />
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
              initial={{ opacity: 1, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: 0.05, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Image
                src="/brand/schedule-pickup.png"
                alt="Schedule Pickup"
                width={240}
                height={240}
                className="step-image-placeholder"
                sizes="(max-width: 768px) 85vw, 240px"
              />
              <div className="step-number">1</div>
              <h3 className="step-title">Schedule Pickup</h3>
              <p className="step-description">Book a convenient time for us to collect your items. We come to you with all necessary packing materials.</p>
            </motion.div>
            
            <motion.div 
              className="step"
              initial={{ opacity: 1, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Image
                src="/brand/secure-storage.png"
                alt="Secure Storage"
                width={240}
                height={240}
                className="step-image-placeholder"
                sizes="(max-width: 768px) 85vw, 240px"
              />
              <div className="step-number">2</div>
              <h3 className="step-title">Secure Storage</h3>
              <p className="step-description">Your belongings are safely stored in our climate-controlled facility with 24/7 security and monitoring.</p>
            </motion.div>
            
            <motion.div 
              className="step"
              initial={{ opacity: 1, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Image
                src="/brand/easy-redelivery.png"
                alt="Schedule move-in"
                width={240}
                height={240}
                className="step-image-placeholder"
                sizes="(max-width: 768px) 85vw, 240px"
              />
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
            <AuthAwareCta
              unauthHref="/auth/signup"
              unauthLabel="Get Started Today"
              authHref="/booking/configure"
              authLabel="Book Your Pickup"
            />
          </motion.div>
        </div>
      </section>

      {/* Storage Box Showcase */}
      <BoxShowcaseSection />

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
              initial={{ opacity: 1, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.12 }}
              transition={{ duration: 0.55, delay: 0.05, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Image
                src="/brand/box.png"
                alt=""
                width={1100}
                height={400}
                className="box-img"
                priority
                sizes="(max-width: 768px) 120vw, min(1320px, 95vw)"
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
              <AuthAwareCta
                unauthHref="/auth/signup?redirect=/deposit"
                unauthLabel="Select"
                authHref="/deposit"
                authLabel="Select"
              />
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
              <AuthAwareCta
                unauthHref="/auth/signup?redirect=/deposit"
                unauthLabel="Select"
                authHref="/deposit"
                authLabel="Select"
              />
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
              <AuthAwareCta
                unauthHref="/auth/signup?redirect=/deposit"
                unauthLabel="Select"
                authHref="/deposit"
                authLabel="Select"
              />
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
                  <p className="pricing-subsection-subtitle">Store items that don&apos;t fit in boxes — furniture, sports equipment, and more</p>
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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <div className="item-pricing-card">
                    <div className="item-icon">📦</div>
                    <h4 className="item-name">Small Item</h4>
                    <p className="item-examples">{ADDON_TIER_HOMEPAGE_TEASER.small}</p>
                    <div className="item-prices">
                      <div className="item-price-row">
                        <span className="item-option">With box</span>
                        <span className="item-cost">${ADDON_PRICE_USD_MONTH.smallWithBox}/month</span>
                      </div>
                      <div className="item-price-row">
                        <span className="item-option">Without box</span>
                        <span className="item-cost">${ADDON_PRICE_USD_MONTH.smallWithoutBox}/month</span>
                      </div>
                    </div>
                  </div>

                  <div className="item-pricing-card">
                    <div className="item-icon">📺</div>
                    <h4 className="item-name">Medium Item</h4>
                    <p className="item-examples">{ADDON_TIER_HOMEPAGE_TEASER.medium}</p>
                    <div className="item-prices">
                      <div className="item-price-row">
                        <span className="item-option">With box</span>
                        <span className="item-cost">${ADDON_PRICE_USD_MONTH.mediumWithBox}/month</span>
                      </div>
                      <div className="item-price-row">
                        <span className="item-option">Without box</span>
                        <span className="item-cost">${ADDON_PRICE_USD_MONTH.mediumWithoutBox}/month</span>
                      </div>
                    </div>
                  </div>

                  <div className="item-pricing-card">
                    <div className="item-icon">🛋️</div>
                    <h4 className="item-name">Large Item</h4>
                    <p className="item-examples">{ADDON_TIER_HOMEPAGE_TEASER.large}</p>
                    <div className="item-prices">
                      <div className="item-price-row single">
                        <span className="item-option">Any large item</span>
                        <span className="item-cost">${ADDON_PRICE_USD_MONTH.large}/month</span>
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
                <Image src="/brand/notime-storage-logo.png" alt="NoTime Storage" width={36} height={36} className="cv2-logo" sizes="36px" />
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
            <AuthAwareCta
              unauthHref="/auth/signup"
              unauthLabel="Choose NoTime Storage"
              authHref="/booking/configure"
              authLabel="Book Your Storage"
            />
          </motion.div>
        </div>
      </section>

      {/* Testimonials — plain section: Framer on .reviews-scroll-row breaks its translateX(-50%) centering vs CSS keyframe transform */}
      <section className="testimonials-section">
        <div className="testimonials-container">
          <h2 className="testimonials-title">
            Student Reviews
            <span className="testimonials-title-accent" />
          </h2>
          <p className="testimonials-subtitle">
            Here&apos;s what students have to say about NoTime Storage
          </p>

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
          <div className="section-cta">
            <AuthAwareCta
              unauthHref="/auth/signup"
              unauthLabel="Join Happy Students"
              authHref="/booking/configure"
              authLabel="Book Storage Now"
            />
          </div>
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
            {FAQ_ITEMS.map((item, i) => (
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
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
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
          <motion.h2
            className="reminder-cta-title"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          >
            Get Reminders for Next Semester
          </motion.h2>
          <motion.p
            className="reminder-cta-subtitle"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.48, delay: 0.06, ease: [0.25, 0.1, 0.25, 1] }}
          >
            Get notified when storage booking opens for your campus
          </motion.p>
          
          <motion.form
            className="reminder-form"
            onSubmit={handleReminderSubmit}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.12, ease: [0.25, 0.1, 0.25, 1] }}
          >
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
          </motion.form>

          {reminderSuccess && (
            <p className="reminder-note reminder-success">
              You&apos;re on the list. We&apos;ll email you when storage booking opens.
            </p>
          )}
          {reminderError && (
            <p className="reminder-note reminder-error" role="alert">
              {reminderError}
            </p>
          )}
          {!reminderSuccess && !reminderError && (
            <p className="reminder-note">We&apos;ll notify you when the next season opens.</p>
          )}
        </div>
      </section>

      {/* Footer Section */}
      <footer className="footer">
        <div className="footer-container">
          {/* Footer CTA */}
          <div className="footer-cta-section">
            <p className="footer-cta-text">Ready to store your things? Get started in minutes.</p>
            <AuthAwareCta
              unauthHref="/auth/signup"
              unauthLabel="Get Started"
              authHref="/booking/configure"
              authLabel="Book Storage Now"
            />
          </div>

          <div className="footer-content">
            {/* Brand Column */}
            <div className="footer-column footer-brand">
              <Link href="/admin" aria-label="NoTime Storage admin sign-in">
                <Image
                  src="/brand/notime-storage-logo.png"
                  alt="NoTime Storage Logo"
                  width={150}
                  height={150}
                  className="footer-logo-image"
                  loading="lazy"
                  sizes="(max-width: 768px) 120px, 150px"
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
                <li><Link href="/#pricing">Pricing</Link></li>
                <li><Link href="/#how-it-works">How It Works</Link></li>
                <li><Link href="/#box-specifications">Storage Options</Link></li>
                <li><Link href="/#how-it-works">Pickup & Delivery</Link></li>
              </ul>
            </div>

            {/* Company Column */}
            <div className="footer-column">
              <h4 className="footer-heading">Company</h4>
              <ul className="footer-links">
                <li><Link href="/#faq">FAQ</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>

            {/* Contact Column */}
            <div className="footer-column">
              <h4 className="footer-heading">Contact</h4>
              <ul className="footer-contact">
                <li><a href={`mailto:${SITE_CONTACT_EMAIL}`}>{SITE_CONTACT_EMAIL}</a></li>
                <li>Mon-Fri: 8am - 8pm</li>
                <li>Sat-Sun: 9am - 6pm</li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="footer-bottom">
            <p className="footer-copyright">© 2026 NoTime Storage. All rights reserved.</p>
            <p className="footer-attribution">
              powered by{' '}
              <a
                href="https://drivn-ai-website.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
              >
                drivn.ai
              </a>
            </p>
            <div className="footer-legal">
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
