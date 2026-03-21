import { NextResponse } from 'next/server';
import { createElement } from 'react';
import { render } from '@react-email/render';
import { Resend } from 'resend';
import { AuthVerifyEmail } from '@/emails/auth-verify-email';
import {
  verifySendEmailPayload,
  prepareAuthEmails,
} from '@/lib/email/auth-hook-send';

/**
 * Supabase Auth — Send Email hook (HTTPS).
 * When configured in Supabase Dashboard → Authentication → Auth Hooks,
 * all auth emails (signup, recovery, etc.) go through Resend API (same as booking emails).
 *
 * Env: SEND_EMAIL_HOOK_SECRET (from Supabase when you create the hook), RESEND_API_KEY, NEXT_PUBLIC_SUPABASE_URL
 */
export const runtime = 'nodejs';

const FROM = 'NoTime Storage <noreply@notimestorage.co>';
const REPLY_TO = 'support@notimestorage.co';

function webhookHeaderRecord(request: Request): Record<string, string> {
  const h = request.headers;
  const get = (name: string) => h.get(name) ?? '';
  return {
    'webhook-id': get('webhook-id'),
    'webhook-timestamp': get('webhook-timestamp'),
    'webhook-signature': get('webhook-signature'),
  };
}

export async function POST(request: Request) {
  const payload = await request.text();
  const headers = webhookHeaderRecord(request);

  let verified;
  try {
    verified = verifySendEmailPayload(payload, headers);
  } catch (e) {
    console.error('[auth/send-email] webhook verify failed:', e);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!supabaseUrl || !apiKey) {
    console.error('[auth/send-email] missing NEXT_PUBLIC_SUPABASE_URL or RESEND_API_KEY');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const emails = prepareAuthEmails(supabaseUrl, verified.user, verified.email_data);
  const resend = new Resend(apiKey);

  try {
    for (const mail of emails) {
      const html = await render(createElement(AuthVerifyEmail, mail.emailProps));

      const { error } = await resend.emails.send({
        from: FROM,
        to: [mail.to],
        replyTo: REPLY_TO,
        subject: mail.subject,
        html,
      });
      if (error) {
        console.error('[auth/send-email] Resend error:', error);
        return NextResponse.json(
          { error: error.message ?? 'Email send failed' },
          { status: 500 }
        );
      }
      console.log('[auth/send-email] sent', mail.subject, '→', mail.to);
    }
  } catch (e) {
    console.error('[auth/send-email] exception:', e);
    return NextResponse.json({ error: 'Email send failed' }, { status: 500 });
  }

  return NextResponse.json({});
}
