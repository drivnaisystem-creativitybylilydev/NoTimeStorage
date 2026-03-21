/**
 * Supabase Auth "Send Email" hook — send signup / reset / magic link via Resend API.
 * @see https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook
 */
import { Webhook } from 'standardwebhooks';

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

export function buildAuthEmailHtml(opts: {
  title: string;
  intro: string;
  actionUrl?: string;
  buttonLabel?: string;
  otpCode?: string;
}): string {
  const { title, intro, actionUrl, buttonLabel = 'Continue', otpCode } = opts;
  const safeIntro = escapeHtml(intro);
  const button = actionUrl
    ? `<a href="${escapeAttr(actionUrl)}" style="display:inline-block;padding:14px 28px;background:#5c4033;color:#faf7f2;text-decoration:none;border-radius:10px;font-weight:600;font-size:16px;">${escapeHtml(buttonLabel)}</a>`
    : '';
  const otpBlock = otpCode
    ? `<p style="margin:24px 0 8px;color:#4A3A34;font-size:14px;">Or enter this code:</p>
       <p style="font-size:28px;letter-spacing:6px;font-weight:700;color:#1a1a1a;margin:0;padding:16px 20px;background:#f4f0eb;border-radius:8px;display:inline-block;">${escapeHtml(otpCode)}</p>`
    : '';
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:24px;background:#faf7f2;font-family:system-ui,-apple-system,sans-serif;color:#2d2419;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;padding:32px 28px;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
      <tr><td>
        <h1 style="margin:0 0 16px;font-size:22px;color:#3d2f26;">${escapeHtml(title)}</h1>
        <p style="margin:0 0 24px;line-height:1.55;color:#4A3A34;font-size:15px;">${safeIntro}</p>
        ${button ? `<p style="margin:0 0 8px;">${button}</p>` : ''}
        ${otpBlock}
        <p style="margin-top:28px;font-size:12px;color:#9B8880;line-height:1.5;">If you didn’t request this, you can ignore this email.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, '&#39;');
}

export function introForAction(
  action: string,
  email: string
): { title: string; intro: string; buttonLabel: string } {
  const e = escapeHtml(email);
  switch (action) {
    case 'signup':
      return {
        title: 'Confirm your email',
        intro: `Thanks for signing up. Confirm your email address for ${e} to finish creating your account.`,
        buttonLabel: 'Confirm email',
      };
    case 'recovery':
      return {
        title: 'Reset your password',
        intro: `We received a request to reset the password for ${e}. Click below to choose a new password.`,
        buttonLabel: 'Reset password',
      };
    case 'magiclink':
      return {
        title: 'Sign in to NoTime Storage',
        intro: `Use the link below to sign in as ${e}.`,
        buttonLabel: 'Sign in',
      };
    case 'invite':
      return {
        title: "You're invited",
        intro: `You’ve been invited to join NoTime Storage. Click below to accept.`,
        buttonLabel: 'Accept invite',
      };
    case 'email_change':
      return {
        title: 'Confirm email change',
        intro: `Confirm this change for your NoTime Storage account.`,
        buttonLabel: 'Confirm',
      };
    default:
      return {
        title: 'NoTime Storage',
        intro: `Account notification for ${e}.`,
        buttonLabel: 'Open',
      };
  }
}

export type PreparedAuthEmail = { to: string; subject: string; html: string };

/** Build one or more outbound auth emails for Resend */
export function prepareAuthEmails(
  supabaseUrl: string,
  user: HookUser,
  email_data: HookEmailData
): PreparedAuthEmail[] {
  const { email_action_type, token, token_hash, redirect_to, token_new, token_hash_new } =
    email_data;
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
    const { title, intro, buttonLabel } = introForAction('email_change', user.email);

    out.push({
      to: user.email,
      subject: 'Confirm email change (current address) — NoTime Storage',
      html: buildAuthEmailHtml({
        title,
        intro: `${intro} This confirmation is for your current email address.`,
        actionUrl: linkCurrent,
        buttonLabel,
        otpCode: token || undefined,
      }),
    });

    const introNew = introForAction('email_change', user.new_email);
    out.push({
      to: user.new_email,
      subject: 'Confirm your new email — NoTime Storage',
      html: buildAuthEmailHtml({
        title: introNew.title,
        intro: `${introNew.intro} This confirmation is for your new email address.`,
        actionUrl: linkNew,
        buttonLabel: introNew.buttonLabel,
        otpCode: token_new || undefined,
      }),
    });

    return out;
  }

  const { title, intro, buttonLabel } = introForAction(email_action_type, user.email);
  let actionUrl: string | undefined;
  if (usesVerifyLink(email_action_type) && token_hash) {
    actionUrl = buildVerifyLink(supabaseUrl, token_hash, email_action_type, redirect_to);
  }

  out.push({
    to: user.email,
    subject: subjectForAction(email_action_type),
    html: buildAuthEmailHtml({
      title,
      intro,
      actionUrl,
      buttonLabel,
      otpCode: token || undefined,
    }),
  });

  return out;
}
