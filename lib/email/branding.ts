/**
 * Public HTTPS URLs for email clients (Gmail, Outlook, Apple Mail).
 * Prefer env on Vercel so staging can differ; production should resolve to notimestorage.co.
 */
const rawBase =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://notimestorage.co';

export const EMAIL_PUBLIC_BASE = rawBase.replace(/\/$/, '');

/** v=2 matches site cache-bust; keep logo URL stable across all sends */
export const EMAIL_LOGO_URL = `${EMAIL_PUBLIC_BASE}/brand/notime-storage-logo.png?v=2`;

/** Use in HTML strings built outside React Email (e.g. admin alerts in send.ts). */
export function emailInlineLogoHeaderHtml(): string {
  return `<div style="text-align:center;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #e5e7eb">
  <img src="${EMAIL_LOGO_URL}" width="56" height="56" alt="NoTime Storage" style="display:block;margin:0 auto;border-radius:50%" />
  <p style="font-family:sans-serif;color:#4B2E25;font-size:16px;font-weight:700;margin:10px 0 0">NoTime Storage</p>
  <p style="font-family:sans-serif;color:#6B5A52;font-size:11px;margin:4px 0 0;letter-spacing:0.06em;text-transform:uppercase">Student Storage, Simplified</p>
</div>`;
}
