import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/app/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Terms of Service — NoTime Storage',
  description: 'NoTime Storage Terms of Service. Read the terms and conditions for using our student storage services.',
};

export default function TermsOfServicePage() {
  return (
    <div>
      <SiteHeader />
      <main className="legal-page">
        <div className="legal-container">
          <h1>Terms of Service</h1>
          <p className="legal-updated">Last updated: January 2026</p>

          <section>
            <h2>1. Agreement to Terms</h2>
            <p>
              By accessing or using NoTime Storage (&quot;Service&quot;) operated by NoTime Storage (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2>2. Description of Service</h2>
            <p>
              NoTime Storage provides student storage solutions, including storage boxes, pickup, climate-controlled storage, and redelivery. Services are subject to availability and may vary by school and location.
            </p>
          </section>

          <section>
            <h2>3. Eligibility</h2>
            <p>
              You must be at least 18 years old and capable of forming a binding contract to use our Service. By using the Service, you represent that you meet these requirements.
            </p>
          </section>

          <section>
            <h2>4. Account and Registration</h2>
            <p>
              You must create an account and provide accurate, complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.
            </p>
          </section>

          <section>
            <h2>5. Bookings and Payments</h2>
            <ul>
              <li><strong>Deposit:</strong> A non-refundable commitment fee (currently $50) is required before booking. This amount is applied to your total storage cost.</li>
              <li><strong>Payment:</strong> You agree to pay all fees for storage, pickup, and delivery as displayed at checkout. Payment is due as specified (full payment or monthly installments).</li>
              <li><strong>Cancellation:</strong> Cancellation terms are disclosed at booking. The deposit is non-refundable once a pickup is scheduled. Remaining balances may be refunded per our cancellation policy.</li>
              <li><strong>Price changes:</strong> Prices are as displayed at the time of booking. We reserve the right to change prices for future bookings.</li>
            </ul>
          </section>

          <section>
            <h2>6. Prohibited Items</h2>
            <p>
              You may not store hazardous, illegal, perishable, or prohibited items. We reserve the right to refuse or dispose of such items. A list of prohibited items is provided during booking.
            </p>
          </section>

          <section>
            <h2>7. Storage and Care</h2>
            <p>
              We provide climate-controlled storage and take reasonable care of your items. We are not liable for damage due to normal wear, items improperly packed, or circumstances beyond our control. Insurance options may be available.
            </p>
          </section>

          <section>
            <h2>8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, our liability for any claim arising from the Service is limited to the amount you paid for the specific booking in question. We are not liable for indirect, incidental, special, or consequential damages.
            </p>
          </section>

          <section>
            <h2>9. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless NoTime Storage, its officers, directors, employees, and agents from any claims, damages, or expenses arising from your use of the Service or violation of these Terms.
            </p>
          </section>

          <section>
            <h2>10. Modifications</h2>
            <p>
              We may modify these Terms at any time. Continued use of the Service after changes constitutes acceptance. Material changes will be communicated via email or a notice on the Service.
            </p>
          </section>

          <section>
            <h2>11. Termination</h2>
            <p>
              We may suspend or terminate your account and access to the Service at our discretion, including for violation of these Terms. You may close your account at any time by contacting us.
            </p>
          </section>

          <section>
            <h2>12. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the United States and the state in which we operate, without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2>13. Contact</h2>
            <p>
              For questions about these Terms, contact us at{' '}
              <a href="mailto:notimestorage@gmail.com">notimestorage@gmail.com</a>.
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
