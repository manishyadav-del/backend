/**
 * Email Helper — nodemailer-based email delivery
 * Falls back to console.log in development if SMTP is not configured.
 */
import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@globalbackend.app';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Returns true if SMTP is properly configured
 */
function isSMTPConfigured() {
  return !!(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

/**
 * Create a nodemailer transporter
 */
function createTransporter() {
  if (!isSMTPConfigured()) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

/**
 * Send password reset email
 * @param {string} to
 * @param {string} token
 * @returns {Promise<{success: boolean, preview?: string}>}
 */
export async function sendPasswordResetEmail(to, token) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8" /><title>Reset Your Password</title></head>
    <body style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; background: #09090b; color: #f4f4f5; padding: 40px 20px; margin: 0;">
      <div style="max-width: 520px; margin: 0 auto; background: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="width: 52px; height: 52px; background: linear-gradient(135deg, #0ea5e9, #06b6d4); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 16px;">⚡</div>
          <h1 style="font-size: 22px; font-weight: 800; color: #ffffff; margin: 0 0 8px;">Reset Your Password</h1>
          <p style="color: #a1a1aa; font-size: 14px; margin: 0;">Global Backend — Management Dashboard</p>
        </div>
        <p style="color: #f4f4f5; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
          We received a request to reset the password for your account. Click the button below to set a new password.
          This link will expire in <strong>1 hour</strong>.
        </p>
        <div style="text-align: center; margin-bottom: 28px;">
          <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9, #06b6d4); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 9999px; font-size: 15px; font-weight: 700; letter-spacing: 0.01em;">
            Reset Password
          </a>
        </div>
        <p style="color: #71717a; font-size: 13px; line-height: 1.6;">
          If you did not request a password reset, you can safely ignore this email. Your password will not change.
        </p>
        <hr style="border: none; border-top: 1px solid #27272a; margin: 24px 0;" />
        <p style="color: #52525b; font-size: 12px; text-align: center;">
          Or copy this URL: <span style="color: #0ea5e9;">${resetUrl}</span>
        </p>
      </div>
    </body>
    </html>
  `;

  if (!isSMTPConfigured()) {
    // Development fallback — log the reset URL
    console.log('\n========================================');
    console.log('📧 PASSWORD RESET EMAIL (DEV MODE)');
    console.log('To:', to);
    console.log('Reset URL:', resetUrl);
    console.log('(Configure SMTP_* env vars to send real emails)');
    console.log('========================================\n');
    return { success: true, devMode: true, resetUrl };
  }

  const transporter = createTransporter();
  try {
    const info = await transporter.sendMail({
      from: `"Global Backend" <${SMTP_FROM}>`,
      to,
      subject: 'Reset your Global Backend password',
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('Failed to send password reset email:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Test SMTP connection with saved settings
 * @param {object} settings - {host, port, user, pass, from}
 */
export async function testSMTPConnection(settings) {
  try {
    const transporter = nodemailer.createTransport({
      host: settings.host,
      port: parseInt(settings.port || '587', 10),
      secure: parseInt(settings.port) === 465,
      auth: { user: settings.user, pass: settings.pass },
    });
    await transporter.verify();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Send a generic email using saved SMTP settings
 */
export async function sendEmailWithSettings(settings, { to, subject, html }) {
  try {
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: parseInt(settings.smtpPort || '587', 10),
      secure: parseInt(settings.smtpPort) === 465,
      auth: { user: settings.smtpUser, pass: settings.smtpPass },
    });
    await transporter.sendMail({
      from: `"Global Backend" <${settings.smtpUser}>`,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
