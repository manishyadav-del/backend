import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { getAuthUser } from '@/lib/auth.js';

export async function GET(request) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get('websiteId');
    const module = searchParams.get('module');

    const where = {};
    if (websiteId) where.websiteId = websiteId;
    if (module) where.assignedModule = module;

    const routes = await prisma.websiteRoute.findMany({
      where,
      include: {
        website: {
          select: { id: true, name: true, domain: true, framework: true }
        }
      },
      orderBy: [{ websiteId: 'asc' }, { path: 'asc' }]
    });

    return NextResponse.json({ success: true, data: routes, count: routes.length });
  } catch (error) {
    console.error('GET /api/routes error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
