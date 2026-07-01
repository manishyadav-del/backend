import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });

  const settings = await prisma.emailSetting.findUnique({
    where: { projectId },
  });

  return NextResponse.json({ settings });
}

export async function POST(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { projectId, smtpHost, smtpPort, smtpUser, smtpPass, formEmail, autoReplyTemplate, adminAlerts, oneSignalAppId, oneSignalRestKey } = body;

  const settings = await prisma.emailSetting.upsert({
    where: { projectId },
    update: {
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      formEmail,
      autoReplyTemplate,
      adminAlerts,
      oneSignalAppId,
      oneSignalRestKey,
    },
    create: {
      projectId,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      formEmail,
      autoReplyTemplate,
      adminAlerts,
      oneSignalAppId,
      oneSignalRestKey,
    },
  });

  return NextResponse.json({ settings });
}