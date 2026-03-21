/**
 * Supabase Auth "Send Email" hook — send signup / reset / magic link via Resend API.
 * @see https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook
 */
import { Webhook } from 'standardwebhooks';
import type { AuthVerifyEmailProps } from '@/emails/auth-verify-email';

const REPLY_TO = 'support@notimestorage.co';

export { REPLY_TO as AUTH_EMAIL_REPLY_TO };

export type HookUser = {
  id: string;
  email: string;
  /** Present during email change flow */
  new_email?: string;
};

export type HookEmailData = {
  token: string;
  token_hash: string;
  redirect_to: string;
  email_action_type: string;
  site_url: string;
  token_new: string;
  token_hash_new: string;
};

export type SendEmailHookPayload = {
  user: HookUser;
  email_data: HookEmailData;
};

/** Strip Supabase-style prefix so standardwebhooks accepts the secret */
export function getSendEmailHookSecret(): string {
  const raw = process.env.SEND_EMAIL_HOOK_SECRET?.trim();
  if (!raw) {
    throw new Error('SEND_EMAIL_HOOK_SECRET is not set');
  }
  return raw.replace(/^v1,whsec_/, '');
}

export function verifySendEmailPayload(
  payload: string,
  headers: Record<string, string>
): SendEmailHookPayload {
  const wh = new Webhook(getSendEmailHookSecret());
  return wh.verify(payload, headers) as SendEmailHookPayload;
}

/** Build Supabase Auth verify link (token param carries the hash) */
export function buildVerifyLink(
  supabaseUrl: string,
  tokenHash: string,
  emailActionType: string,
  redirectTo: string
): string {
  const base = supabaseUrl.replace(/\/$/, '');
  const qs = new URLSearchParams({
    token: tokenHash,
    type: emailActionType,
    redirect_to: redirectTo,
  });
  return `${base}/auth/v1/verify?${qs.toString()}`;
}

const SUBJECTS: Record<string, string> = {
  signup: 'Confirm your email — NoTime Storage',
  recovery: 'Reset your password — NoTime Storage',
  magiclink: 'Your sign-in link — NoTime Storage',
  invite: "You're invited — NoTime Storage",
  email_change: 'Confirm your email change — NoTime Storage',
  email: 'Confirm your email — NoTime Storage',
  reauthentication: 'Confirm it’s you — NoTime Storage',
  password_changed_notification: 'Your password was changed — NoTime Storage',
  email_changed_notification: 'Your email was changed — NoTime Storage',
  phone_changed_notification: 'Your phone was changed — NoTime Storage',
  identity_linked_notification: 'Account linked — NoTime Storage',
  identity_unlinked_notification: 'Account unlinked — NoTime Storage',
  mfa_factor_enrolled_notification: '2FA enrolled — NoTime Storage',
  mfa_factor_unenrolled_notification: '2FA removed — NoTime Storage',
};

export function subjectForAction(emailActionType: string): string {
  return SUBJECTS[emailActionType] ?? 'NoTime Storage — account notification';
}

function usesVerifyLink(action: string): boolean {
  return [
    'signup',
    'recovery',
    'magiclink',
    'invite',
    'email_change',
    'email',
    'reauthentication',
  ].includes(action);
}

export function introForAction(
  action: string,
  email: string
): { title: string; body: string; buttonLabel: string; preview: string } {
  switch (action) {
    case 'signup':
      return {
        title: 'Confirm your email',
        body: `Thanks for signing up. Confirm your email address for ${email} to finish creating your account.`,
        buttonLabel: 'Confirm email',
        preview: 'Confirm your email to finish creating your NoTime Storage account',
      };
    case 'recovery':
      return {
        title: 'Reset your password',
        body: `We received a request to reset the password for ${email}. Click the button below to choose a new password.`,
        buttonLabel: 'Reset password',
        preview: 'Reset your NoTime Storage password',
      };
    case 'magiclink':
      return {
        title: 'Sign in to NoTime Storage',
        body: `Use the sign-in link below for ${email}.`,
        buttonLabel: 'Sign in',
        preview: 'Your NoTime Storage sign-in link',
      };
    case 'invite':
      return {
        title: "You're invited",
        body: `You've been invited to join NoTime Storage. Click below to accept.`,
        buttonLabel: 'Accept invite',
        preview: "You're invited to NoTime Storage",
      };
    case 'email_change':
      return {
        title: 'Confirm email change',
        body: `Confirm this change for your NoTime Storage account.`,
        buttonLabel: 'Confirm',
        preview: 'Confirm your email change — NoTime Storage',
      };
    default:
      return {
        title: 'NoTime Storage',
        body: `Account notification for ${email}.`,
        buttonLabel: 'Open',
        preview: 'NoTime Storage account notification',
      };
  }
}

export type PreparedAuthEmail = {
  to: string;
  subject: string;
  emailProps: AuthVerifyEmailProps;
};

/** Build one or more outbound auth emails for Resend (render HTML in route with @react-email/render) */
export function prepareAuthEmails(
  supabaseUrl: string,
  user: HookUser,
  email_data: HookEmailData
): PreparedAuthEmail[] {
  const { email_action_type, token_hash, redirect_to, token_hash_new } = email_data;
  const out: PreparedAuthEmail[] = [];

  // Secure email change: two emails — https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook
  if (
    email_action_type === 'email_change' &&
    user.new_email &&
    token_hash_new &&
    token_hash
  ) {
    const linkCurrent = buildVerifyLink(supabaseUrl, token_hash_new, 'email_change', redirect_to);
    const linkNew = buildVerifyLink(supabaseUrl, token_hash, 'email_change', redirect_to);
    const base = introForAction('email_change', user.email);

    out.push({
      to: user.email,
      subject: 'Confirm email change (current address) — NoTime Storage',
      emailProps: {
        preview: `${base.preview} — current address`,
        title: base.title,
        body: `${base.body} This confirmation is for your current email address.`,
        ctaUrl: linkCurrent,
        ctaLabel: base.buttonLabel,
      },
    });

    const introNew = introForAction('email_change', user.new_email);
    out.push({
      to: user.new_email,
      subject: 'Confirm your new email — NoTime Storage',
      emailProps: {
        preview: `${introNew.preview} — new address`,
        title: introNew.title,
        body: `${introNew.body} This confirmation is for your new email address.`,
        ctaUrl: linkNew,
        ctaLabel: introNew.buttonLabel,
      },
    });

    return out;
  }

  const { title, body, buttonLabel, preview } = introForAction(email_action_type, user.email);
  let ctaUrl: string | undefined;
  if (usesVerifyLink(email_action_type) && token_hash) {
    ctaUrl = buildVerifyLink(supabaseUrl, token_hash, email_action_type, redirect_to);
  }

  out.push({
    to: user.email,
    subject: subjectForAction(email_action_type),
    emailProps: {
      preview,
      title,
      body,
      ctaUrl,
      ctaLabel: buttonLabel,
    },
  });

  return out;
}
