import nodemailer from 'nodemailer';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let transporter: any = null;

// Type for sendMail input
interface SendMailOptions {
  to: string;
  subject: string;
  body: string; // HTML content
}

// Function to send email
export async function sendMail({ to, subject, body }: SendMailOptions): Promise<void> {
  const EMAIL_USER = process.env.EMAIL_USER;
  const EMAIL_PASSWORD = process.env.EMAIL_PASS;
  const EMAIL_FROM = process.env.EMAIL_FROM ?? EMAIL_USER; // fallback to login email if FROM not set

  // Validate that the required env vars are present
  if (!EMAIL_USER || !EMAIL_PASSWORD) {
    console.error('❌ EMAIL_USER and EMAIL_PASS must be set in environment variables.');
    throw new Error('Email credentials are not configured.');
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp.ionos.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
      },
    });
  }

  try {
    await transporter.sendMail({
      from: `"A Health Place" <${EMAIL_FROM}>`, // ✅ Correct string interpolation
      to,
      subject,
      html: body,
    });

    console.log(`✅ Email sent successfully to ${to}`);
  } catch (error) {
    console.error('❌ Nodemailer Error:', error);
    throw new Error('Failed to send email. Please check mail server credentials.');
  }
}
