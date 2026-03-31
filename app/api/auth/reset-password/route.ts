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
  let clientOrigin: string;
  try {
    const body = await request.json();
    email = (body.email ?? '').trim().toLowerCase();
    clientOrigin = (body.origin ?? '').trim().replace(/\/$/, '');
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  // Validate client-supplied origin against allowlist to prevent open-redirect abuse
  const ALLOWED_ORIGINS = new Set([
    'http://localhost:3000',
    'http://localhost:3001',
    'https://notimestorage.co',
    'https://www.notimestorage.co',
  ]);
  const isVercelPreview = /^https:\/\/[\w-]+-[\w-]+\.vercel\.app$/.test(clientOrigin);
  const fallbackOrigin = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || AUTH_EMAIL_SITE_FALLBACK).replace(/\/$/, '');
  const origin = (ALLOWED_ORIGINS.has(clientOrigin) || isVercelPreview) ? clientOrigin : fallbackOrigin;

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.error('[reset-password] missing RESEND_API_KEY');
    return NextResponse.json({}, { status: 200 });
  }

  try {
    const admin = createAdminClient();

    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `${origin}/auth/update-password` },
    });

    if (error || !data?.properties?.action_link) {
      console.error('[reset-password] generateLink:', error?.message ?? 'no action_link');
      // Silent success — never reveal whether the email exists
      return NextResponse.json({}, { status: 200 });
    }

    // Extract the raw token from Supabase's action_link, then route through our
    // /api/auth/supabase-verify proxy so the apikey is added server-side (never in the email).
    // Supabase verifies and redirects to /auth/update-password#access_token=...&type=recovery,
    // which the update-password page handles via the implicit hash flow.
    const actionUrl = new URL(data.properties.action_link);
    const rawToken = actionUrl.searchParams.get('token');
    if (!rawToken) {
      console.error('[reset-password] no token in action_link');
      return NextResponse.json({}, { status: 200 });
    }

    const redirectTo = `${origin}/auth/update-password`;
    const ctaUrl = `${origin}/api/auth/supabase-verify?token=${encodeURIComponent(rawToken)}&type=recovery&redirect_to=${encodeURIComponent(redirectTo)}`;

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
