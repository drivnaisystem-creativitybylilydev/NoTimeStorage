'use client';

import { useState } from 'react';
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
  /** Context used to generate the pre-filled note. If omitted, falls back to a generic note + profile link. */
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
  purpose,
  noteContext,
  ctaLabel,
  onOpened,
}: VenmoBackupSectionProps) {
  const [copied, setCopied] = useState(false);

  const display = `@${venmoSlug}`;
  const note = noteContext ? buildVenmoNote(noteContext) : '';
  const amountNum = typeof amountCents === 'number' ? amountCents / 100 : NaN;
  const canDeepLink = Number.isFinite(amountNum) && amountNum > 0 && Boolean(note);
  const href = canDeepLink
    ? buildVenmoPayUrl({ slug: venmoSlug, amount: amountNum, note })
    : venmoWebProfileUrl(venmoSlug);

  const helperLine = canDeepLink
    ? 'Amount and note are pre-filled — just confirm in Venmo.'
    : purpose === 'deposit'
      ? 'Include “deposit” and your sign-up email in the Venmo note.'
      : purpose === 'upgrade'
        ? 'Include “upgrade”, your name, and your account email in the Venmo note.'
        : 'Include “NoTime checkout” and your sign-up email in the Venmo note.';

  const handleCopyNote = async () => {
    if (!note) return;
    try {
      await navigator.clipboard.writeText(note);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API blocked; ignore — the note is visible on screen.
    }
  };

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

      <p
        style={{
          margin: '0 0 14px',
          fontSize: '0.9rem',
          lineHeight: 1.5,
          color: '#0c4a6e',
        }}
      >
        Send <strong>{amountLabel}</strong> — {helperLine}
      </p>

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
          marginBottom: canDeepLink ? '12px' : '10px',
          boxSizing: 'border-box',
        }}
      >
        <span>{ctaLabel ?? `Pay ${amountLabel} on Venmo`}</span>
        <span aria-hidden style={{ fontSize: '1rem', lineHeight: 1 }}>→</span>
      </a>

      {canDeepLink && (
        <div style={{ marginBottom: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: '8px',
              marginBottom: '6px',
            }}
          >
            <div
              style={{
                fontSize: '0.68rem',
                color: '#075985',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 700,
              }}
            >
              Auto-filled note
            </div>
            <button
              type="button"
              onClick={handleCopyNote}
              style={{
                flexShrink: 0,
                padding: '2px 10px',
                fontSize: '0.7rem',
                fontWeight: 700,
                background: copied ? '#dcfce7' : 'transparent',
                color: copied ? '#166534' : '#0369a1',
                border: '1px solid',
                borderColor: copied ? '#86efac' : '#7dd3fc',
                borderRadius: '999px',
                cursor: 'pointer',
                lineHeight: 1.5,
              }}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div
            style={{
              background: 'white',
              border: '1px solid #bae6fd',
              borderRadius: '8px',
              padding: '8px 12px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: '0.8rem',
              color: '#0c4a6e',
              wordBreak: 'break-word',
            }}
          >
            {note}
          </div>
        </div>
      )}

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
