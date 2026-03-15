import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact — NoTime Storage',
  description: 'Get in touch with NoTime Storage. Questions about student storage, booking, or pricing? We\'re here to help.',
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
