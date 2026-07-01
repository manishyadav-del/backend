import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function POST(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json({ success: false, error: 'Notification ID is required' }, { status: 400 });
    }

    const notification = await prisma.pushNotification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return NextResponse.json({ success: false, error: 'Push notification record not found' }, { status: 404 });
    }

    // Retrieve OneSignal Credentials
    const settings = await prisma.emailSetting.findUnique({
      where: { projectId: notification.projectId }
    });

    if (!settings || !settings.oneSignalAppId || !settings.oneSignalRestKey) {
      return NextResponse.json({
        success: false,
        error: 'OneSignal App ID and REST Key are not configured. Please fill in credentials first.'
      }, { status: 400 });
    }

    // Trigger push dispatch via OneSignal API
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${settings.oneSignalRestKey}`
      },
      body: JSON.stringify({
        app_id: settings.oneSignalAppId,
        headings: { en: notification.title },
        contents: { en: notification.message },
        url: notification.url || undefined,
        included_segments: ['Subscribed Users']
      })
    });

    const data = await response.json();

    if (response.ok && !data.errors) {
      // Update push notification status
      await prisma.pushNotification.update({
        where: { id: notificationId },
        data: {
          status: 'sent',
          oneSignalId: data.id,
          sentCount: data.recipients || 0,
          sentAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Push notification dispatched successfully!',
        recipients: data.recipients || 0
      });
    } else {
      const errorMsg = data.errors ? data.errors.join(', ') : 'OneSignal API request failed';
      
      await prisma.pushNotification.update({
        where: { id: notificationId },
        data: { status: 'failed' }
      });

      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
