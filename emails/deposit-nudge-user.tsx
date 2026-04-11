import { Section, Text, Button } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, emailStyles } from './components/EmailLayout';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';

interface DepositNudgeUserEmailProps {
  customerName: string;
  depositUrl: string;
  depositAmount?: number;
  /** True when link is a Supabase magic link (no password needed on this device). */
  useOneClick?: boolean;
}

export function DepositNudgeUserEmail({
  customerName = 'there',
  depositUrl,
  depositAmount = 50,
  useOneClick = false,
}: DepositNudgeUserEmailProps) {
  return (
    <EmailLayout preview={`Complete your $${depositAmount} deposit to reserve NoTime Storage`}>
      <Section style={{ padding: '36px 40px 8px' }}>
        <Text style={emailStyles.greeting}>Finish setting up your storage 📦</Text>
        <Text style={emailStyles.paragraph}>Hi {customerName},</Text>
        <Text style={emailStyles.paragraph}>
          You created a NoTime Storage account, but we don&apos;t see your <strong>${depositAmount} deposit</strong> yet.
          Paying the deposit secures your spot and unlocks booking — you choose boxes and schedule move-out right after.
        </Text>
        {useOneClick && (
          <Text style={{ ...emailStyles.paragraph, fontSize: '14px', color: '#6B5A52' }}>
            Use the button below to sign in automatically, then you&apos;ll go straight to pay your deposit.
          </Text>
        )}
        <Text style={emailStyles.paragraph}>
          It only takes a minute. If you have questions, reply to this email or write us at{' '}
          <a href={`mailto:${SITE_CONTACT_EMAIL}`} style={{ color: '#C9A47E', fontWeight: 600 }}>
            {SITE_CONTACT_EMAIL}
          </a>
          .
        </Text>
      </Section>

      <Section style={{ padding: '8px 40px 32px', textAlign: 'center' }}>
        <Button href={depositUrl} style={emailStyles.button}>
          {useOneClick ? 'Sign in & continue to deposit →' : 'Sign in & pay deposit →'}
        </Button>
      </Section>
    </EmailLayout>
  );
}
