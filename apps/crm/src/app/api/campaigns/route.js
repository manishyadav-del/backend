import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId') || 'demo';

  try {
    const campaigns = await prisma.emailCampaign.findMany({
      where: { projectId },
      include: {
        list: true,
        logs: {
          select: { status: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, campaigns });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { projectId = 'demo', name, subject, body: emailBody, listId, scheduledAt } = body;

    if (!name || !subject || !emailBody) {
      return NextResponse.json({ success: false, error: 'Name, subject, and body are required' }, { status: 400 });
    }

    const campaign = await prisma.emailCampaign.create({
      data: {
        projectId,
        name,
        subject,
        body: emailBody,
        listId,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: scheduledAt ? 'scheduled' : 'draft'
      }
    });

    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
