/**
 * All date/time display helpers for NoTime Storage.
 * Always formats in America/New_York so server-side rendering on Vercel
 * (which runs UTC) shows the correct US Eastern time to users.
 */

const TZ = 'America/New_York';

/**
 * Format a YYYY-MM-DD date string for display.
 * e.g. "2026-05-15" → "Friday, May 15, 2026"
 */
export function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: TZ,
      ...options,
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format a YYYY-MM-DD date string in short form.
 * e.g. "2026-05-15" → "May 15, 2026"
 */
export function formatDateShort(dateStr: string): string {
  return formatDate(dateStr, { weekday: undefined, month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Format a time string (HH:MM or HH:MM:SS) for display.
 * e.g. "14:00" → "2:00 PM"
 */
export function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  try {
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: TZ,
    });
  } catch {
    return timeStr;
  }
}

/**
 * Format a full ISO timestamp for display.
 * e.g. "2026-02-27T03:30:00Z" → "Feb 27, 2026, 10:30 PM"
 */
export function formatTimestamp(isoStr: string): string {
  if (!isoStr) return '';
  try {
    return new Date(isoStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: TZ,
    });
  } catch {
    return isoStr;
  }
}

/**
 * Format a full ISO timestamp — date only.
 * e.g. "2026-02-27T03:30:00Z" → "Feb 27, 2026"
 */
export function formatTimestampDate(isoStr: string): string {
  if (!isoStr) return '';
  try {
    return new Date(isoStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: TZ,
    });
  } catch {
    return isoStr;
  }
}
