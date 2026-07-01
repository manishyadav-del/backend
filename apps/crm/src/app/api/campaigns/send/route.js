import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';
import nodemailer from 'nodemailer';

export async function POST(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { campaignId } = body;

    if (!campaignId) {
      return NextResponse.json({ success: false, error: 'Campaign ID is required' }, { status: 400 });
    }

    // Load Campaign
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: campaignId },
      include: { list: true }
    });

    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }

    if (!campaign.listId) {
      return NextResponse.json({ success: false, error: 'No list assigned to campaign' }, { status: 400 });
    }

    // Fetch Subscribers belonging to the list
    const memberships = await prisma.subscriberListMember.findMany({
      where: { listId: campaign.listId },
      include: { subscriber: true }
    });

    const subscribers = memberships.map(m => m.subscriber).filter(s => s.status === 'active');

    if (subscribers.length === 0) {
      return NextResponse.json({ success: false, error: 'No active subscribers found in this list' }, { status: 400 });
    }

    // Retrieve SMTP Settings
    const settings = await prisma.emailSetting.findUnique({
      where: { projectId: campaign.projectId }
    });

    // Configure Transporter dynamically from DB, or fall back to ENV
    let transporter;
    const fromAddress = settings?.formEmail || process.env.EMAIL_FROM || 'newsletter@ahealthplace.com';

    if (settings && settings.smtpHost && settings.smtpUser && settings.smtpPass) {
      transporter = nodemailer.createTransport({
        host: settings.smtpHost,
        port: settings.smtpPort || 587,
        secure: settings.smtpPort === 465,
        auth: {
          user: settings.smtpUser,
          pass: settings.smtpPass
        }
      });
    } else if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      transporter = nodemailer.createTransport({
        host: 'smtp.ionos.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    } else {
      return NextResponse.json({ success: false, error: 'SMTP Mail Server is not configured. Please fill in credentials first.' }, { status: 400 });
    }

    // Mark campaign as sending
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { status: 'sending' }
    });

    let successCount = 0;
    let failedCount = 0;

    // Send emails
    for (const sub of subscribers) {
      try {
        await transporter.sendMail({
          from: `"A Health Place" <${fromAddress}>`,
          to: sub.email,
          subject: campaign.subject,
          html: campaign.body
        });

        // Log success
        await prisma.campaignLog.create({
          data: {
            campaignId,
            subscriberId: sub.id,
            status: 'sent',
            sentAt: new Date()
          }
        });

        successCount++;
      } catch (err) {
        console.error(`Failed to send email to ${sub.email}:`, err);
        
        // Log failure
        await prisma.campaignLog.create({
          data: {
            campaignId,
            subscriberId: sub.id,
            status: 'failed',
            errorMessage: err.message
          }
        });

        failedCount++;
      }
    }

    // Update campaign status
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        status: failedCount === 0 ? 'sent' : 'failed',
        sentAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: `Dispatched campaign! Sent: ${successCount}, Failed: ${failedCount}`,
      sent: successCount,
      failed: failedCount
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
