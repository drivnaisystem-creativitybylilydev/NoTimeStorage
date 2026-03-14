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
  paymentPlan?: 'full' | 'monthly';
  totalPrice?: number;
  month1Amount?: number;
  month2Amount?: number;
  month2Date?: string;
  month3Amount?: number;
  month3Date?: string;
}

const fmtScheduleDate = (iso: string) => {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
};

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
  paymentPlan = 'full',
  totalPrice,
  month1Amount,
  month2Amount,
  month2Date,
  month3Amount,
  month3Date,
}: OrderConfirmedUserEmailProps) {
  const isMonthly = paymentPlan === 'monthly' && !!month1Amount;

  return (
    <EmailLayout preview={isMonthly ? "Your booking is confirmed and payment plan is set!" : "Your storage booking is confirmed — we'll take it from here!"}>
      <Section style={emailStyles.body_section}>
        {/* Badge */}
        <div style={{ marginBottom: '20px' }}>
          <span style={emailStyles.badge}>
            {isMonthly ? '📅 Monthly Plan Confirmed' : '📦 Booking Confirmed'}
          </span>
        </div>

        <Text style={emailStyles.greeting}>
          {isMonthly ? `First payment received, ${customerName}!` : `Booking confirmed, ${customerName}!`}
        </Text>

        <Text style={emailStyles.paragraph}>
          {isMonthly
            ? `Your NoTime Storage booking is confirmed and your 3-month payment plan is active. Your first payment of $${(month1Amount / 100).toFixed(2)} has been processed. Remaining payments will be automatically charged on the dates below — no action needed.`
            : `Your NoTime Storage booking has been received and is being processed. We'll be in touch closer to your move-out date with pickup details.`
          }
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
                <td style={{ ...emailStyles.cardLabel, fontWeight: '700', color: colors.coffee }}>Monthly rate</td>
                <td style={{ ...emailStyles.cardValue, fontSize: '14px', color: colors.coffee }}>${monthlyTotal}/mo</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment schedule card — monthly plan only */}
        {isMonthly && month1Amount && month2Amount && month3Amount && month2Date && month3Date && (
          <div style={{
            ...emailStyles.card,
            borderLeft: `4px solid ${colors.latte}`,
          }}>
            <Text style={{
              color: colors.coffee,
              fontSize: '13px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              margin: '0 0 14px',
            }}>
              💳 Your Payment Schedule
            </Text>
            <table width="100%" cellPadding="0" cellSpacing="0">
              <tbody>
                {/* Month 1 */}
                <tr>
                  <td style={{ paddingBottom: '10px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: colors.coffee }}>Month 1 — Today</div>
                    <div style={{ fontSize: '12px', color: '#2e7d32', marginTop: '2px' }}>$50 deposit credit applied</div>
                  </td>
                  <td style={{ textAlign: 'right', paddingBottom: '10px', verticalAlign: 'top' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#2e7d32' }}>✓ Paid</span>
                    {'  '}
                    <span style={{ fontSize: '14px', fontWeight: '700', color: colors.coffee }}>${(month1Amount / 100).toFixed(2)}</span>
                  </td>
                </tr>
                <tr>
                  <td colSpan={2}><Hr style={{ borderColor: colors.cream, margin: '2px 0 10px' }} /></td>
                </tr>
                {/* Month 2 */}
                <tr>
                  <td style={{ paddingBottom: '10px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: colors.coffee }}>Month 2</div>
                    <div style={{ fontSize: '12px', color: colors.muted, marginTop: '2px' }}>{fmtScheduleDate(month2Date)} · auto-charged</div>
                  </td>
                  <td style={{ textAlign: 'right', paddingBottom: '10px', verticalAlign: 'top' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: colors.coffee }}>${(month2Amount / 100).toFixed(2)}</span>
                  </td>
                </tr>
                <tr>
                  <td colSpan={2}><Hr style={{ borderColor: colors.cream, margin: '2px 0 10px' }} /></td>
                </tr>
                {/* Month 3 */}
                <tr>
                  <td style={{ paddingBottom: '10px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: colors.coffee }}>Month 3</div>
                    <div style={{ fontSize: '12px', color: colors.muted, marginTop: '2px' }}>{fmtScheduleDate(month3Date)} · auto-charged</div>
                  </td>
                  <td style={{ textAlign: 'right', paddingBottom: '10px', verticalAlign: 'top' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: colors.coffee }}>${(month3Amount / 100).toFixed(2)}</span>
                  </td>
                </tr>
                {totalPrice && (
                  <>
                    <tr>
                      <td colSpan={2}><Hr style={{ borderColor: colors.latte, margin: '4px 0 10px' }} /></td>
                    </tr>
                    <tr>
                      <td style={{ fontSize: '13px', fontWeight: '700', color: colors.coffee }}>Total over 3 months</td>
                      <td style={{ textAlign: 'right', fontSize: '15px', fontWeight: '800', color: colors.coffee }}>${totalPrice.toFixed(2)}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
            <Text style={{ fontSize: '12px', color: colors.muted, margin: '12px 0 0', lineHeight: '1.6' }}>
              🔔 You&apos;ll receive a reminder email before each auto-charge. No action needed — your card on file will be charged automatically.
            </Text>
          </div>
        )}

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
