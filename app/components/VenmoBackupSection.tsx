import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';
import { venmoWebProfileUrl } from '@/lib/payment/venmo';

type Purpose = 'deposit' | 'booking' | 'upgrade';

type VenmoBackupSectionProps = {
  venmoSlug: string;
  amountLabel: string;
  purpose: Purpose;
};

export function VenmoBackupSection({ venmoSlug, amountLabel, purpose }: VenmoBackupSectionProps) {
  const display = `@${venmoSlug}`;
  const href = venmoWebProfileUrl(venmoSlug);
  const purposeLine =
    purpose === 'deposit'
      ? 'Include the word deposit and the email you used to sign up in the Venmo note.'
      : purpose === 'upgrade'
        ? 'Include booking upgrade, your name, and the email on your account in the Venmo note.'
        : 'Include NoTime checkout and the email you used to sign up in the Venmo note.';

  const closingLine =
    purpose === 'deposit'
      ? 'We mark your deposit received after we confirm payment (usually within one business day).'
      : purpose === 'upgrade'
        ? 'Send this amount first, then tap Save changes below so we can update your booking.'
        : 'We confirm your booking after we verify payment (usually within one business day).';

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #E8F4FC 0%, #f0f7fc 100%)',
        border: '1px solid #7dd3fc',
        borderRadius: '12px',
        padding: '16px 18px',
        marginBottom: '20px',
      }}
    >
      <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0369a1', marginBottom: '8px' }}>
        Pay with Venmo
      </div>
      <p style={{ margin: '0 0 12px', fontSize: '0.9rem', lineHeight: 1.55, color: '#0c4a6e' }}>
        Send <strong>{amountLabel}</strong> to <strong>{display}</strong>. {purposeLine} {closingLine}
      </p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="button-primary"
        style={{
          display: 'inline-block',
          textAlign: 'center',
          textDecoration: 'none',
          padding: '12px 20px',
          fontSize: '0.95rem',
          marginBottom: '10px',
        }}
      >
        Open Venmo
      </a>
      <p style={{ margin: 0, fontSize: '0.8rem', color: '#075985' }}>
        Questions?{' '}
        <a href={`mailto:${SITE_CONTACT_EMAIL}`} style={{ color: '#0369a1', fontWeight: 600 }}>
          {SITE_CONTACT_EMAIL}
        </a>
      </p>
    </div>
  );
}
