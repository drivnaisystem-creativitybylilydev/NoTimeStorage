import { NextResponse } from 'next/server';
import { createElement } from 'react';
import { render } from '@react-email/render';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';
import { AuthVerifyEmail } from '@/emails/auth-verify-email';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';
import { AUTH_EMAIL_SITE_FALLBACK } from '@/lib/email/auth-hook-send';

/**
 * Server-side password reset — uses admin.generateLink to get the token,
 * then sends via Resend with a /auth/confirm link.
 * This bypasses Supabase's email system entirely so the link is always on
 * our domain and never hits *.supabase.co/auth/v1/verify (which strips apikey on mobile).
 */
export const runtime = 'nodejs';

const FROM = 'NoTime Storage <noreply@notimestorage.co>';

export async function POST(request: Request) {
  let email: string;
  try {
    const body = await request.json();
    email = (body.email ?? '').trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.error('[reset-password] missing RESEND_API_KEY');
    return NextResponse.json({}, { status: 200 });
  }

  try {
    const admin = createAdminClient();
    const origin = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || AUTH_EMAIL_SITE_FALLBACK).replace(/\/$/, '');

    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `${origin}/auth/update-password` },
    });

    if (error || !data?.properties?.hashed_token) {
      console.error('[reset-password] generateLink:', error?.message ?? 'no hashed_token');
      // Silent success — never reveal whether the email exists
      return NextResponse.json({}, { status: 200 });
    }

    const tokenHash = data.properties.hashed_token;
    const ctaUrl = `${origin}/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=recovery&next=/auth/update-password`;

    const html = await render(
      createElement(AuthVerifyEmail, {
        preview: 'Reset your NoTime Storage password',
        title: 'Reset your password',
        body: `We received a request to reset the password for ${email}. Click the button below to choose a new password.`,
        ctaUrl,
        ctaLabel: 'Reset password',
      })
    );

    const resend = new Resend(apiKey);
    const { error: sendError } = await resend.emails.send({
      from: FROM,
      to: [email],
      replyTo: SITE_CONTACT_EMAIL,
      subject: 'Reset your password — NoTime Storage',
      html,
    });

    if (sendError) {
      console.error('[reset-password] Resend send error:', sendError);
    } else {
      console.log('[reset-password] sent recovery email →', email);
    }
  } catch (e) {
    console.error('[reset-password] exception:', e);
  }

  // Always 200 — no email enumeration
  return NextResponse.json({});
}
