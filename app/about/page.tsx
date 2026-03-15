import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { SiteHeader } from '@/app/components/SiteHeader';

export const metadata: Metadata = {
  title: 'About Us — NoTime Storage',
  description: 'Learn about NoTime Storage — premium student storage solutions with pickup, delivery, and climate-controlled storage.',
};

export default function AboutPage() {
  return (
    <div>
      <SiteHeader />
      <main className="legal-page">
        <div className="legal-container legal-about">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Link href="/">
              <Image
                src="/brand/notime-storage-logo.png"
                alt="NoTime Storage"
                width={80}
                height={80}
              />
            </Link>
            <h1>About NoTime Storage</h1>
          </div>

          <section>
            <h2>Our Mission</h2>
            <p>
              NoTime Storage makes student storage simple. We provide premium storage boxes, free pickup and delivery, and climate-controlled storage — so you can focus on what matters instead of lugging your stuff around.
            </p>
          </section>

          <section>
            <h2>What We Offer</h2>
            <ul>
              <li>Large, durable storage boxes designed for dorm life</li>
              <li>Free pickup from your dorm and delivery when you return</li>
              <li>Climate-controlled, secure storage facilities</li>
              <li>Flexible plans — pay for 1, 2, or 4 boxes</li>
              <li>Optional additional items (lamps, mini fridges, etc.)</li>
            </ul>
          </section>

          <section>
            <h2>Built for Students</h2>
            <p>
              We understand the chaos of move-out and move-in. Our service is designed around your schedule, with easy online booking and transparent pricing. No hidden fees — just simple, reliable storage.
            </p>
          </section>

          <section>
            <h2>Get in Touch</h2>
            <p>
              Have questions? We&apos;d love to hear from you. <Link href="/contact">Contact us</Link> or email{' '}
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
