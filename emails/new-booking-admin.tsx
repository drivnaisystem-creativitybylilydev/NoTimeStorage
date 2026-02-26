import {
  Section,
  Text,
  Link,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { EmailLayout, emailStyles, colors } from './components/EmailLayout';

interface NewBookingAdminEmailProps {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  bookingId: string;
  school: string;
  dorm: string;
  moveOutDate: string;
  moveOutTime: string;
  moveInDate: string;
  boxQuantity: number;
  monthlyTotal: number;
  elevator: boolean;
  stairs: boolean;
  additionalItems?: string;
  specialInstructions?: string;
}

export function NewBookingAdminEmail({
  customerName = 'Unknown',
  customerEmail = '',
  customerPhone = '—',
  bookingId = '',
  school = '—',
  dorm = '—',
  moveOutDate = '—',
  moveOutTime = '—',
  moveInDate = '—',
  boxQuantity = 1,
  monthlyTotal = 80,
  elevator = false,
  stairs = false,
  additionalItems = '',
  specialInstructions = '',
}: NewBookingAdminEmailProps) {
  return (
    <EmailLayout preview={`📦 New booking — ${customerName} · ${moveOutDate} · ${school}`}>
      <Section style={emailStyles.body_section}>
        {/* Admin badge */}
        <div style={{ marginBottom: '20px' }}>
          <span style={emailStyles.adminBadge}>📦 Admin · New Booking</span>
        </div>

        <Text style={emailStyles.greeting}>New storage booking</Text>

        <Text style={emailStyles.paragraph}>
          A student has completed their booking. Review the details below and confirm the pickup
          in the admin dashboard.
        </Text>

        {/* Client details */}
        <div style={emailStyles.card}>
          <Text style={{
            color: colors.coffee,
            fontSize: '13px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            margin: '0 0 12px',
          }}>
            Client
          </Text>
          <table width="100%" cellPadding="0" cellSpacing="0">
            <tbody>
              <tr>
                <td style={{ ...emailStyles.cardLabel, paddingBottom: '8px' }}>Name</td>
                <td style={{ ...emailStyles.cardValue, paddingBottom: '8px' }}>{customerName}</td>
              </tr>
              <tr>
                <td style={{ ...emailStyles.cardLabel, paddingBottom: '8px' }}>Email</td>
                <td style={{ ...emailStyles.cardValue, paddingBottom: '8px' }}>
                  <Link href={`mailto:${customerEmail}`} style={{ color: colors.coffee, textDecoration: 'none', fontWeight: '600' }}>
                    {customerEmail}
                  </Link>
                </td>
              </tr>
              <tr>
                <td style={emailStyles.cardLabel}>Phone</td>
                <td style={emailStyles.cardValue}>{customerPhone}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Booking details */}
        <div style={emailStyles.card}>
          <Text style={{
            color: colors.coffee,
            fontSize: '13px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            margin: '0 0 12px',
          }}>
            Booking Details
          </Text>
          <table width="100%" cellPadding="0" cellSpacing="0">
            <tbody>
              <tr>
                <td style={{ ...emailStyles.cardLabel, paddingBottom: '8px' }}>Booking ID</td>
                <td style={{ ...emailStyles.cardValue, paddingBottom: '8px', fontFamily: 'monospace', fontSize: '11px' }}>
                  {bookingId}
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
                <td style={{ ...emailStyles.cardValue, paddingBottom: '8px' }}>
                  {boxQuantity} box{boxQuantity > 1 ? 'es' : ''}
                </td>
              </tr>
              {additionalItems && (
                <tr>
                  <td style={{ ...emailStyles.cardLabel, paddingBottom: '8px' }}>Additional items</td>
                  <td style={{ ...emailStyles.cardValue, paddingBottom: '8px' }}>{additionalItems}</td>
                </tr>
              )}
              <tr>
                <td style={{ ...emailStyles.cardLabel, paddingBottom: '8px' }}>Access</td>
                <td style={{ ...emailStyles.cardValue, paddingBottom: '8px' }}>
                  {elevator ? '🛗 Elevator available' : '🪜 Stairs only'}
                  {stairs ? ' · Stairs required' : ''}
                </td>
              </tr>
              {specialInstructions && (
                <tr>
                  <td style={{ ...emailStyles.cardLabel, paddingBottom: '8px' }}>Instructions</td>
                  <td style={{ ...emailStyles.cardValue, paddingBottom: '8px' }}>{specialInstructions}</td>
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

        {/* CTA */}
        <div style={emailStyles.buttonWrap}>
          <Link href={`https://notimestorage.co/admin/bookings`} style={emailStyles.button}>
            Confirm in Admin Dashboard →
          </Link>
        </div>

        <Hr style={emailStyles.divider} />

        <Text style={{ ...emailStyles.paragraph, fontSize: '13px', color: colors.muted }}>
          This is an automated notification from NoTime Storage.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default NewBookingAdminEmail;
