import { NextResponse } from 'next/server';

// TEMPORARY — delete this file after confirming email works
export async function GET() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const adminEmail = process.env.BOOKING_NOTIFY_EMAIL?.trim();

  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 });
  if (!adminEmail) return NextResponse.json({ error: 'BOOKING_NOTIFY_EMAIL not set' }, { status: 500 });

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: 'NoTime Storage <noreply@notimestorage.co>',
      to: adminEmail,
      subject: '✅ NoTime Storage — Email test',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#F7F3EE;border-radius:12px;">
          <h2 style="color:#4B2E25;margin-top:0;">Email is working! 🎉</h2>
          <p style="color:#4A3A34;">This is a test email from NoTime Storage.<br/>
          If you received this, Resend + your domain are correctly configured.</p>
          <hr style="border-color:#E7D3BF;"/>
          <p style="color:#888;font-size:12px;">Sent to: ${adminEmail}<br/>Delete /app/api/test-email/route.ts after confirming.</p>
        </div>
      `,
    });

    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ success: true, sent_to: adminEmail, id: data?.id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
