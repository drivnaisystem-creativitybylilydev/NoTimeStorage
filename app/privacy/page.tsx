import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';
import { SiteHeader } from '@/app/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Privacy Policy — NoTime Storage',
  description: 'NoTime Storage Privacy Policy. Learn how we collect, use, and protect your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div>
      <SiteHeader />
      <main className="legal-page">
        <div className="legal-container">
          <h1>Privacy Policy</h1>
          <p className="legal-updated">Last updated: January 2026</p>

          <section>
            <h2>1. Introduction</h2>
            <p>
              NoTime Storage (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates notimestorage.co (the &quot;Service&quot;). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our student storage and logistics services.
            </p>
          </section>

          <section>
            <h2>2. Information We Collect</h2>
            <p>We collect information that you provide directly to us, including:</p>
            <ul>
              <li><strong>Account information:</strong> Name, email address, phone number, and school affiliation when you create an account or book storage.</li>
              <li><strong>Booking information:</strong> Storage dates, dorm/address details, pickup and delivery preferences, and payment information.</li>
              <li><strong>Communications:</strong> Messages you send us via contact forms, email, or support channels.</li>
              <li><strong>Payment data:</strong> Payments may be completed through Venmo (PayPal). We do not collect or store full card numbers on our servers.</li>
            </ul>
          </section>

          <section>
            <h2>3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Provide, operate, and improve our storage and pickup/delivery services</li>
              <li>Process bookings, payments, and refunds</li>
              <li>Communicate with you about your bookings, account, and our services</li>
              <li>Send transactional emails (confirmations, reminders, receipts)</li>
              <li>Respond to inquiries and provide customer support</li>
              <li>Comply with legal obligations and enforce our Terms of Service</li>
            </ul>
          </section>

          <section>
            <h2>4. Information Sharing</h2>
            <p>
              We do not sell your personal information. We may share your information with:
            </p>
            <ul>
              <li><strong>Service providers:</strong> Payment and communications providers (for example Venmo / PayPal, email delivery, and hosting) necessary to operate our Service.</li>
              <li><strong>Logistics partners:</strong> To coordinate pickup and delivery of your items.</li>
              <li><strong>Legal requirements:</strong> When required by law, court order, or to protect our rights and safety.</li>
            </ul>
          </section>

          <section>
            <h2>5. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your personal information. Payments you send through Venmo or similar services are subject to that provider&apos;s terms and security practices. We cannot guarantee absolute security of data transmitted over the internet.
            </p>
          </section>

          <section>
            <h2>6. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed to provide services, comply with legal obligations, resolve disputes, and enforce our agreements.
            </p>
          </section>

          <section>
            <h2>7. Your Rights</h2>
            <p>
              Depending on your location, you may have the right to access, correct, delete, or restrict processing of your personal data. To exercise these rights, contact us at {SITE_CONTACT_EMAIL}.
            </p>
          </section>

          <section>
            <h2>8. Cookies and Tracking</h2>
            <p>
              We use essential cookies and similar technologies to operate our Service, maintain sessions, and improve user experience. We do not use third-party advertising cookies.
            </p>
          </section>

          <section>
            <h2>9. Children</h2>
            <p>
              Our Service is intended for students and adults. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us immediately.
            </p>
          </section>

          <section>
            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2>11. Contact Us</h2>
            <p>
              For questions about this Privacy Policy or our data practices, contact us at{' '}
              <a href={`mailto:${SITE_CONTACT_EMAIL}`}>{SITE_CONTACT_EMAIL}</a>.
            </p>
          </section>

          <p style={{ marginTop: '2rem' }}>
            <Link href="/" className="legal-back">← Back to homepage</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
