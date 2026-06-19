import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { testSMTPConnection, sendEmailWithSettings } from '@/lib/email.js';

export async function POST(request) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { smtpHost, smtpPort, smtpUser, smtpPass, toEmail } = body;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !toEmail) {
      return NextResponse.json({ error: 'All connection parameters and recipient email are required' }, { status: 400 });
    }

    // 1. Verify connection
    const connCheck = await testSMTPConnection({
      host: smtpHost,
      port: smtpPort,
      user: smtpUser,
      pass: smtpPass
    });

    if (!connCheck.success) {
      return NextResponse.json({ error: `Connection failed: ${connCheck.error}` }, { status: 400 });
    }

    // 2. Send test email
    const emailCheck = await sendEmailWithSettings({
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass
    }, {
      to: toEmail,
      subject: 'Global Backend SMTP Test Email',
      html: `
        <div style="font-family: sans-serif; padding: 20px; background: #fafafa; border: 1px solid #eee; border-radius: 8px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0ea5e9; margin-top: 0;">⚡ SMTP Test Success!</h2>
          <p>This is a test email confirming that your SMTP connection settings on Global Backend are configured correctly.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
          <p style="color: #666; fontSize: 12px;">Sent from Global Backend Management Dashboard.</p>
        </div>
      `
    });

    if (!emailCheck.success) {
      return NextResponse.json({ error: `Connection succeeded, but failed to send email: ${emailCheck.error}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Test email sent successfully!' });
  } catch (error) {
    console.error('SMTP test error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
