/**
 * Backup Venmo pay link. Set NEXT_PUBLIC_VENMO_USERNAME to the Venmo handle
 * with or without @ (e.g. Jane-Doe or @Jane-Doe). Public so the client booking
 * payment page can render the link without an extra API call.
 */
export function normalizeVenmoUsername(raw: string): string | null {
  const slug = raw.trim().replace(/^@+/, '').replace(/\s+/g, '');
  if (!slug) return null;
  // Venmo handles: letters, numbers, hyphen; avoid empty or weird injection
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
