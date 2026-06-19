import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { projectId, sessionId, page, userAgent, ip, country, device, browser, source } = body;

    if (!projectId || !sessionId || !page) {
      return NextResponse.json({ error: 'projectId, sessionId, and page are required' }, { status: 400 });
    }

    await prisma.visitorSession.upsert({
      where: { sessionId },
      update: {
        page,
        isActive: true,
        lastSeen: new Date(),
      },
      create: {
        projectId,
        sessionId,
        page,
        userAgent,
        ip,
        country,
        device,
        browser,
        source,
        isActive: true,
        lastSeen: new Date(),
      },
    });

    // Mark stale sessions as inactive (no heartbeat > 30s)
    await prisma.visitorSession.updateMany({
      where: {
        projectId,
        isActive: true,
        lastSeen: { lt: new Date(Date.now() - 30 * 1000) },
        sessionId: { not: sessionId },
      },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Visitor track error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    const { sessionId } = body;
    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

    await prisma.visitorSession.updateMany({
      where: { sessionId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
