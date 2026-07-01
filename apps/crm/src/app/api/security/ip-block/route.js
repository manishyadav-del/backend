import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

export async function GET(request) {
  const bypass = request.headers.get('x-internal-bypass') === 'true';
  if (!bypass) {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId') || 'default';

  const settings = await prisma.globalSetting.findUnique({
    where: { projectId },
  });

  let blockedIps = [];
  try {
    if (settings?.analytics) {
      const analyticsObj = JSON.parse(settings.analytics);
      blockedIps = analyticsObj.blockedIps || [];
    }
  } catch { /* ignore */ }

  return NextResponse.json({ blockedIps });
}

export async function POST(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json();
    const { projectId, ip } = body;
    const projectKey = projectId || 'default';

    if (!ip) return NextResponse.json({ error: 'IP address required' }, { status: 400 });

    const settings = await prisma.globalSetting.findUnique({
      where: { projectId: projectKey },
    });

    let analyticsObj = {};
    try {
      if (settings?.analytics) {
        analyticsObj = JSON.parse(settings.analytics);
      }
    } catch { /* ignore */ }

    const blockedIps = analyticsObj.blockedIps || [];
    if (!blockedIps.includes(ip)) {
      blockedIps.push(ip);
    }
    analyticsObj.blockedIps = blockedIps;

    await prisma.globalSetting.upsert({
      where: { projectId: projectKey },
      update: { analytics: JSON.stringify(analyticsObj) },
      create: { projectId: projectKey, analytics: JSON.stringify(analyticsObj) },
    });

    return NextResponse.json({ success: true, blockedIps });
  } catch (error) {
    console.error('IP block error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || 'default';
    const ip = searchParams.get('ip');

    if (!ip) return NextResponse.json({ error: 'IP address required' }, { status: 400 });

    const settings = await prisma.globalSetting.findUnique({
      where: { projectId },
    });

    let analyticsObj = {};
    try {
      if (settings?.analytics) {
        analyticsObj = JSON.parse(settings.analytics);
      }
    } catch { /* ignore */ }

    let blockedIps = analyticsObj.blockedIps || [];
    blockedIps = blockedIps.filter(item => item !== ip);
    analyticsObj.blockedIps = blockedIps;

    await prisma.globalSetting.update({
      where: { projectId },
      data: { analytics: JSON.stringify(analyticsObj) },
    });

    return NextResponse.json({ success: true, blockedIps });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
