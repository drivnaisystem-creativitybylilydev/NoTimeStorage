#!/usr/bin/env node
/**
 * NoTimeMover cross-promo campaign → NoTimeStorage users.
 *
 * Usage (run from the notimestoragewebsite root):
 *   node --env-file=.env.local scripts/campaign-notimemover.mjs --dry-run
 *   node --env-file=.env.local scripts/campaign-notimemover.mjs --test
 *   node --env-file=.env.local scripts/campaign-notimemover.mjs --send
 */

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const EXCLUDE = new Set([
  'jermaine.williams22@outlook.com', // Jermaine own account
  'jwhopper2013@gmail.com',          // Jermaine test account
  'jwilliams19@students.stonehill.edu', // Jermaine test account
  'jwinteriorstone@gmail.com',       // Jermaine own account
  'notimestorage@gmail.com',         // admin/no-name account
  'finnschueler43@gmail.com',        // Finn
  'julius@maiwaldt.de',              // Germany, not relevant
]);

function sanitizeFirstName(fullName) {
  if (!fullName?.trim()) return null;
  const first = fullName.trim().split(/\s+/)[0];
  const clean = first.replace(/['']s$/i, ''); // strip trailing 's (e.g. "Maryam's")
  return clean.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join('-');
}

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isTest   = args.includes('--test');
const isLive   = args.includes('--send');

if (!isDryRun && !isTest && !isLive) {
  console.log('Usage:');
  console.log('  --dry-run   List users, no email sent');
  console.log('  --test      Send test email to BOOKING_NOTIFY_EMAIL');
  console.log('  --send      LIVE send to all users (2 s delay between each)');
  process.exit(0);
}

// ─── env ─────────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY   = process.env.RESEND_API_KEY;
const TEST_TO      = process.env.BOOKING_NOTIFY_EMAIL ?? 'drivn.ai.system@gmail.com';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if ((isTest || isLive) && !RESEND_KEY) {
  console.error('❌  Missing RESEND_API_KEY');
  process.exit(1);
}

// ─── clients ──────────────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const resend = new Resend(RESEND_KEY);

// ─── design tokens (mirror notimemover tailwind.config.ts) ───────────────────
const C = {
  ink:         '#050505',
  obsidian:    '#0A0606',
  coffee:      '#2A1405',
  coffeeDark:  '#1A0D07',
  coffeeLight: '#6B3A1F',
  mahogany:    '#8B5230',
  copper:      '#C2784E',
  bone:        '#F5F1EB',
  line:        '#1F1A17',
  lineLight:   'rgba(255,255,255,0.06)',
  muted:       'rgba(245,241,235,0.45)',
  white:       '#FFFFFF',
};

// ─── email template ───────────────────────────────────────────────────────────
// Background fix strategy:
//  1. <meta name="color-scheme" content="light dark"> — broadest client support
//  2. bgcolor HTML attributes on every table/td — can't be stripped by Gmail CSS processing
//  3. <style> block as a direct child of <body> (not inside hidden div) — Gmail reads body styles
//  4. u + .body selector — targets Gmail's internal email wrapper div specifically
//  5. !important on all background-color inline styles
function buildHtml(firstName) {
  const greeting = firstName ? `Hey ${firstName},` : 'Hey there,';
  const year = new Date().getFullYear();
  const SF = `-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`;
  const SERIF = `Georgia,'Times New Roman',Times,serif`;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="only dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>We also do moving now — NoTimeMover</title>
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
</head>
<body class="body" bgcolor="#0C0805" style="margin:0;padding:0;background-color:#0C0805!important;color-scheme:dark;">

<style type="text/css">
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
  table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}
  img{-ms-interpolation-mode:bicubic;border:0;display:block;}

  /* Dark backgrounds — every selector form that email clients respect */
  html,body,.body,.ew,.wc { background-color:#0C0805!important; }
  /* u+.body targets Gmail web's wrapper div */
  u+.body                 { background-color:#0C0805!important; }
  u+.body .ew,.body .wc  { background-color:#0C0805!important; }
  /* Section backgrounds */
  .hd,.ft { background-color:#100C07!important; }
  .bd     { background-color:#0A0806!important; }
  .cd     { background-color:#140F09!important; }
  /* [data-ogsc] targets Gmail iOS dark mode specifically */
  [data-ogsc] body,[data-ogsc] .ew,[data-ogsc] .wc { background-color:#0C0805!important; }
  [data-ogsc] .hd,[data-ogsc] .ft                  { background-color:#100C07!important; }
  [data-ogsc] .bd                                  { background-color:#0A0806!important; }
  [data-ogsc] .cd                                  { background-color:#140F09!important; }

  @media (prefers-color-scheme:dark){
    html,body,.ew,.wc { background-color:#0C0805!important; }
    .hd,.ft { background-color:#100C07!important; }
    .bd     { background-color:#0A0806!important; }
    .cd     { background-color:#140F09!important; }
  }
  /* Force dark even in light mode — prevents Apple Mail auto-inversion */
  @media (prefers-color-scheme:light){
    html,body,.ew,.wc { background-color:#0C0805!important; color:#F5F1EB!important; }
    .hd,.ft { background-color:#100C07!important; }
    .bd     { background-color:#0A0806!important; }
    .cd     { background-color:#140F09!important; }
    .econ   { background-color:#100C07!important; border-color:#2A1E14!important; }
    td,p,a,span,div { color:inherit!important; }
  }

  @media only screen and (max-width:620px){
    .ew   { padding:0!important; }
    .econ { border-radius:0!important; }
    .sp   { padding:28px 20px!important; }
    .fp   { padding:20px 20px!important; }
    .hl1  { font-size:26px!important; line-height:1.15!important; }
    .hl2  { font-size:28px!important; }
    .sub  { font-size:11px!important; letter-spacing:0.12em!important; }
    .bt   { font-size:14px!important; }
    .gr   { font-size:15px!important; }
    .cb   { display:block!important;width:100%!important;text-align:center!important;box-sizing:border-box!important;padding:16px 20px!important;border-radius:14px!important; }
    .fc   { display:block!important;width:100%!important;border-right:none!important;border-bottom:1px solid #2A1E14!important; }
    .fcl  { border-bottom:none!important; }
    .sc   { display:block!important;width:100%!important;text-align:center!important;padding:12px 0!important;border-right:none!important;border-bottom:1px solid #2A1E14!important; }
    .scl  { border-bottom:none!important; }
    .fl   { display:block!important;margin:0 0 5px!important; }
    .fd   { display:none!important; }
    .li   { width:52px!important;height:52px!important; }
  }
</style>

<!-- Pre-header -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#0C0805;line-height:1px;">
  We just launched NoTime Movers — Boston moving where you name the budget.&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;
</div>

<!-- ══ WRAPPER ═══════════════════════════════════════════════════════════════ -->
<table class="ew" width="100%" cellpadding="0" cellspacing="0" role="presentation"
  bgcolor="#0C0805" style="background-color:#0C0805!important;padding:32px 16px;">
<tr>
  <!-- bgcolor on EVERY td — Gmail iOS shows white through any td without it -->
  <td class="wc" align="center" bgcolor="#0C0805" style="background-color:#0C0805!important;padding:0;">

<!-- ══ CONTAINER ════════════════════════════════════════════════════════════ -->
<!-- overflow:hidden removed — breaks bgcolor on mobile WebKit -->
<table class="econ" width="600" cellpadding="0" cellspacing="0" role="presentation"
  bgcolor="#100C07" style="max-width:600px;width:100%;background-color:#100C07!important;border-radius:14px;border:1px solid #2A1E14;">

  <!-- Copper accent stripe — visual brand marker, 3 px tall -->
  <tr>
    <td bgcolor="#8B5230" style="background-color:#8B5230!important;height:3px;font-size:0;line-height:0;mso-line-height-rule:exactly;">&nbsp;</td>
  </tr>

  <!-- ── HEADER ──────────────────────────────────────────────────────────── -->
  <tr>
    <td class="hd sp" align="center" bgcolor="#100C07"
      style="background-color:#100C07!important;padding:32px 40px 28px;border-bottom:1px solid #2A1E14;">

      <img class="li" src="https://notimemover.com/icon.png" width="56" height="56" alt="NoTimeMover"
        style="display:block;margin:0 auto 14px;border-radius:11px;border:1px solid #2A1E14;" />

      <div style="margin:0 0 14px;line-height:1;">
        <span style="font-size:17px;font-weight:600;letter-spacing:-0.025em;color:#FFFFFF;font-family:${SF};">NoTime</span><span style="font-size:17px;font-weight:600;letter-spacing:-0.025em;color:#8B5230;font-family:${SF};">Mover</span>
      </div>

      <span style="display:inline-block;background-color:#1C1108;border:1px solid #2A1E14;border-radius:9999px;padding:5px 14px;font-size:10px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#C2784E;font-family:${SF};">
        Announcement from the NoTime team
      </span>
    </td>
  </tr>

  <!-- ── HERO ────────────────────────────────────────────────────────────── -->
  <tr>
    <td class="hd sp" align="center" bgcolor="#100C07"
      style="background-color:#100C07!important;padding:40px 44px 38px;border-bottom:1px solid #2A1E14;">

      <div class="hl1" style="font-size:36px;font-weight:700;letter-spacing:-0.03em;line-height:1.08;color:#FFFFFF;margin:0 0 4px;font-family:${SF};">
        The only moving company where
      </div>
      <div class="hl2" style="font-size:36px;font-weight:400;font-style:italic;letter-spacing:-0.02em;line-height:1.1;color:#C2784E;margin:0 0 26px;font-family:${SERIF};">
        you control the price.
      </div>

      <p class="sub" style="font-size:11px;color:rgba(245,241,235,0.60);letter-spacing:0.2em;text-transform:uppercase;margin:0;line-height:1.6;font-family:${SF};font-weight:600;">
        Massachusetts&nbsp;&nbsp;&middot;&nbsp;&nbsp;Fully Insured&nbsp;&nbsp;&middot;&nbsp;&nbsp;Free Quote
      </p>
    </td>
  </tr>

  <!-- ── BODY ────────────────────────────────────────────────────────────── -->
  <tr>
    <td class="bd sp" bgcolor="#0A0806"
      style="background-color:#0A0806!important;padding:36px 44px 32px;border-bottom:1px solid #2A1E14;">

      <p class="gr" style="font-size:16px;font-weight:500;color:#F5F1EB;line-height:1.7;margin:0 0 16px;font-family:${SF};">
        ${greeting}
      </p>

      <p class="bt" style="font-size:15px;color:rgba(245,241,235,0.88);line-height:1.9;margin:0 0 14px;font-family:${SF};">
        So we just launched a moving company called <strong style="color:#F5F1EB;font-weight:600;">NoTime Movers</strong>. Same team behind NoTime Storage. We're looking for our first customers and figured you should hear about it first.
      </p>

      <p class="bt" style="font-size:15px;color:rgba(245,241,235,0.88);line-height:1.9;margin:0 0 30px;font-family:${SF};">
        The way it works: you tell us your budget upfront, we tell you exactly what it covers before you commit. No surprise charges at the end, no stair fees, nothing added on. Just Boston moving that actually makes sense.
      </p>

      <!-- ── Features 3-col ── -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
        style="margin:0 0 30px;border-radius:10px;overflow:hidden;border:1px solid #2A1E14;">
        <tr>
          <td class="fc" width="33%" valign="top" bgcolor="#140F09"
            style="background-color:#140F09!important;padding:18px 18px;border-right:1px solid #2A1E14;">
            <p style="font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#8B5230;margin:0 0 7px;font-family:${SF};">Fully insured</p>
            <p style="font-size:12px;color:rgba(245,241,235,0.80);margin:0;line-height:1.6;font-family:${SF};">Covered from first item loaded to last box set down. No exceptions.</p>
          </td>
          <td class="fc" width="33%" valign="top" bgcolor="#140F09"
            style="background-color:#140F09!important;padding:18px 18px;border-right:1px solid #2A1E14;">
            <p style="font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#8B5230;margin:0 0 7px;font-family:${SF};">No stair fees</p>
            <p style="font-size:12px;color:rgba(245,241,235,0.80);margin:0;line-height:1.6;font-family:${SF};">Boston walk-ups are part of the job. What you set is what you pay.</p>
          </td>
          <td class="fc fcl" width="33%" valign="top" bgcolor="#140F09"
            style="background-color:#140F09!important;padding:18px 18px;">
            <p style="font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#8B5230;margin:0 0 7px;font-family:${SF};">Same-day reply</p>
            <p style="font-size:12px;color:rgba(245,241,235,0.80);margin:0;line-height:1.6;font-family:${SF};">A real person confirms your details, usually within the hour.</p>
          </td>
        </tr>
      </table>

      <!-- ── CTA ── -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 30px;">
        <tr>
          <td align="center">
            <a class="cb" href="https://notimemover.com"
              style="display:inline-block;background-color:#F5F1EB;color:#0C0805;text-decoration:none;font-size:15px;font-weight:600;letter-spacing:-0.01em;padding:15px 48px;border-radius:9999px;font-family:${SF};">
              Get an Instant Quote &rarr;
            </a>
          </td>
        </tr>
      </table>

      <!-- ── Divider ── -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
        <tr><td bgcolor="#2A1E14" style="background-color:#2A1E14!important;height:1px;font-size:0;line-height:0;mso-line-height-rule:exactly;">&nbsp;</td></tr>
      </table>

      <!-- ── Referral nudge ── -->
      <p class="bt" style="font-size:15px;color:rgba(245,241,235,0.88);line-height:1.9;margin:0 0 28px;font-family:${SF};">
        You probably know at least one person moving this summer. If they&rsquo;re around Boston, send them our way. We&rsquo;re just getting started and every booking genuinely helps.
      </p>

      <!-- ── Contact / social row ── -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
        bgcolor="#140F09" style="background-color:#140F09!important;border:1px solid #2A1E14;border-radius:10px;margin:0 0 28px;">
        <tr>
          <td class="sc" align="center" width="33%" valign="middle"
            style="padding:16px 14px;border-right:1px solid #2A1E14;">
            <a href="https://www.instagram.com/notimemover/" style="text-decoration:none;">
              <p style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#8B5230;margin:0 0 5px;font-weight:700;font-family:${SF};">Instagram</p>
              <p style="font-size:13px;color:rgba(245,241,235,0.85);margin:0;font-family:${SF};">@notimemover</p>
            </a>
          </td>
          <td class="sc" align="center" width="33%" valign="middle"
            style="padding:16px 14px;border-right:1px solid #2A1E14;">
            <a href="mailto:contact@notimemover.com" style="text-decoration:none;">
              <p style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#8B5230;margin:0 0 5px;font-weight:700;font-family:${SF};">Email</p>
              <p style="font-size:11px;color:rgba(245,241,235,0.85);margin:0;font-family:${SF};">contact@notimemover.com</p>
            </a>
          </td>
          <td class="sc scl" align="center" width="33%" valign="middle"
            style="padding:16px 14px;">
            <a href="tel:+12039194098" style="text-decoration:none;">
              <p style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#8B5230;margin:0 0 5px;font-weight:700;font-family:${SF};">Phone</p>
              <p style="font-size:13px;color:rgba(245,241,235,0.85);margin:0;font-family:${SF};">(203) 919-4098</p>
            </a>
          </td>
        </tr>
      </table>

      <p style="font-size:14px;color:rgba(245,241,235,0.60);margin:0;line-height:1.6;font-family:${SF};">
        &mdash;&nbsp;Jermaine &amp; the NoTime team
      </p>
    </td>
  </tr>

  <!-- ── FOOTER ──────────────────────────────────────────────────────────── -->
  <tr>
    <td class="ft fp" align="center" bgcolor="#0C0805"
      style="background-color:#0C0805!important;padding:22px 40px;border-top:1px solid #2A1E14;">

      <p style="margin:0 0 10px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.45);font-weight:600;font-family:${SF};">
        &copy; ${year} NoTimeMover &nbsp;&middot;&nbsp; Boston, MA &nbsp;&middot;&nbsp; Fully Insured
      </p>

      <p style="margin:0 0 12px;font-size:11px;line-height:2;font-family:${SF};">
        <a class="fl" href="https://notimemover.com" style="color:rgba(245,241,235,0.45);text-decoration:none;">notimemover.com</a>
        <span class="fd" style="color:#2A1E14;">&nbsp;&middot;&nbsp;</span>
        <a class="fl" href="https://notimestorage.co" style="color:rgba(245,241,235,0.45);text-decoration:none;">notimestorage.co</a>
      </p>

      <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.40);line-height:1.7;font-family:${SF};">
        You&rsquo;re receiving this because you have a NoTime Storage account.<br />
        To opt out, reply with &ldquo;unsubscribe.&rdquo;
      </p>
    </td>
  </tr>

</table>
<!-- /Container -->

  </td>
</tr>
</table>
<!-- /Wrapper -->
</body>
</html>`;
}

// ─── main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Fetching users from Supabase...\n');

  const { data: users, error } = await supabase
    .from('users')
    .select('id, full_name, email')
    .not('email', 'is', null)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Supabase error:', error.message);
    process.exit(1);
  }

  const validUsers = users.filter(u => u.email?.trim().length > 0 && !EXCLUDE.has(u.email.trim().toLowerCase()));
  console.log(`Found ${validUsers.length} users with email addresses.\n`);

  // ── dry run ────────────────────────────────────────────────────────────────
  if (isDryRun) {
    validUsers.forEach((u, i) => {
      const name = (u.full_name || '(no name)').padEnd(32);
      console.log(`${String(i + 1).padStart(3)}. ${name} ${u.email}`);
    });
    console.log('\nRe-run with --test or --send to send emails.');
    return;
  }

  // ── test send ──────────────────────────────────────────────────────────────
  if (isTest) {
    console.log(`Sending test email to ${TEST_TO}...`);
    const { data, error: sendError } = await resend.emails.send({
      from:    'NoTime Storage <noreply@notimestorage.co>',
      to:      [TEST_TO],
      replyTo: 'contact@notimemover.com',
      subject: 'know anyone moving soon?',
      html:    buildHtml('Finn'),
    });
    if (sendError) {
      console.error('❌  Send failed:', sendError);
    } else {
      console.log('✅  Test sent!  ID:', data?.id);
      console.log(`   Check ${TEST_TO} (also Promotions tab).`);
    }
    return;
  }

  // ── live send ──────────────────────────────────────────────────────────────
  if (isLive) {
    console.log(`⚠️   LIVE SEND to ${validUsers.length} users.`);
    console.log('    Starting in 5 s... Ctrl+C to abort.\n');
    await new Promise(r => setTimeout(r, 5000));

    let sent = 0, failed = 0;

    for (let i = 0; i < validUsers.length; i++) {
      const user      = validUsers[i];
      const firstName = sanitizeFirstName(user.full_name);

      const { data, error: sendError } = await resend.emails.send({
        from:    'NoTime Storage <noreply@notimestorage.co>',
        to:      [user.email],
        replyTo: 'contact@notimemover.com',
        subject: 'know anyone moving soon?',
        html:    buildHtml(firstName),
      });

      if (sendError) {
        console.error(`❌  [${i + 1}/${validUsers.length}] FAILED  ${user.email}: ${sendError.message}`);
        failed++;
      } else {
        console.log(`✅  [${i + 1}/${validUsers.length}] Sent    ${user.email}  (${data?.id})`);
        sent++;
      }

      if (i < validUsers.length - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    console.log(`\n── Done ──────────────────────────────`);
    console.log(`   Sent:   ${sent}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Total:  ${validUsers.length}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
