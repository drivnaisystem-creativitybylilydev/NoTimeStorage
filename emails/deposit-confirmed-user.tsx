import {
  Section,
  Text,
  Link,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { EmailLayout, emailStyles, colors } from './components/EmailLayout';

interface DepositConfirmedUserEmailProps {
  customerName: string;
  depositAmount?: number;
}

export function DepositConfirmedUserEmail({
  customerName = 'there',
  depositAmount = 50,
}: DepositConfirmedUserEmailProps) {
  return (
    <EmailLayout preview={`Your $${depositAmount} deposit is confirmed — you're ready to book!`}>
      <Section style={emailStyles.body_section}>
        {/* Badge */}
        <div style={{ marginBottom: '20px' }}>
          <span style={emailStyles.badge}>✓ Deposit Confirmed</span>
        </div>

        <Text style={emailStyles.greeting}>You&apos;re all set, {customerName}!</Text>

        <Text style={emailStyles.paragraph}>
          Your <strong>${depositAmount} deposit</strong> has been received. This deposit will be
          applied toward your total storage cost — you won&apos;t be charged twice.
        </Text>

        <Text style={emailStyles.paragraph}>
          You can now choose your boxes and schedule your move-out date. Head to your dashboard to
          complete your booking.
        </Text>

        {/* Summary card */}
        <div style={emailStyles.card}>
          <table width="100%" cellPadding="0" cellSpacing="0">
            <tbody>
              <tr>
                <td style={emailStyles.cardLabel}>Deposit paid</td>
                <td style={emailStyles.cardValue}>${depositAmount}.00</td>
              </tr>
              <tr>
                <td style={emailStyles.cardLabel}>Applied to</td>
                <td style={emailStyles.cardValue}>Your storage total</td>
              </tr>
              <tr>
                <td style={emailStyles.cardLabel}>Status</td>
                <td style={{ ...emailStyles.cardValue, color: '#16A34A' }}>✓ Confirmed</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* CTA */}
        <div style={emailStyles.buttonWrap}>
          <Link href="https://notimestorage.co/booking/configure" style={emailStyles.button}>
            Book Your Storage Now →
          </Link>
        </div>

        <Hr style={emailStyles.divider} />

        <Text style={{ ...emailStyles.paragraph, fontSize: '13px', color: colors.muted }}>
          Your deposit will be deducted from your final storage total. If you have any questions,
          reply to this email or contact us at support@notimestorage.co.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default DepositConfirmedUserEmail;
