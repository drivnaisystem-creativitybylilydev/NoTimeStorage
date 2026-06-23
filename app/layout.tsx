import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AppModalProvider } from "./components/AppModalProvider";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const BASE = 'https://notimestorage.co';

export const metadata: Metadata = {
  title: {
    default: "NoTime Storage — College & Student Storage | Door-to-Door Pickup & Delivery",
    template: "%s | NoTime Storage",
  },
  description: "College storage made simple. Door-to-door pickup from your dorm, climate-controlled summer storage, and delivery back to your room. Serving Stonehill, UNH, UMass, and 9 more campuses.",
  keywords: ["college storage", "student storage", "dorm storage", "summer storage", "campus storage", "move-out storage", "college move out", "student move in", "NoTime Storage"],
  authors: [{ name: "NoTime Storage", url: BASE }],
  creator: "NoTime Storage",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE,
    siteName: "NoTime Storage",
    title: "NoTime Storage — College & Student Storage | Door-to-Door",
    description: "Stress-free storage for college students. We pick up from your dorm and deliver back when you need it. Serving 12 campuses.",
    images: [{ url: `${BASE}/brand/notime-storage-logo.png`, width: 512, height: 512, alt: "NoTime Storage" }],
  },
  twitter: {
    card: "summary",
    title: "NoTime Storage — College & Student Storage",
    description: "Door-to-door pickup and delivery for college students. Book your summer storage today.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/brand/notime-storage-logo.png",
  },
  metadataBase: new URL(BASE),
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'NoTime Storage',
  url: BASE,
  logo: `${BASE}/brand/notime-storage-logo.png`,
  description: 'College storage made simple. Door-to-door pickup from your dorm, climate-controlled summer storage, and delivery back to your room. Serving 12 campuses.',
  areaServed: [
    'Stonehill College',
    'University of New Haven',
    'University of Dayton',
    'University of Massachusetts',
    'Brevard College',
    'Gordon College',
    'Central Connecticut State University',
    'Sacred Heart University',
    'Towson University',
    'University of Notre Dame',
    'James Madison University',
    'Bridgewater State University',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${montserrat.variable} ${inter.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <AppModalProvider>
          {children}
        </AppModalProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
