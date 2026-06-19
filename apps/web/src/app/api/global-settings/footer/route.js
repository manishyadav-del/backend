import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });

  const settings = await prisma.globalSetting.findUnique({ where: { projectId } });

  let footerSettings = {};
  try {
    footerSettings = settings?.footerSettings ? JSON.parse(settings.footerSettings) : {};
  } catch { /* ignore */ }

  return NextResponse.json({ success: true, data: footerSettings });
}

export async function PUT(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { projectId, ...footerConfig } = body;

    if (!projectId) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });

    const settings = await prisma.globalSetting.upsert({
      where: { projectId },
      update: { footerSettings: JSON.stringify(footerConfig) },
      create: { projectId, footerSettings: JSON.stringify(footerConfig) },
    });

    await prisma.activityLog.create({
      data: { userId: user.id, action: 'settings.footer_updated', entity: 'GlobalSetting', entityId: settings.id, details: 'Footer builder settings saved' },
    });

    return NextResponse.json({ success: true, data: footerConfig });
  } catch (error) {
    console.error('Footer settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
