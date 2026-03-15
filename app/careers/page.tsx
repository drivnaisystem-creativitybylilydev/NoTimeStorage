import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/app/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Careers — NoTime Storage',
  description: 'Join the NoTime Storage team. We\'re building the future of student storage.',
};

export default function CareersPage() {
  return (
    <div>
      <SiteHeader />
      <main className="legal-page">
        <div className="legal-container legal-careers">
          <h1>Careers at NoTime Storage</h1>
          <p className="legal-updated">We&apos;re growing — and we&apos;d love to hear from you.</p>

          <section>
            <p>
              NoTime Storage is building the go-to storage solution for students. We&apos;re always looking for passionate people who want to make move-out and move-in stress-free.
            </p>
            <p>
              <strong>No open positions at the moment?</strong> We still want to connect. Send us your resume and a note about why you&apos;re interested — we keep applications on file for future openings.
            </p>
          </section>

          <section>
            <h2>Get in Touch</h2>
            <p>
              Email us at{' '}
              <a href="mailto:notimestorage@gmail.com?subject=Careers%20Inquiry">notimestorage@gmail.com</a>
              {' '}with the subject &quot;Careers Inquiry&quot; or use our{' '}
              <Link href="/contact">contact form</Link>.
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
