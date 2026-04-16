/**
 * Venmo payment helpers. Set NEXT_PUBLIC_VENMO_USERNAME to the business Venmo
 * handle with or without @ (e.g. notimestorage or @notimestorage). Public so
 * the client booking pages can render a one-tap deep link without a roundtrip.
 */

export function normalizeVenmoUsername(raw: string): string | null {
  const slug = raw.trim().replace(/^@+/, '').replace(/\s+/g, '');
  if (!slug) return null;
  // Venmo handles: letters, numbers, hyphen, underscore (2–50 chars)
  if (!/^[a-zA-Z0-9_-]{2,50}$/.test(slug)) return null;
  return slug;
}

export function getVenmoHandleFromEnv(): string | null {
  const raw = process.env.NEXT_PUBLIC_VENMO_USERNAME;
  if (!raw) return null;
  return normalizeVenmoUsername(raw);
}

export function venmoWebProfileUrl(slug: string): string {
  return `https://venmo.com/${encodeURIComponent(slug)}`;
}

/**
 * Build a concise, admin-matchable Venmo note. Format:
 *   "NoTime #{shortId} · {firstName}"
 * For deposits (no booking yet): "NoTime deposit · {firstName} · {email}"
 * Truncated to 240 chars to stay well under Venmo's 280 cap.
 */
export type VenmoNoteContext =
  | { kind: 'deposit'; firstName?: string | null; email?: string | null }
  | { kind: 'booking'; bookingId: string; firstName?: string | null }
  | { kind: 'upgrade'; bookingId: string; firstName?: string | null };

export function buildVenmoNote(ctx: VenmoNoteContext): string {
  const name = (ctx.firstName ?? '').trim().split(/\s+/)[0] ?? '';
  const safeName = name.replace(/[^\p{L}\p{N}'.-]/gu, '');
  switch (ctx.kind) {
    case 'deposit': {
      const email = (ctx.email ?? '').trim();
      const parts = ['NoTime deposit'];
      if (safeName) parts.push(safeName);
      if (email) parts.push(email);
      return parts.join(' · ').slice(0, 240);
    }
    case 'booking': {
      const short = shortBookingId(ctx.bookingId);
      const parts = [`NoTime #${short}`];
      if (safeName) parts.push(safeName);
      return parts.join(' · ').slice(0, 240);
    }
    case 'upgrade': {
      const short = shortBookingId(ctx.bookingId);
      const parts = [`NoTime upgrade #${short}`];
      if (safeName) parts.push(safeName);
      return parts.join(' · ').slice(0, 240);
    }
  }
}

/** First 6 chars of a UUID — short enough for a note, long enough to match 1:1. */
export function shortBookingId(id: string): string {
  const clean = id.replace(/-/g, '');
  return clean.slice(0, 6).toUpperCase();
}

/**
 * Build a Venmo "pay" universal link. On mobile with Venmo installed iOS/Android
 * will open the app with amount + note pre-filled. On desktop (or mobile without
 * Venmo) it renders the web pay page. One URL handles both — cleaner than
 * maintaining a separate venmo:// scheme.
 *
 * Docs: https://venmo.com/?txn=pay&audience=...&recipients=...&amount=...&note=...
 */
export function buildVenmoPayUrl(opts: {
  slug: string;
  amount: number;
  note: string;
  audience?: 'public' | 'friends' | 'private';
}): string {
  const { slug, amount, note, audience = 'private' } = opts;
  const params = new URLSearchParams({
    txn: 'pay',
    audience,
    recipients: slug,
    amount: amount.toFixed(2),
    note,
  });
  return `https://venmo.com/?${params.toString()}`;
}
