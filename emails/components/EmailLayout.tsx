import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Link,
} from '@react-email/components';
import * as React from 'react';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';
import { EMAIL_LOGO_URL, EMAIL_PUBLIC_BASE } from '@/lib/email/branding';

const colors = {
  coffee: '#4B2E25',
  latte: '#C9A47E',
  paper: '#F7F3EE',
  cream: '#EDE0D4',
  ink: '#0B0B0B',
  muted: '#6B5A52',
  white: '#FFFFFF',
  green: '#4ADE80',
  red: '#EF4444',
};

export const emailStyles = {
  body: {
    backgroundColor: '#F0E9E0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: '0',
    padding: '40px 0',
  } as React.CSSProperties,
  container: {
    maxWidth: '560px',
    margin: '0 auto',
    backgroundColor: colors.white,
    borderRadius: '16px',
    overflow: 'hidden' as const,
    boxShadow: '0 4px 24px rgba(75,46,37,0.10)',
  } as React.CSSProperties,
  header: {
    backgroundColor: colors.coffee,
    padding: '32px 40px',
    textAlign: 'center' as const,
  } as React.CSSProperties,
  logoText: {
    color: colors.white,
    fontSize: '18px',
    fontWeight: '700',
    letterSpacing: '0.3px',
    margin: '10px 0 0',
  } as React.CSSProperties,
  logoSub: {
    color: colors.latte,
    fontSize: '12px',
    margin: '2px 0 0',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
  } as React.CSSProperties,
  body_section: {
    padding: '40px 40px 32px',
  } as React.CSSProperties,
  greeting: {
    color: colors.coffee,
    fontSize: '22px',
    fontWeight: '700',
    margin: '0 0 8px',
  } as React.CSSProperties,
  paragraph: {
    color: '#4A3A34',
    fontSize: '15px',
    lineHeight: '1.7',
    margin: '0 0 16px',
  } as React.CSSProperties,
  button: {
    backgroundColor: colors.coffee,
    color: colors.white,
    borderRadius: '8px',
    padding: '14px 32px',
    fontSize: '15px',
    fontWeight: '600',
    textDecoration: 'none',
    display: 'inline-block',
    letterSpacing: '0.2px',
  } as React.CSSProperties,
  buttonWrap: {
    textAlign: 'center' as const,
    margin: '28px 0',
  } as React.CSSProperties,
  card: {
    backgroundColor: colors.paper,
    borderRadius: '10px',
    padding: '20px 24px',
    margin: '20px 0',
    border: `1px solid ${colors.cream}`,
  } as React.CSSProperties,
  cardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    margin: '6px 0',
  } as React.CSSProperties,
  cardLabel: {
    color: colors.muted,
    fontSize: '13px',
    fontWeight: '500',
  } as React.CSSProperties,
  cardValue: {
    color: colors.coffee,
    fontSize: '13px',
    fontWeight: '600',
    textAlign: 'right' as const,
  } as React.CSSProperties,
  divider: {
    borderColor: colors.cream,
    margin: '24px 0',
  } as React.CSSProperties,
  footer: {
    backgroundColor: colors.paper,
    padding: '24px 40px',
    textAlign: 'center' as const,
    borderTop: `1px solid ${colors.cream}`,
  } as React.CSSProperties,
  footerText: {
    color: colors.muted,
    fontSize: '12px',
    margin: '0 0 4px',
    lineHeight: '1.6',
  } as React.CSSProperties,
  footerLink: {
    color: colors.latte,
    textDecoration: 'none',
    fontWeight: '600',
  } as React.CSSProperties,
  badge: {
    display: 'inline-block',
    backgroundColor: '#D4F7E0',
    color: '#166534',
    borderRadius: '20px',
    padding: '4px 14px',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
  } as React.CSSProperties,
  adminBadge: {
    display: 'inline-block',
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    borderRadius: '20px',
    padding: '4px 14px',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
  } as React.CSSProperties,
};

interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          {/* Header */}
          <Section style={emailStyles.header}>
            <Img
              src={EMAIL_LOGO_URL}
              width="56"
              height="56"
              alt="NoTime Storage"
              style={{ borderRadius: '50%', display: 'block', margin: '0 auto' }}
            />
            <Text style={emailStyles.logoText}>NoTime Storage</Text>
            <Text style={emailStyles.logoSub}>Student Storage, Simplified</Text>
          </Section>

          {/* Content */}
          {children}

          {/* Footer */}
          <Section style={emailStyles.footer}>
            <Text style={emailStyles.footerText}>
              Questions? Email us at{' '}
              <Link href={`mailto:${SITE_CONTACT_EMAIL}`} style={emailStyles.footerLink}>
                {SITE_CONTACT_EMAIL}
              </Link>
            </Text>
            <Text style={emailStyles.footerText}>
              <Link href={EMAIL_PUBLIC_BASE} style={emailStyles.footerLink}>
                notimestorage.co
              </Link>
              {' · '}Student Storage for Stonehill College & University of New Haven
            </Text>
            <Text style={{ ...emailStyles.footerText, marginTop: '12px', fontSize: '11px', color: '#9E8E88' }}>
              © {new Date().getFullYear()} NoTime Storage. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export { colors };
