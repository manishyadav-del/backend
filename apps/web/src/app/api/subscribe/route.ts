import { NextRequest, NextResponse } from 'next/server';
import db from '../../../lib/db';
import { sendMail } from '../../../lib/mail';

interface SubscribeRequestBody {
  email?: string;
}

const subscriberEmailBody = `
  <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.5; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
    <h2 style="color: #27ae60;">Thank you for subscribing!</h2>
    <p>Hi there,</p>
    <p>Thank you for subscribing to <strong>A Health Place</strong>. We're excited to have you with us.</p>
    <p>You will now receive updates, news, and special offers straight to your inbox.</p>
    <p>If you have any questions or want to get in touch, just reply to this email.</p>
    <br />
    <p style="font-size: 14px; color: #777;">Stay healthy,<br />The A Health Place Team</p>
  </div>
`;


const adminEmailBody = (email: string) => `
  <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.5; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
    <h2 style="color: #2980b9;">New Subscription Alert</h2>
    <p>Hello Admin,</p>
    <p>A new user has subscribed to <strong>A Health Place</strong> newsletter.</p>
    <p><strong>Subscriber Email:</strong> ${email}</p>
    <p>You may want to add them to your mailing list or CRM.</p>
    <br />
    <p style="font-size: 14px; color: #777;">This is an automated notification.</p>
  </div>
`;


const ADMIN_EMAIL = 'ahealthplace@gmail.com';  // <-- Replace with your admin email

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: SubscribeRequestBody = await request.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ message: "Email is required." }, { status: 400 });
    }

    // Check if the email already exists
    const checkSql = "SELECT * FROM `subscribers` WHERE `email` = ?";
    const result = await db.query(checkSql, [email]);
    const existing = Array.isArray(result[0]) ? result[0] : result;

    if (existing.length > 0) {
      return NextResponse.json({ message: "You have already subscribed." }, { status: 409 });
    }

    // Insert the new subscriber
    const insertSql = "INSERT INTO `subscribers` (`email`) VALUES (?)";
    await db.query(insertSql, [email]);

    // Send thank-you email (fire-and-forget)
    sendMail({
      to: email,
      subject: "Thank you for subscribing!",
      body:subscriberEmailBody,
    }).catch((err) => {
      console.error(`❌ Email error for subscriber ${email}:`, err);
    });

    // Send notification email to admin (fire-and-forget)
    sendMail({
      to: ADMIN_EMAIL,
      subject: "New Subscription Received",
      body:adminEmailBody(email),
    }).catch((err) => {
      console.error("❌ Email error for admin notification:", err);
    });

    return NextResponse.json({ message: "Successfully subscribed!" }, { status: 200 });

  } catch (error: unknown) {
    console.error("❌ Subscribe API Error:", error);
    return NextResponse.json({ message: "Internal Server Error." }, { status: 500 });
  }
}
