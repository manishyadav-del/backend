import { NextResponse } from 'next/server';
import { validateApiKey, unauthorizedResponse } from '@/lib/apiKey.js';
import prisma from '@/lib/prisma.js';

export async function GET(request) {
  try {
    const project = await validateApiKey(request);
    if (!project) return unauthorizedResponse();

    const stats = await prisma.page.aggregate({
      where: { projectId: project.id },
      _count: { id: true },
      _max: { lastSyncedAt: true }
    });

    return NextResponse.json({
      pageCount: stats._count.id,
      lastSync: stats._max.lastSyncedAt
    });
  } catch (error) {
    console.error('Sync status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
