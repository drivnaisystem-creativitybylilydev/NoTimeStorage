import {
  Section,
  Text,
  Link,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { EmailLayout, emailStyles, colors } from './components/EmailLayout';

interface OrderConfirmedUserEmailProps {
  customerName: string;
  bookingId: string;
  school: string;
  dorm: string;
  moveOutDate: string;
  moveOutTime: string;
  moveInDate: string;
  boxQuantity: number;
  monthlyTotal: number;
  additionalItems?: string;
}

export function OrderConfirmedUserEmail({
  customerName = 'there',
  bookingId = '',
  school = 'Stonehill College',
  dorm = '',
  moveOutDate = '',
  moveOutTime = '',
  moveInDate = '',
  boxQuantity = 1,
  monthlyTotal = 80,
  additionalItems = '',
}: OrderConfirmedUserEmailProps) {
  return (
    <EmailLayout preview="Your storage booking is confirmed — we'll take it from here!">
      <Section style={emailStyles.body_section}>
        {/* Badge */}
        <div style={{ marginBottom: '20px' }}>
          <span style={emailStyles.badge}>📦 Booking Confirmed</span>
        </div>

        <Text style={emailStyles.greeting}>Booking confirmed, {customerName}!</Text>

        <Text style={emailStyles.paragraph}>
          Your NoTime Storage booking has been received and is being processed. We&apos;ll be in
          touch closer to your move-out date with pickup details.
        </Text>

        {/* Booking details card */}
        <div style={emailStyles.card}>
          <Text style={{
            color: colors.coffee,
            fontSize: '13px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            margin: '0 0 12px',
          }}>
            Booking Summary
          </Text>
          <table width="100%" cellPadding="0" cellSpacing="0">
            <tbody>
              <tr>
                <td style={{ ...emailStyles.cardLabel, paddingBottom: '8px' }}>Booking ID</td>
                <td style={{ ...emailStyles.cardValue, paddingBottom: '8px', fontFamily: 'monospace', fontSize: '12px' }}>
                  {bookingId.slice(0, 8).toUpperCase()}
                </td>
              </tr>
              <tr>
                <td style={{ ...emailStyles.cardLabel, paddingBottom: '8px' }}>School</td>
                <td style={{ ...emailStyles.cardValue, paddingBottom: '8px' }}>{school}</td>
              </tr>
              <tr>
                <td style={{ ...emailStyles.cardLabel, paddingBottom: '8px' }}>Dorm / Location</td>
                <td style={{ ...emailStyles.cardValue, paddingBottom: '8px' }}>{dorm}</td>
              </tr>
              <tr>
                <td style={{ ...emailStyles.cardLabel, paddingBottom: '8px' }}>Move-out date</td>
                <td style={{ ...emailStyles.cardValue, paddingBottom: '8px' }}>{moveOutDate}</td>
              </tr>
              <tr>
                <td style={{ ...emailStyles.cardLabel, paddingBottom: '8px' }}>Pickup time</td>
                <td style={{ ...emailStyles.cardValue, paddingBottom: '8px' }}>{moveOutTime}</td>
              </tr>
              <tr>
                <td style={{ ...emailStyles.cardLabel, paddingBottom: '8px' }}>Move-in date</td>
                <td style={{ ...emailStyles.cardValue, paddingBottom: '8px' }}>{moveInDate}</td>
              </tr>
              <tr>
                <td style={{ ...emailStyles.cardLabel, paddingBottom: '8px' }}>Boxes</td>
                <td style={{ ...emailStyles.cardValue, paddingBottom: '8px' }}>{boxQuantity} box{boxQuantity > 1 ? 'es' : ''}</td>
              </tr>
              {additionalItems && (
                <tr>
                  <td style={{ ...emailStyles.cardLabel, paddingBottom: '8px' }}>Additional items</td>
                  <td style={{ ...emailStyles.cardValue, paddingBottom: '8px' }}>{additionalItems}</td>
                </tr>
              )}
              <tr>
                <td colSpan={2}>
                  <Hr style={{ borderColor: colors.cream, margin: '8px 0' }} />
                </td>
              </tr>
              <tr>
                <td style={{ ...emailStyles.cardLabel, fontWeight: '700', color: colors.coffee }}>Monthly total</td>
                <td style={{ ...emailStyles.cardValue, fontSize: '16px', color: colors.coffee }}>${monthlyTotal}/mo</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* What happens next */}
        <div style={{
          backgroundColor: '#FFF8F0',
          borderRadius: '10px',
          padding: '18px 24px',
          margin: '20px 0',
          borderLeft: `4px solid ${colors.latte}`,
        }}>
          <Text style={{ color: colors.coffee, fontSize: '13px', fontWeight: '700', margin: '0 0 8px' }}>
            What happens next?
          </Text>
          <Text style={{ color: '#4A3A34', fontSize: '13px', margin: '0 0 4px', lineHeight: '1.6' }}>
            1. Our team reviews your booking and confirms the pickup window
          </Text>
          <Text style={{ color: '#4A3A34', fontSize: '13px', margin: '0 0 4px', lineHeight: '1.6' }}>
            2. We arrive at your dorm on your move-out date and collect your items
          </Text>
          <Text style={{ color: '#4A3A34', fontSize: '13px', margin: '0', lineHeight: '1.6' }}>
            3. Request delivery anytime from your dashboard when you&apos;re ready
          </Text>
        </div>

        {/* CTA */}
        <div style={emailStyles.buttonWrap}>
          <Link href="https://notimestorage.co/dashboard" style={emailStyles.button}>
            View My Booking →
          </Link>
        </div>

        <Hr style={emailStyles.divider} />

        <Text style={{ ...emailStyles.paragraph, fontSize: '13px', color: colors.muted }}>
          Need to make changes? Visit your dashboard or contact us at support@notimestorage.co
          before your move-out date.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default OrderConfirmedUserEmail;
