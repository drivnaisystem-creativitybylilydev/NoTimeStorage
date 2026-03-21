import { Section, Text, Link } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, emailStyles, colors } from './components/EmailLayout';

export type AuthVerifyEmailProps = {
  preview: string;
  title: string;
  body: string;
  ctaUrl?: string;
  ctaLabel?: string;
};

/**
 * Branded auth emails (signup confirm, password reset, magic link) — matches other NoTime Storage templates.
 */
export function AuthVerifyEmail({
  preview,
  title,
  body,
  ctaUrl,
  ctaLabel = 'Continue',
}: AuthVerifyEmailProps) {
  return (
    <EmailLayout preview={preview}>
      <Section style={emailStyles.body_section}>
        <Text style={emailStyles.greeting}>{title}</Text>
        <Text style={emailStyles.paragraph}>{body}</Text>
        {ctaUrl ? (
          <div style={emailStyles.buttonWrap}>
            <Link href={ctaUrl} style={emailStyles.button}>
              {ctaLabel}
            </Link>
          </div>
        ) : null}
        <Text style={{ ...emailStyles.paragraph, fontSize: '13px', color: colors.muted, marginTop: '8px' }}>
          If you didn&apos;t request this, you can ignore this email.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default AuthVerifyEmail;
