import { NextResponse } from 'next/server';
import pool from '@/lib/db'; // make sure your DB connection is correctly exported here
import { sendMail } from '@/lib/mail';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, message } = body;

    // Validate input
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Insert into DB
    await pool.query(
      'INSERT INTO contact (name, email, message) VALUES (?, ?, ?)',
      [name, email, message]
    );

    // Sync submission to Global Backend Forms API
    try {
      const apiKey = process.env.GLOBAL_BACKEND_API_KEY || 'gbl_api_key_main_2024_v2';
      const rawBackendUrl = process.env.NEXT_PUBLIC_GLOBAL_BACKEND_URL || 'http://127.0.0.1:3000';
      const backendUrl = rawBackendUrl.replace('localhost', '127.0.0.1');
      
      const formsRes = await fetch(`${backendUrl}/api/forms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          formType: 'contact',
          name,
          email,
          message,
        }),
      });

      if (!formsRes.ok) {
        const errorData = await formsRes.json().catch(() => ({}));
        console.error('[Forms Sync Warning] Failed to sync contact submission to backend:', errorData.error || formsRes.statusText);
      } else {
        console.log('[Forms Sync] Successfully synced contact submission to global backend.');
      }
    } catch (syncError) {
      console.error('[Forms Sync Warning] Connection to global backend forms API failed:', syncError);
    }

    // Send confirmation email to the user (only if local SMTP is configured)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        await sendMail({
          to: email,
          subject: 'Thank you for contacting A Health Place',
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
              <h2 style="color: #4ccbc4; text-align: center;">Thank You for Reaching Out!</h2>
              <p>Dear ${name},</p>
              <p>Thank you for contacting A Health Place. We have received your message and will get back to you as soon as possible.</p>
              <p><strong>Your Message:</strong></p>
              <p style="background-color: #f9f9f9; padding: 10px; border-radius: 5px;">${message.replace(/\n/g, '<br>')}</p>
              <p>If you have any urgent questions, feel free to reply to this email.</p>
              <p>Best regards,<br>The A Health Place Team</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="font-size: 12px; color: #666; text-align: center;">This is an automated response. Please do not reply to this email.</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
      }
    } else {
      console.log('[Email Info] Skipping direct website email delivery; delegated to Global Backend SMTP setup.');
    }

    return NextResponse.json({ success: true, message: 'Submission saved successfully.' });
  } catch (error) {
    console.error('Error saving contact form:', error);
    return NextResponse.json({ error: 'Server error', details: (error as Error).message }, { status: 500 });
  }
}
