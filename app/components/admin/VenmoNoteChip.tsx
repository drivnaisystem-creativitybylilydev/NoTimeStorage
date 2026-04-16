'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

type VenmoNoteChipProps = {
  /** The exact text the student's Venmo payment should contain. */
  note: string;
  /** Optional heading shown above the note (default: "Venmo note"). */
  label?: string;
  /** When true, lays out inline (default false → stacked block). */
  inline?: boolean;
};

/**
 * Compact, copy-to-clipboard chip showing the Venmo note the student
 * should have included with their payment. Lets the client reconcile
 * Venmo → admin in one glance.
 */
export function VenmoNoteChip({ note, label = 'Venmo note', inline = false }: VenmoNoteChipProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(note);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked — fall back silently (note is still visible).
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: inline ? 'row' : 'column',
        alignItems: inline ? 'center' : 'flex-start',
        gap: inline ? '8px' : '4px',
      }}
    >
      <div
        style={{
          fontSize: '10px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--color-gray-500)',
          lineHeight: 1,
        }}
      >
        {label}
      </div>
      <button
        type="button"
        onClick={handleCopy}
        title={copied ? 'Copied!' : 'Click to copy'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          border: `1px solid ${copied ? '#86efac' : '#bae6fd'}`,
          borderRadius: '6px',
          background: copied ? '#dcfce7' : '#f0f9ff',
          color: copied ? '#166534' : '#0c4a6e',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: '12px',
          fontWeight: 600,
          lineHeight: 1.4,
          cursor: 'pointer',
          maxWidth: '100%',
          textAlign: 'left',
          wordBreak: 'break-word',
        }}
      >
        <span style={{ flex: 1, minWidth: 0, whiteSpace: 'normal' }}>{note}</span>
        <span aria-hidden style={{ flexShrink: 0, display: 'inline-flex' }}>
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </span>
      </button>
    </div>
  );
}
