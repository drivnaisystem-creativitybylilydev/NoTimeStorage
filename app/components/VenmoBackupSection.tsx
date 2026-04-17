'use client';

import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';
import { buildVenmoPayUrl, venmoWebProfileUrl, type VenmoNoteContext, buildVenmoNote } from '@/lib/payment/venmo';

type Purpose = 'deposit' | 'booking' | 'upgrade';

type VenmoBackupSectionProps = {
  venmoSlug: string;
  /** Price formatted for display (e.g. "$50.00"). */
  amountLabel: string;
  /** Numeric amount for pre-filling the Venmo pay URL. */
  amountCents?: number;
  purpose: Purpose;
  /** Context used to generate the pre-filled note. Reference note is NOT shown to the customer — it's auto-attached to the Venmo pay URL and visible to admins in the dashboard. */
  noteContext?: VenmoNoteContext;
  /** Override the CTA label. Defaults to "Pay {amountLabel} on Venmo". */
  ctaLabel?: string;
  /** Fired after the user confirms they've opened Venmo — parent can advance state. */
  onOpened?: () => void;
};

export function VenmoBackupSection({
  venmoSlug,
  amountLabel,
  amountCents,
  purpose: _purpose,
  noteContext,
  ctaLabel,
  onOpened,
}: VenmoBackupSectionProps) {
  const display = `@${venmoSlug}`;
  const note = noteContext ? buildVenmoNote(noteContext) : '';
  const amountNum = typeof amountCents === 'number' ? amountCents / 100 : NaN;
  const canDeepLink = Number.isFinite(amountNum) && amountNum > 0 && Boolean(note);
  const href = canDeepLink
    ? buildVenmoPayUrl({ slug: venmoSlug, amount: amountNum, note })
    : venmoWebProfileUrl(venmoSlug);

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #EEF8FE 0%, #f6fafd 100%)',
        border: '1px solid #bae6fd',
        borderRadius: '14px',
        padding: 'clamp(16px, 4vw, 20px)',
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          marginBottom: '10px',
        }}
      >
        <div
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#0369a1',
          }}
        >
          Pay with Venmo
        </div>
        <div
          style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            color: '#0369a1',
            background: 'rgba(125, 211, 252, 0.25)',
            padding: '3px 8px',
            borderRadius: '999px',
          }}
        >
          {display}
        </div>
      </div>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => onOpened?.()}
        className="button-primary"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          width: '100%',
          textAlign: 'center',
          textDecoration: 'none',
          padding: '14px 20px',
          fontSize: '0.95rem',
          marginTop: '4px',
          marginBottom: '14px',
          boxSizing: 'border-box',
        }}
      >
        <span>{ctaLabel ?? `Pay ${amountLabel} on Venmo`}</span>
        <span aria-hidden style={{ fontSize: '1rem', lineHeight: 1 }}>→</span>
      </a>

      <p style={{ margin: 0, fontSize: '0.78rem', color: '#075985', lineHeight: 1.5 }}>
        Questions? Email{' '}
        <a href={`mailto:${SITE_CONTACT_EMAIL}`} style={{ color: '#0369a1', fontWeight: 600 }}>
          {SITE_CONTACT_EMAIL}
        </a>
        .
      </p>
    </div>
  );
}
