'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { SiteHeader } from '@/app/components/SiteHeader';
import { submitContactForm } from '@/lib/contact/submit';

const CONTACT_SUBJECT_OPTIONS = [
  'Booking & scheduling',
  'Pricing & payment',
  'Technical support',
  'Partnership / Campus',
  'Billing or refund',
  'Other',
] as const;

export default function ContactPage() {
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactSubjectOther, setContactSubjectOther] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

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

  return (
    <div>
      <SiteHeader />

      <section className="contact-section contact-page-section contact-page-with-bg">
        <div className="contact-bg-layer" aria-hidden="true" />
        <div className="contact-container contact-content-layer">
          <motion.div
            className="contact-form-wrapper"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="contact-form-header">
              <Link href="/" style={{ display: 'block', marginBottom: '16px' }}>
                <Image
                  src="/brand/notime-storage-logo.png"
                  alt="NoTime Storage"
                  width={72}
                  height={72}
                />
              </Link>
              <motion.h1
                className="contact-title"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              >
                Get in Touch
              </motion.h1>
              <motion.p
                className="contact-subtitle"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08, ease: [0.25, 0.1, 0.25, 1] }}
              >
                Have a question or concern? We&apos;re here to help.
              </motion.p>
            </div>

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
                <AnimatePresence>
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
                </AnimatePresence>
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

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Link href="/" style={{ color: 'var(--color-gray-600)', fontSize: '0.9375rem', textDecoration: 'underline' }}>
              ← Back to homepage
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
