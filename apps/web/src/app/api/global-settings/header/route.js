import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';
import { revalidateTag } from 'next/cache';

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });

  const settings = await prisma.globalSetting.findUnique({ where: { projectId } });

  let headerSettings = {};
  try {
    headerSettings = settings?.headerSettings ? JSON.parse(settings.headerSettings) : {};
  } catch { /* ignore */ }

  return NextResponse.json({ success: true, data: headerSettings });
}

export async function PUT(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { projectId, ...headerConfig } = body;

    if (!projectId) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });

    const settings = await prisma.globalSetting.upsert({
      where: { projectId },
      update: { headerSettings: JSON.stringify(headerConfig) },
      create: { projectId, headerSettings: JSON.stringify(headerConfig) },
    });

    // Invalidate cached global settings on frontend
    revalidateTag('global-settings');

    await prisma.activityLog.create({
      data: { userId: user.id, action: 'settings.header_updated', entity: 'GlobalSetting', entityId: settings.id, details: 'Header builder settings saved' },
    });

    return NextResponse.json({ success: true, data: headerConfig });
  } catch (error) {
    console.error('Header settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
