import {
  Section,
  Text,
  Link,
  Hr,
  Button,
} from '@react-email/components';
import * as React from 'react';
import { EmailLayout, emailStyles, colors } from './components/EmailLayout';

interface MoveInReminderUserEmailProps {
  customerName: string;
  moveInDate: string;
  school: string;
  currentDorm?: string;
  dashboardUrl?: string;
}

const fmt = (iso: string) => {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });
  } catch { return iso; }
};

export function MoveInReminderUserEmail({
  customerName = 'there',
  moveInDate = '',
  school = 'your school',
  currentDorm,
  dashboardUrl = 'https://notimestorage.co/dashboard',
}: MoveInReminderUserEmailProps) {
  return (
    <EmailLayout preview={`Your NoTime Storage delivery is on ${fmt(moveInDate)} — confirm your dorm`}>

      <Section style={{ padding: '36px 40px 8px' }}>
        <Text style={emailStyles.greeting}>Your Storage Delivery is Coming Up 📦</Text>
        <Text style={emailStyles.paragraph}>Hi {customerName},</Text>
        <Text style={emailStyles.paragraph}>
          Your NoTime Storage delivery is scheduled for <strong>{fmt(moveInDate)}</strong> at {school}.
          Since you may have moved to a different dorm, please take 30 seconds to confirm where we should deliver your items.
        </Text>
      </Section>

      <Section style={{ padding: '8px 40px 24px', textAlign: 'center' }}>
        <Button href={dashboardUrl} style={emailStyles.button}>
          Confirm My Delivery Dorm →
        </Button>
      </Section>

      <Hr style={emailStyles.divider} />

      <Section style={{ padding: '0 40px 28px' }}>
        <Text style={{ ...emailStyles.paragraph, fontWeight: '700', marginBottom: '16px' }}>
          What to do:
        </Text>
        {[
          'Click the button above to go to your dashboard',
          'Find the "Confirm Your Move-In Delivery" card',
          'Enter your new dorm, room number, and any instructions',
          "Hit Save — we'll be in touch before delivery day",
        ].map((text, i) => (
          <Text key={i} style={{ ...emailStyles.paragraph, marginBottom: '10px' }}>
            <span style={{
              display: 'inline-block',
              background: colors.coffee,
              color: '#fff',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              lineHeight: '20px',
              textAlign: 'center',
              fontSize: '12px',
              fontWeight: '700',
              marginRight: '10px',
            }}>
              {i + 1}
            </span>
            {text}
          </Text>
        ))}
      </Section>

      {currentDorm && (
        <>
          <Hr style={emailStyles.divider} />
          <Section style={{ padding: '0 40px 24px' }}>
            <Text style={{ ...emailStyles.paragraph, color: colors.muted, fontSize: '13px' }}>
              Your move-out dorm on file was <strong>{currentDorm}</strong>. If your delivery dorm is the same, still confirm it so we know you're all set.
            </Text>
          </Section>
        </>
      )}

    </EmailLayout>
  );
}

export default MoveInReminderUserEmail;
