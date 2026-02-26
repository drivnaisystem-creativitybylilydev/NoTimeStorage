import {
  Section,
  Text,
  Link,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { EmailLayout, emailStyles, colors } from './components/EmailLayout';

interface DepositPaidAdminEmailProps {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  school: string;
  depositAmount?: number;
  userId?: string;
  paidAt?: string;
}

export function DepositPaidAdminEmail({
  customerName = 'Unknown',
  customerEmail = '',
  customerPhone = '—',
  school = '—',
  depositAmount = 50,
  userId = '',
  paidAt = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
}: DepositPaidAdminEmailProps) {
  return (
    <EmailLayout preview={`💰 Deposit received — ${customerName} (${school})`}>
      <Section style={emailStyles.body_section}>
        {/* Admin badge */}
        <div style={{ marginBottom: '20px' }}>
          <span style={emailStyles.adminBadge}>💰 Admin · Deposit Received</span>
        </div>

        <Text style={emailStyles.greeting}>New deposit payment</Text>

        <Text style={emailStyles.paragraph}>
          A student has paid their <strong>${depositAmount} deposit</strong> and is now able to
          complete their storage booking. Their account is unlocked.
        </Text>

        {/* Client details card */}
        <div style={emailStyles.card}>
          <Text style={{
            color: colors.coffee,
            fontSize: '13px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            margin: '0 0 12px',
          }}>
            Client Details
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
                <td style={{ ...emailStyles.cardLabel, paddingBottom: '8px' }}>Phone</td>
                <td style={{ ...emailStyles.cardValue, paddingBottom: '8px' }}>{customerPhone}</td>
              </tr>
              <tr>
                <td style={{ ...emailStyles.cardLabel, paddingBottom: '8px' }}>School</td>
                <td style={{ ...emailStyles.cardValue, paddingBottom: '8px' }}>{school}</td>
              </tr>
              <tr>
                <td colSpan={2}>
                  <Hr style={{ borderColor: colors.cream, margin: '8px 0' }} />
                </td>
              </tr>
              <tr>
                <td style={{ ...emailStyles.cardLabel, paddingBottom: '8px' }}>Deposit amount</td>
                <td style={{ ...emailStyles.cardValue, paddingBottom: '8px', color: '#16A34A', fontSize: '15px' }}>
                  +${depositAmount}.00
                </td>
              </tr>
              <tr>
                <td style={{ ...emailStyles.cardLabel, paddingBottom: '8px' }}>Paid at</td>
                <td style={{ ...emailStyles.cardValue, paddingBottom: '8px' }}>{paidAt}</td>
              </tr>
              {userId && (
                <tr>
                  <td style={emailStyles.cardLabel}>User ID</td>
                  <td style={{ ...emailStyles.cardValue, fontFamily: 'monospace', fontSize: '11px' }}>{userId}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* CTA */}
        <div style={emailStyles.buttonWrap}>
          <Link href="https://notimestorage.co/admin/customers" style={emailStyles.button}>
            View in Admin Dashboard →
          </Link>
        </div>

        <Hr style={emailStyles.divider} />

        <Text style={{ ...emailStyles.paragraph, fontSize: '13px', color: colors.muted }}>
          This is an automated notification from NoTime Storage. The student will now be directed
          to schedule their move-out and choose boxes.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default DepositPaidAdminEmail;
